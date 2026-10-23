/**
 * POST /api/security/log — the site's application-controlled audit
 * ingest endpoint, protected by distributed (Upstash Redis) rate
 * limiting.
 *
 * Pipeline: body validation → rate-limit gate (BEFORE any expensive
 * work; fails closed with 503 when Redis is unconfigured or down) →
 * Firebase ID-token verification (the actor is taken from the
 * VERIFIED token, never from the request body) → Firestore write via
 * the REST API with the caller's own token forwarded, so Firestore
 * security rules still authorize the write exactly as a direct
 * client write.
 *
 * This endpoint does NOT handle logins. Firebase Authentication
 * requests (sign-in, registration, password reset, OTP) travel from
 * the browser directly to Google and are throttled there; see
 * SECURITY.md §3.
 */

import { NextResponse } from "next/server";
import { clientIp, getIngestLimiters, ingestGate, rateLimitSecret } from "@/server/ratelimit";
import { verifyFirebaseIdToken } from "@/server/verify-token";

const EVENT_TYPES = new Set([
  "login_success",
  "login_failed",
  "login_throttled",
  "logout",
  "password_reset_requested",
  "member_approved",
  "member_rejected",
  "member_banned",
  "member_unbanned",
  "role_changed",
  "permissions_changed",
  "position_changed",
  "guest_visibility_changed",
]);

/** Event types that legitimately arrive with no signed-in actor. */
const PRE_AUTH_TYPES = new Set(["login_failed", "login_throttled", "password_reset_requested"]);

const MAX_BODY_BYTES = 4096;

function json(status: number, body: Record<string, unknown>, headers?: Record<string, string>) {
  return NextResponse.json(body, { status, headers });
}

type FieldValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { nullValue: null }
  | { timestampValue: string };

function metaFieldValue(v: string | number | boolean): FieldValue {
  if (typeof v === "string") return { stringValue: v.slice(0, 120) };
  if (typeof v === "boolean") return { booleanValue: v };
  return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
}

export async function POST(req: Request) {
  /* ---- 1. Parse + validate (cheap, before any security work) ---- */
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: "payload_too_large" });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json(400, { error: "invalid_request" });
  }
  const type = typeof body.type === "string" ? body.type : "";
  if (!EVENT_TYPES.has(type)) return json(400, { error: "invalid_request" });
  const identifierHash =
    typeof body.identifierHash === "string" && /^[0-9a-f:]{8,64}$/.test(body.identifierHash)
      ? body.identifierHash
      : null;
  const targetUid =
    typeof body.targetUid === "string" && body.targetUid.length <= 128 ? body.targetUid : null;
  const meta: Record<string, string | number | boolean> = {};
  if (body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)) {
    for (const [k, v] of Object.entries(body.meta as Record<string, unknown>).slice(0, 8)) {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        meta[k.slice(0, 40)] = v;
      }
    }
  }
  if (PRE_AUTH_TYPES.has(type) && !identifierHash) return json(400, { error: "invalid_request" });

  /* ---- 2. Rate-limit gate (fail closed; before token/Firestore) -- */
  const gate = await ingestGate({
    limiters: getIngestLimiters(),
    secret: rateLimitSecret(),
    ip: clientIp(req.headers),
    identifierHash,
  });
  if (!gate.ok && gate.status === 503) return json(503, { error: "security_service_unavailable" });
  if (!gate.ok) {
    return json(
      429,
      { error: "rate_limited", retryAfter: gate.retryAfterSeconds },
      { "Retry-After": String(gate.retryAfterSeconds) },
    );
  }

  /* ---- 3. Actor from the verified ID token, never from the body -- */
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return json(503, { error: "security_service_unavailable" });
  let actorUid: string | null = null;
  let idToken: string | null = null;
  const authz = req.headers.get("authorization");
  if (authz?.startsWith("Bearer ")) {
    idToken = authz.slice("Bearer ".length);
    const verified = await verifyFirebaseIdToken(idToken, projectId);
    if (!verified) return json(401, { error: "unauthorized" });
    actorUid = verified.uid;
  }
  if (!PRE_AUTH_TYPES.has(type) && !actorUid) return json(401, { error: "unauthorized" });
  if (PRE_AUTH_TYPES.has(type) && actorUid) return json(400, { error: "invalid_request" });

  /* ---- 4. Write via Firestore REST; rules still govern the write - */
  const fields: Record<string, unknown> = {
    type: { stringValue: type },
    actorUid: actorUid ? { stringValue: actorUid } : { nullValue: null },
    createdAt: { timestampValue: new Date().toISOString() },
  };
  if (targetUid) fields.targetUid = { stringValue: targetUid };
  if (identifierHash) fields.identifierHash = { stringValue: identifierHash };
  if (Object.keys(meta).length) {
    fields.meta = {
      mapValue: {
        fields: Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, metaFieldValue(v)])),
      },
    };
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/security_logs?documentId=${crypto.randomUUID()}`;
  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ fields }),
    });
  } catch {
    return json(502, { error: "ingest_failed" });
  }
  if (resp.status === 403) return json(403, { error: "forbidden" });
  if (!resp.ok) return json(502, { error: "ingest_failed" });
  return json(202, { ok: true });
}
