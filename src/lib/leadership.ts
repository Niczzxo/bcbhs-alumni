import { POSITIONS, type CommitteeSeat, type UserProfile } from "./types";

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
 * THE leadership list (owner's merge rule, 2026-10-23): a person
 * given an official position on their profile appears automatically
 * in the Directory, on the Committee page and in the homepage
 * Leadership strip, no separate seat entry needed. Manually added
 * committee seats (for people without a portal account) are appended
 * after the position holders, skipping any whose name matches a
 * holder (the profile wins). Callers pass only the members the
 * viewer may see (guests get guest-visible profiles only).
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
  return [...holders, ...manual];
}
