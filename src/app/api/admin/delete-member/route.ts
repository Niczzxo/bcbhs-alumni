/**
 * POST /api/admin/delete-member - permanently delete a BANNED member.
 *
 * One click, complete: the member's Firebase Auth login, profile
 * document, private phone document, and verify document (when one
 * remains) are all removed, so the person can register again anytime
 * with the same email. The deletion is recorded in security_logs as
 * member_deleted.
 *
 * Guards, in order (any failure aborts before the next step):
 *  - Bearer ID token must verify (401).
 *  - Caller must be super_admin per a SERVER-side Firestore read
 *    (403) - the caller's claim in the request is never trusted.
 *  - Target must exist (404), be banned (403), and never be a
 *    super admin or the caller (403).
 *  - Auth deletion runs FIRST; on failure the profile docs stay
 *    untouched (502) so no member is left half-deleted.
 *
 * Server code only: the endpoint mints its own service-account
 * tokens and never trusts client-side role state.
 */

import { NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/server/verify-token";
import {
  getServiceAccount,
  mintScopedAccessToken,
  writeSecurityLogDoc,
} from "@/server/service-account";
import {
  deleteAuthUser,
  deleteFirestoreDoc,
  readFirestoreDoc,
} from "@/server/member-delete";

function json(status: number, body: Record<string, unknown>): NextResponse {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request): Promise<NextResponse> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return json(503, { error: "security_service_unavailable" });
  const authz = req.headers.get("authorization");
  if (!authz?.startsWith("Bearer ")) return json(401, { error: "unauthorized" });
  const verified = await verifyFirebaseIdToken(authz.slice(7), projectId);
  if (!verified) return json(401, { error: "unauthorized" });
  const callerUid = verified.uid;

  let body: { targetUid?: unknown };
  try {
    body = (await req.json()) as { targetUid?: unknown };
  } catch {
    return json(400, { error: "invalid_request" });
  }
  const targetUid =
    typeof body.targetUid === "string" && body.targetUid ? body.targetUid : null;
  if (!targetUid || targetUid === callerUid) return json(400, { error: "invalid_request" });

  if (!getServiceAccount()) return json(503, { error: "security_service_unavailable" });
  let fsToken: string;
  let authToken: string;
  try {
    fsToken = await mintScopedAccessToken("https://www.googleapis.com/auth/datastore");
    authToken = await mintScopedAccessToken("https://www.googleapis.com/auth/cloud-platform");
  } catch {
    return json(502, { error: "token_failed" });
  }

  let callerFields;
  try {
    callerFields = await readFirestoreDoc(projectId, fsToken, `users/${callerUid}`);
  } catch {
    return json(502, { error: "lookup_failed" });
  }
  if (callerFields?.role?.stringValue !== "super_admin") {
    return json(403, { error: "forbidden" });
  }

  let targetFields;
  try {
    targetFields = await readFirestoreDoc(projectId, fsToken, `users/${targetUid}`);
  } catch {
    return json(502, { error: "lookup_failed" });
  }
  if (!targetFields) return json(404, { error: "member_not_found" });
  if (targetFields.status?.stringValue !== "banned") {
    return json(403, { error: "not_banned" });
  }
  if (targetFields.role?.stringValue === "super_admin") {
    return json(403, { error: "forbidden" });
  }
  const memberId = targetFields.memberId?.stringValue;

  // Auth first: a failed login removal aborts with docs intact.
  const authResult = await deleteAuthUser(projectId, authToken, targetUid);
  if (authResult === "error") return json(502, { error: "auth_delete_failed" });

  const docsOk =
    (await deleteFirestoreDoc(projectId, fsToken, `users/${targetUid}`)) &&
    (await deleteFirestoreDoc(projectId, fsToken, `users_private/${targetUid}`)) &&
    (memberId ? await deleteFirestoreDoc(projectId, fsToken, `verify/${memberId}`) : true);
  if (!docsOk) return json(502, { error: "docs_delete_failed" });

  // Audit trail (best effort: the deletion already happened).
  const fields = {
    type: { stringValue: "member_deleted" },
    actorUid: { stringValue: callerUid },
    targetUid: { stringValue: targetUid },
    createdAt: { timestampValue: new Date().toISOString() },
  };
  await writeSecurityLogDoc(projectId, `member_deleted_${Date.now()}_${targetUid}`, fields);
  return json(200, { ok: true });
}
