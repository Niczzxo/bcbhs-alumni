/**
 * Security audit logging + auth hardening helpers.
 *
 * Audit log: `security_logs` records are TRUSTED records. They can
 * only be created by the server endpoint POST /api/security/log,
 * which verifies the actor from the Firebase ID token, applies
 * distributed rate limiting, and writes with a service account.
 * Firestore rules deny ALL client creates on the collection, and
 * this client has NO direct-write fallback (security-delivery.ts):
 * if the endpoint refuses or is down, the event is dropped rather
 * than written through an unverifiable path. Readable ONLY by the
 * super admin; entries can never be edited or deleted by a client. Events NEVER contain passwords, tokens, OTPs or raw
 * email addresses: pre-auth events carry a SHA-256 hash of the
 * normalized identifier, post-auth events carry user IDs (which the
 * super admin can already see in the members list).
 *
 * Demo mode keeps the same trail in a capped localStorage ring so the
 * behaviour is identical without Firebase.
 */

import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { LoginThrottle, normalizeIdentifier } from "@/lib/throttle";
import { deliverSecurityEvent } from "@/lib/security-delivery";

export type SecurityEventType =
  | "login_success"
  | "login_failed"
  | "login_throttled"
  | "logout"
  | "password_reset_requested"
  | "member_approved"
  | "member_rejected"
  | "member_banned"
  | "member_unbanned"
  | "role_changed"
  | "permissions_changed"
  | "position_changed"
  | "password_changed"
  | "email_change_requested"
  | "guest_visibility_changed";

export interface SecurityEventDetails {
  targetUid?: string;
  /** Raw identifier to hash (never stored raw). */
  identifier?: string;
  meta?: Record<string, string | number | boolean>;
}

const DEMO_LOG_KEY = "bcbhs-security-log-demo";
const DEMO_LOG_CAP = 200;

/** SHA-256 of the normalized identifier, truncated for storage. */
export async function hashIdentifier(raw: string): Promise<string> {
  const normalized = normalizeIdentifier(raw);
  try {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`bcbhs:${normalized}`),
    );
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  } catch {
    /* WebCrypto unavailable (very old browser): fall back to a plain
       non-reversible marker rather than skipping the audit entry. */
    let h = 0;
    for (let i = 0; i < normalized.length; i++) h = (h * 31 + normalized.charCodeAt(i)) | 0;
    return `weak:${(h >>> 0).toString(16)}`;
  }
}

function currentActorUid(): string | null {
  if (isFirebaseConfigured) return auth?.currentUser?.uid ?? null;
  try {
    return window.localStorage.getItem("bcbhs-demo-user-id");
  } catch {
    return null;
  }
}

/**
 * Record one security event. Fire-and-forget by design: auditing must
 * never break or delay the action it records, so every failure here
 * is swallowed silently.
 */
export async function logSecurityEvent(
  type: SecurityEventType,
  details: SecurityEventDetails = {},
): Promise<void> {
  try {
    /* Pre-auth events are about an unauthenticated attempt, so they
       carry no actor even if a stale session object exists. */
    const isPreAuth =
      type === "login_failed" || type === "login_throttled" || type === "password_reset_requested";
    const entry: Record<string, unknown> = {
      type,
      actorUid: isPreAuth ? null : currentActorUid(),
    };
    if (details.targetUid) entry.targetUid = details.targetUid;
    if (details.identifier) entry.identifierHash = await hashIdentifier(details.identifier);
    if (details.meta) entry.meta = details.meta;

    if (!isFirebaseConfigured || !db) {
      try {
        const raw = window.localStorage.getItem(DEMO_LOG_KEY);
        const list = raw ? (JSON.parse(raw) as unknown[]) : [];
        list.push({ ...entry, createdAt: new Date().toISOString() });
        window.localStorage.setItem(DEMO_LOG_KEY, JSON.stringify(list.slice(-DEMO_LOG_CAP)));
      } catch {
        /* storage unavailable, demo trail is best-effort */
      }
      return;
    }
    /* The ONLY live delivery path: the protected ingest endpoint.
       No direct-write fallback exists (rules deny client creates,
       and a fallback would bypass rate limiting and actor
       verification). 429/503 drop the event by design. */
    const payload: Record<string, unknown> = { type, eventId: crypto.randomUUID() };
    if (details.targetUid) payload.targetUid = details.targetUid;
    if (entry.identifierHash) payload.identifierHash = entry.identifierHash;
    if (details.meta) payload.meta = details.meta;
    const token =
      !isPreAuth && auth?.currentUser
        ? await auth.currentUser.getIdToken().catch(() => null)
        : null;
    await deliverSecurityEvent({
      fetchFn: (url, init) => fetch(url, init as RequestInit),
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
      payload,
      token,
    });
  } catch {
    /* auditing is best-effort; the action itself already happened */
  }
}

/** The shared client-side login throttle (one per browser session). */
export const loginThrottle = new LoginThrottle();

/** The login field a sign-in failure belongs to, when known. */
export type AuthErrorField = "email" | "password";

export interface AuthErrorInfo {
  message: string;
  /** Set when Firebase names the failing field; the login form then
   *  marks ONLY that field instead of showing a shared banner. */
  field?: AuthErrorField;
}

/**
 * Map a Firebase Auth failure to a user-facing message, attached to
 * the field that caused it whenever Firebase reports one distinctly
 * (owner's instruction, 2026-10-24: whichever is wrong, email or
 * password, show "incorrect" for that one only). Only our own mapped
 * messages are ever shown, never the raw provider text.
 *
 * Live-project reality (REST-verified 2026-10-24): this project's
 * email enumeration protection is ON. A wrong password and an
 * unknown email BOTH fail sign-in with auth/invalid-credential, and
 * fetchSignInMethodsForEmail (createAuthUri) deliberately answers
 * identically for both, so credential failures cannot be told apart
 * on the client; they keep the one shared message. The per-field
 * mapping engages wherever Firebase does report the failure
 * distinctly (auth/user-not-found, auth/wrong-password,
 * auth/invalid-email, e.g. if enumeration protection is ever
 * switched off for the project).
 */
export function authErrorInfo(e: unknown): AuthErrorInfo {
  const code =
    typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";
  switch (code) {
    case "auth/user-not-found":
      return { field: "email", message: "This email is not registered." };
    case "auth/wrong-password":
      return { field: "password", message: "Password is incorrect." };
    case "auth/invalid-credential":
      return { message: "Email or password is incorrect." };
    case "auth/invalid-email":
      return { field: "email", message: "That email address does not look valid." };
    case "auth/too-many-requests":
      return {
        message: "Too many attempts from this network. Please wait a few minutes and try again.",
      };
    case "auth/network-request-failed":
      return { message: "Network problem. Check your connection and try again." };
    case "auth/user-disabled":
      return { message: "This account has been disabled. Please contact the admin." };
    default:
      return { message: "Login failed. Please try again." };
  }
}

/** Message-only view of authErrorInfo (kept for existing callers). */
export function friendlyAuthError(e: unknown): string {
  return authErrorInfo(e).message;
}
