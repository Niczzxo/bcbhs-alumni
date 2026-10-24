/* ------------------------------------------------------------------ */
/*  Public ID-card verification registry (`verify/{memberId}`).       */
/*                                                                     */
/*  The /verify page is public, anyone scanning a card QR lands      */
/*  there, usually signed out. Firestore rules only let guests read   */
/*  position holders' `users` docs, so a plain member's card would    */
/*  show "Not Verified" without a public record of its own.           */
/*                                                                     */
/*  This registry holds only the facts printed on the card itself     */
/*  (name, batch, photo, position) and is publicly readable. A doc    */
/*  exists exactly while the member is approved. StatsSync uses the   */
/*  same public-mirror pattern for the homepage counters.             */
/* ------------------------------------------------------------------ */

import type { Firestore } from "firebase/firestore";
import type { UserProfile } from "./types";

export interface VerifyRecord {
  memberId: string;
  name: string;
  batch: string;
  photoURL: string | null;
  position: string | null;
}

/** The public record for a member, or null when they must not verify. */
export function verifyRecordOf(m: UserProfile): VerifyRecord | null {
  if (m.status !== "approved" || !m.memberId) return null;
  return {
    memberId: m.memberId,
    name: m.name,
    batch: m.batch,
    photoURL: m.photoURL ?? null,
    position: m.position ?? null,
  };
}

/** Best-effort upsert of a member's public verification record. */
export async function syncVerifyDoc(db: Firestore | null, m: UserProfile): Promise<void> {
  const rec = verifyRecordOf(m);
  if (!db || !rec) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "verify", rec.memberId), rec);
  } catch {
    /* best effort, VerifySync reconciles on the next staff visit */
  }
}

/** Best-effort removal (rejection / revocation). */
export async function removeVerifyDoc(db: Firestore | null, memberId?: string | null): Promise<void> {
  if (!db || !memberId) return;
  try {
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "verify", memberId));
  } catch {
    /* best effort, VerifySync reconciles on the next staff visit */
  }
}
