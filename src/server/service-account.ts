/**
 * Service-account Firestore writer for trusted security audit
 * records. SERVER-ONLY.
 *
 * Why a service account: Firestore rules cannot distinguish "the
 * browser wrote directly" from "our endpoint wrote with the user's
 * token" - both carry the same identity. Trusted audit records
 * therefore bypass client writes entirely: the rules deny ALL client
 * creates on `security_logs`, and the only writer is this module,
 * using a Google service account (which bypasses rules the way the
 * Admin SDK does). The endpoint authorizes the action BEFORE calling
 * here (verified ID token + rate-limit gate), so the trust decision
 * is made in server code, not by the caller.
 *
 * Configuration: FIREBASE_SERVICE_ACCOUNT holds the service-account
 * key JSON (raw or base64-encoded). When unset, this module reports
 * itself unconfigured and the endpoint fails closed (503). The key
 * is a production secret: Vercel env only, never committed.
 */

import { SignJWT, importPKCS8 } from "jose";

export interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
}

/** Parse the env value: raw JSON or base64-encoded JSON. */
export function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw?.trim()) return null;
  const candidates = [raw.trim()];
  try {
    candidates.push(Buffer.from(raw.trim(), "base64").toString("utf8"));
  } catch {
    /* not base64, the raw candidate stands alone */
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Partial<ServiceAccount>;
      if (
        typeof parsed.client_email === "string" &&
        parsed.client_email.includes("@") &&
        typeof parsed.private_key === "string" &&
        parsed.private_key.includes("BEGIN PRIVATE KEY")
      ) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key,
          project_id: typeof parsed.project_id === "string" ? parsed.project_id : undefined,
        };
      }
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

export function getServiceAccount(): ServiceAccount | null {
  return parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
}

/* ------------------------- access tokens ------------------------ */

let tokenCache: { token: string; expiresAt: number } | null = null;

async function mintAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - 300_000 > now) return tokenCache.token;
  const key = await importPKCS8(sa.private_key, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/datastore" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!resp.ok) throw new Error("token_exchange_failed");
  const data = (await resp.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: data.access_token, expiresAt: now + data.expires_in * 1000 };
  return data.access_token;
}

/** Mint a fresh OAuth token for an arbitrary scope (no cache: used
    for rare admin operations, e.g. Auth user deletion, where the
    datastore scope is not enough). */
export async function mintScopedAccessToken(scope: string): Promise<string> {
  const sa = getServiceAccount();
  if (!sa) throw new Error("service_account_unconfigured");
  const key = await importPKCS8(sa.private_key, "RS256");
  const assertion = await new SignJWT({ scope })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!resp.ok) throw new Error("token_exchange_failed");
  const data = (await resp.json()) as { access_token: string };
  return data.access_token;
}

/* --------------------------- writing ---------------------------- */

export type WriteOutcome = "written" | "exists" | "error";

/** Map a Firestore REST status to a write outcome (409 = the
 *  client-supplied eventId is already recorded: an idempotent
 *  retry, reported as success so no duplicate is ever created). */
export function firestoreOutcomeForStatus(status: number): WriteOutcome {
  if (status >= 200 && status < 300) return "written";
  if (status === 409) return "exists";
  return "error";
}

export async function writeSecurityLogDoc(
  projectId: string,
  docId: string,
  fields: Record<string, unknown>,
): Promise<WriteOutcome> {
  const sa = getServiceAccount();
  if (!sa) return "error";
  let token: string;
  try {
    token = await mintAccessToken(sa);
  } catch {
    return "error";
  }
  try {
    const resp = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/security_logs?documentId=${encodeURIComponent(docId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fields }),
      },
    );
    return firestoreOutcomeForStatus(resp.status);
  } catch {
    return "error";
  }
}
