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
  { label: "About", href: "/about" },
  { label: "Directory", href: "/directory" },
  { label: "Events", href: "/events" },
  { label: "Gallery", href: "/gallery" },
  { label: "Committee", href: "/committee" },
  { label: "Blood Donors", href: "/blood-donors" },
];

/* Re-exported demo collections so pages share one placeholder source. */
/* TODO: wire each to its Firestore collection once the backend is live. */
export { DEMO_EVENTS as EVENTS, DEMO_COMMITTEE as COMMITTEE } from "./demo-data";

/* ------------------------- official contact --------------------------- */

export const SITE_FACEBOOK = "https://www.facebook.com/share/1DYzEdVYQV/";
export const SITE_INSTAGRAM = "https://instagram.com/bcbhsalumni";
export const SITE_EMAIL = "bcbhs.alumni2023@gmail.com";
