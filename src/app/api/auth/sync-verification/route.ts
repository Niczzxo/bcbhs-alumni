/**
 * POST /api/auth/sync-verification - mark the caller's own profile
 * verified after they clicked the email-verification link.
 *
 * Why a server route at all: the `emailVerified` flag on a member's
 * profile decides whether their registration reaches the admin
 * approval queue, so it must never be settable from the browser -
 * Firestore rules give nobody that write. The browser can READ its
 * own verified state from the Auth token, but only this route can
 * confirm it independently (Identity Toolkit lookup with the service
 * account) and write the flag with the service account's Firestore
 * access.
 *
 * Guards, in order (any failure aborts before the next step):
 *  - Bearer <idToken> must verify (401); the uid comes from the
 *    verified token, never from the request body.
 *  - The service account must be configured (503).
 *  - The Auth record must exist (404) and say emailVerified (200
 *    with { verified: false } when it does not - the member has not
 *    clicked the link yet, which is a normal state, not an error).
 *  - The profile document must exist (404); the flag is never used
 *    to create a profile.
 *
 * No rate limiter: like /api/admin/moderate-member this endpoint
 * requires a verified token and does at most one lookup + one write
 * per call; Firebase Auth throttles the verification mails
 * themselves. The client also enforces a 60-second resend cooldown.
 */

import { NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/server/verify-token";
import {
  getServiceAccount,
  mintScopedAccessToken,
} from "@/server/service-account";
import {
  lookupAuthUser,
  readFirestoreDoc,
} from "@/server/member-delete";
import { updateFirestoreDoc } from "@/server/moderation";

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
  if (!getServiceAccount()) return json(503, { error: "security_service_unavailable" });

  let fsToken: string;
  let authToken: string;
  try {
    fsToken = await mintScopedAccessToken("https://www.googleapis.com/auth/datastore");
    authToken = await mintScopedAccessToken("https://www.googleapis.com/auth/cloud-platform");
  } catch {
    return json(503, { error: "security_service_unavailable" });
  }

  /* Authoritative check: the Auth record itself, never the client's claim. */
  const authUser = await lookupAuthUser(projectId, authToken, verified.uid);
  if (!authUser) return json(404, { error: "auth_user_not_found" });
  if (!authUser.emailVerified) return json(200, { verified: false });

  /* Only flip the flag on an existing profile document; never create one here. */
  const doc = await readFirestoreDoc(projectId, fsToken, `users/${verified.uid}`);
  if (!doc) return json(404, { error: "profile_not_found" });
  const ok = await updateFirestoreDoc(projectId, fsToken, `users/${verified.uid}`, {
    emailVerified: { booleanValue: true },
  });
  if (!ok) return json(502, { error: "sync_failed" });
  return json(200, { verified: true });
}
