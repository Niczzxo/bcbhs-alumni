/**
 * POST /api/admin/moderate-member - ban or unban a member, server-side.
 *
 * The client never flips another member's status directly for staff:
 * this endpoint authorizes the caller (verified ID token + server-side
 * reads), flips users/{uid} status, and syncs the public verify doc,
 * so a ban/unban always takes full effect (ID card stops / resumes
 * verifying) in one guarded step.
 *
 * Guards, in order (any failure aborts before the next step):
 *  - Bearer ID token must verify (401).
 *  - Caller must be super_admin, admin or editor (403 otherwise).
 *  - Target must exist (404); nobody moderates themselves (400);
 *    nobody touches a super admin (403).
 *  - Batch reps (admin, owner's rule 2026-10-30): the target must be
 *    a plain member (role == 'member') of the caller's own batch
 *    (403 otherwise). Editors moderate every member as the super
 *    admin's alternative (owner, 2026-10-30): any batch, plain
 *    members only. Super admins keep full power.
 *  - ban needs status 'approved', unban needs status 'banned' (400).
 *
 * The audit trail stays client-side (logSecurityEvent, best effort),
 * as it already is for the super-admin flow.
 */

import { NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/server/verify-token";
import { getServiceAccount, mintScopedAccessToken } from "@/server/service-account";
import { readFirestoreDoc } from "@/server/member-delete";
import { canModerateMember, updateFirestoreDoc } from "@/server/moderation";

function json(status: number, body: Record<string, unknown>): NextResponse {
  return NextResponse.json(body, { status });
}

const strOrNull = (v: unknown) =>
  typeof v === "string" && v ? { stringValue: v } : { nullValue: null };

export async function POST(req: Request): Promise<NextResponse> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return json(503, { error: "security_service_unavailable" });
  const authz = req.headers.get("authorization");
  if (!authz?.startsWith("Bearer ")) return json(401, { error: "unauthorized" });
  const verified = await verifyFirebaseIdToken(authz.slice(7), projectId);
  if (!verified) return json(401, { error: "unauthorized" });
  const callerUid = verified.uid;

  let body: { targetUid?: unknown; action?: unknown };
  try {
    body = (await req.json()) as { targetUid?: unknown; action?: unknown };
  } catch {
    return json(400, { error: "invalid_request" });
  }
  const targetUid =
    typeof body.targetUid === "string" && body.targetUid ? body.targetUid : null;
  const action = body.action === "ban" || body.action === "unban" ? body.action : null;
  if (!targetUid || !action || targetUid === callerUid) {
    return json(400, { error: "invalid_request" });
  }

  if (!getServiceAccount()) return json(503, { error: "security_service_unavailable" });
  let fsToken: string;
  try {
    fsToken = await mintScopedAccessToken("https://www.googleapis.com/auth/datastore");
  } catch {
    return json(502, { error: "token_failed" });
  }

  let callerFields;
  try {
    callerFields = await readFirestoreDoc(projectId, fsToken, `users/${callerUid}`);
  } catch {
    return json(502, { error: "lookup_failed" });
  }
  let targetFields;
  try {
    targetFields = await readFirestoreDoc(projectId, fsToken, `users/${targetUid}`);
  } catch {
    return json(502, { error: "lookup_failed" });
  }
  if (!targetFields) return json(404, { error: "member_not_found" });

  const ok = canModerateMember(
    {
      uid: callerUid,
      role: callerFields?.role?.stringValue,
      batch: callerFields?.batch?.stringValue,
    },
    {
      uid: targetUid,
      role: targetFields.role?.stringValue,
      batch: targetFields.batch?.stringValue,
      status: targetFields.status?.stringValue,
    },
  );
  if (!ok) return json(403, { error: "forbidden" });

  const from = action === "ban" ? "approved" : "banned";
  const to = action === "ban" ? "banned" : "approved";
  if (targetFields.status?.stringValue !== from) {
    return json(400, { error: "invalid_status" });
  }

  const flipped = await updateFirestoreDoc(projectId, fsToken, `users/${targetUid}`, {
    status: { stringValue: to },
  });
  if (!flipped) return json(502, { error: "status_update_failed" });

  /* Keep the public verify registry in step: a ban removes the card's
     proof, an unban restores it. Best effort after the flip. */
  const memberId = targetFields.memberId?.stringValue;
  if (memberId) {
    if (action === "ban") {
      const { deleteFirestoreDoc } = await import("@/server/member-delete");
      await deleteFirestoreDoc(projectId, fsToken, `verify/${memberId}`);
    } else {
      await updateFirestoreDoc(projectId, fsToken, `verify/${memberId}`, {
        memberId: { stringValue: memberId },
        name: { stringValue: targetFields.name?.stringValue ?? "" },
        batch: { stringValue: targetFields.batch?.stringValue ?? "" },
        photoURL: strOrNull(targetFields.photoURL?.stringValue),
        position: strOrNull(targetFields.position?.stringValue),
      });
    }
  }

  return json(200, { ok: true });
}
