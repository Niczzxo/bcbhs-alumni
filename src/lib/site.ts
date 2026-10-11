/* ------------------------------------------------------------------ */
/*  Site-wide placeholder data.                                        */
/*  These values are stand-ins ONLY — they will be wired to Firebase   */
/*  (Firestore) once the backend is set up.                            */
/* ------------------------------------------------------------------ */

export const PLACEHOLDER_STATS = {
  /** Total registered alumni — TODO: read from Firestore `members` count */
  totalMembers: 1200,
  /** Alumni currently living abroad — TODO: query members by country */
  membersAbroad: 150,
  /** Batches represented — TODO: derive from member batch fields */
  batches: 25,
  /** Reunions & events held — TODO: read from Firestore `events` count */
  eventsHeld: 12,
};

export const NAV_LINKS = [
  { label: "Directory", href: "#features" },
  { label: "Events", href: "#features" },
  { label: "Gallery", href: "#features" },
  { label: "Committee", href: "#committee" },
  { label: "Join Us", href: "#join" },
];
