import { useEffect, useState } from "react";
import { POSITIONS, type CommitteeSeat, type UserProfile } from "./types";
import { useAuth } from "./auth-context";
import { useContent } from "./content-context";
import { db, isFirebaseConfigured } from "./firebase";

/** One leadership entry, however it was sourced. */
export interface LeaderSeat {
  id: string;
  name: string;
  role: string;
  batch?: string;
  note?: string;
  photoURL?: string;
}

const rank = (position?: string) => {
  const i = POSITIONS.indexOf(position ?? "");
  return i === -1 ? POSITIONS.length : i;
};

/**
 * THE leadership list (owner's merge rule, 2026-10-23; ordering
 * corrected 2026-10-24): a person given an official position on
 * their profile appears automatically in the Directory, on the
 * Committee page and in the homepage Leadership strip, no separate
 * seat entry needed. Manually added committee seats (for people
 * without a portal account) join the same list, skipping any whose
 * name matches a holder (the profile wins). Holders and seats are
 * sorted TOGETHER by position rank, the more powerful position
 * first, name as tiebreak, so a President always leads the list
 * however their entry was sourced. Callers pass only the members
 * the viewer may see (guests get approved position holders only).
 */
export function mergeLeadership(
  members: UserProfile[],
  seats: CommitteeSeat[],
): LeaderSeat[] {
  const holders = members
    .filter((m) => m.status === "approved" && m.position?.trim())
    .sort(
      (a, b) =>
        rank(a.position) - rank(b.position) || a.name.localeCompare(b.name),
    )
    .map<LeaderSeat>((m) => ({
      id: `member-${m.id}`,
      name: m.name,
      role: m.position!.trim(),
      batch: m.batch,
      note: m.profession,
      photoURL: m.photoURL,
    }));
  const names = new Set(holders.map((h) => h.name.trim().toLowerCase()));
  const manual = seats
    .filter((s) => !names.has(s.name.trim().toLowerCase()))
    .map<LeaderSeat>((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      batch: s.batch,
      note: s.note,
      photoURL: s.photoURL,
    }));
  return [...holders, ...manual].sort(
    (a, b) => rank(a.role) - rank(b.role) || a.name.localeCompare(b.name),
  );
}

/**
 * The leadership list for the current viewer, with the right data
 * source per viewer: signed-in members read the role-aware member
 * list from the auth context, while GUESTS get their own fetch of
 * approved position holders (the same rule-constrained query
 * the Directory page runs). Without this, the live auth context
 * holds NO members at all for guests, and the Leadership strip
 * showed only the hand-added seats (owner report, 2026-10-23).
 */
export function useLeadership(): LeaderSeat[] {
  const { user, members } = useAuth();
  const { committee } = useContent();
  const [guestMembers, setGuestMembers] = useState<UserProfile[] | null>(null);
  const isGuest = !user;

  useEffect(() => {
    if (!isGuest || !isFirebaseConfigured || !db) return;
    let cancelled = false;
    (async () => {
      try {
        const { collection, query, where, limit, getDocs } = await import("firebase/firestore");
        /* `in` (not `!= ""`): only the official-positions list is
           provable against the read rule, see directory/page.tsx. */
        const snap = await getDocs(
          query(
            collection(db, "users"),
            where("status", "==", "approved"),
            where("position", "in", POSITIONS),
            limit(50),
          ),
        );
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<UserProfile, "id">) }) as UserProfile)
          .filter((m) => m.status === "approved" && !!m.position?.trim());
        if (!cancelled) setGuestMembers(list);
      } catch {
        if (!cancelled) setGuestMembers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isGuest]);

  const base = isGuest && isFirebaseConfigured ? (guestMembers ?? []) : members;
  return mergeLeadership(base, committee);
}
