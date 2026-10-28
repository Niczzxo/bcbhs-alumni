/**
 * Server helpers for permanently deleting a banned member. SERVER-ONLY.
 *
 * The client can never delete another user's Firebase Auth account,
 * so deletion runs here: the route authorizes the caller (verified
 * ID token + server-side super-admin read), then this module does
 * the irreversible work in a strict order:
 *
 *   1. Auth account first (Identity Toolkit, cloud-platform scope).
 *      If this fails, the route aborts with everything intact -
 *      docs gone + login alive would leave the person unable to
 *      sign in AND unable to re-register, which is worse than banned.
 *   2. Firestore docs: users/{uid}, users_private/{uid},
 *      verify/{memberId} when the member had one (ban already
 *      removes the verify doc, so a 404 here is a normal success).
 *
 * Needs the service account to hold "Firebase Authentication Admin"
 * in Google Cloud IAM; without it Identity Toolkit answers
 * INSUFFICIENT_PERMISSION and step 1 aborts cleanly.
 */

function firestoreDocUrl(projectId: string, path: string): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
}

export type FirestoreField = { stringValue?: string; [key: string]: unknown };
export type FirestoreFields = Record<string, FirestoreField>;

/** Read a document's fields, or null when it does not exist. */
export async function readFirestoreDoc(
  projectId: string,
  token: string,
  path: string,
): Promise<FirestoreFields | null> {
  const resp = await fetch(firestoreDocUrl(projectId, path), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error("firestore_read_failed");
  const data = (await resp.json()) as { fields?: FirestoreFields };
  return data.fields ?? {};
}

/** Delete a document; a missing document counts as success. */
export async function deleteFirestoreDoc(
  projectId: string,
  token: string,
  path: string,
): Promise<boolean> {
  const resp = await fetch(firestoreDocUrl(projectId, path), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.ok || resp.status === 404;
}

/** Delete a Firebase Auth user. "not_found" means the login was
    already gone (safe to continue); "error" means the route must
    abort with the profile docs untouched. */
export async function deleteAuthUser(
  projectId: string,
  token: string,
  uid: string,
): Promise<"deleted" | "not_found" | "error"> {
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:delete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ localId: uid }),
    },
  );
  if (resp.ok) return "deleted";
  const text = await resp.text().catch(() => "");
  if (resp.status === 404 || text.includes("USER_NOT_FOUND")) return "not_found";
  return "error";
}
