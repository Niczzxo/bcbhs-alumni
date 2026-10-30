/**
 * Server helpers for batch-scoped member moderation (owner, 2026-10-30).
 * SERVER-ONLY.
 *
 * Batch reps (admin) may ban / unban / delete members of
 * their OWN batch only. Editors moderate every member as the super
 * admin's alternative (owner, 2026-10-30). The rules, enforced
 * server-side on every call:
 *
 *   - Nobody moderates themselves, and nobody touches a super admin.
 *   - A super admin keeps full power (any member, any batch).
 *   - An editor may act on any plain member (role == 'member'),
 *     of any batch.
 *   - A batch rep may act only on plain members (role == 'member')
 *     whose batch matches their own.
 *
 * `canModerateMember` is pure so the security-critical decision is
 * unit-testable without Firebase. Both /api/admin/moderate-member
 * (ban/unban) and /api/admin/delete-member use it.
 */

export interface ModerationActor {
  uid: string;
  role?: string;
  batch?: string;
  /** Granted permission keys (editors need 'moderate_members'). */
  permissions?: string[];
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
  /* Editors moderate every member as the super admin's alternative
     (owner, 2026-10-30) - but only when the super admin granted them
     the 'moderate_members' permission (owner, 2026-10-30): any batch,
     plain members only - staff roles stay protected from each other. */
  if (caller.role === "editor")
    return (
      target.role === "member" && (caller.permissions ?? []).includes("moderate_members")
    );
  if (caller.role !== "admin") return false;
  /* Batch reps: own batch's plain members only, and only with the
     'moderate_members' grant - auto-on at promotion (owner,
     2026-10-30), the super admin may switch it off afterwards. */
  return (
    target.role === "member" &&
    !!caller.batch &&
    target.batch === caller.batch &&
    (caller.permissions ?? []).includes("moderate_members")
  );
}

function firestoreDocUrl(projectId: string, path: string): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
}

/** Pull a string[] field (e.g. permissions) out of Firestore REST fields. */
export function stringArrayField(fields: unknown, key: string): string[] {
  const rec = fields as Record<string, { arrayValue?: unknown }> | null | undefined;
  const v = rec?.[key]?.arrayValue as
    | { values?: { stringValue?: unknown }[] }
    | undefined;
  const vals = v?.values;
  if (!Array.isArray(vals)) return [];
  return vals
    .map((x) => x?.stringValue)
    .filter((s): s is string => typeof s === "string");
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
