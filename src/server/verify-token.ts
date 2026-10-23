/**
 * Firebase ID-token verification for route handlers, using Google's
 * published JWKs via `jose` (no service-account credentials needed:
 * the token is verified against the project's public keys, and its
 * issuer + audience are pinned to this project). SERVER-ONLY.
 */

import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

/** Returns the verified uid, or null for any invalid/expired token. */
export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
): Promise<{ uid: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return typeof payload.sub === "string" && payload.sub ? { uid: payload.sub } : null;
  } catch {
    return null;
  }
}
