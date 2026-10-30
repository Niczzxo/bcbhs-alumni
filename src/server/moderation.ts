/**
 * Server helpers for batch-scoped member moderation (owner, 2026-10-30).
 * SERVER-ONLY.
 *
 * Batch reps (admin) and editors may ban / unban / delete members of
 * their OWN batch only. The rules, enforced server-side on every call:
 *
 *   - Nobody moderates themselves, and nobody touches a super admin.
 *   - A super admin keeps full power (any member, any batch).
 *   - A batch rep or editor may act only on plain members
 *     (role == 'member') whose batch matches their own.
 *
 * `canModerateMember` is pure so the security-critical decision is
 * unit-testable without Firebase. Both /api/admin/moderate-member
 * (ban/unban) and /api/admin/delete-member use it.
 */

export interface ModerationActor {
  uid: string;
  role?: string;
  batch?: string;
}

export interface ModerationTarget {
  uid: string;
  role?: string;
  batch?: string;
  status?: string;
}

export function canModerateMember(
  caller: ModerationActor,
  target: ModerationTarget,
): boolean {
  if (!caller.uid || !target.uid || caller.uid === target.uid) return false;
  if (target.role === "super_admin") return false;
  if (caller.role === "super_admin") return true;
  if (caller.role !== "admin" && caller.role !== "editor") return false;
  /* Batch-scoped staff: own batch's plain members only. */
  return target.role === "member" && !!caller.batch && target.batch === caller.batch;
}

function firestoreDocUrl(projectId: string, path: string): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
}

/** PATCH a document's fields (creates it when missing); false on failure. */
export async function updateFirestoreDoc(
  projectId: string,
  token: string,
  path: string,
  fields: Record<string, unknown>,
): Promise<boolean> {
  const params = new URLSearchParams();
  for (const key of Object.keys(fields)) params.append("updateMask.fieldPaths", key);
  try {
    const resp = await fetch(`${firestoreDocUrl(projectId, path)}?${params.toString()}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fields }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}
