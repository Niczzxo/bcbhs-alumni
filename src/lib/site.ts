/* ------------------------------------------------------------------ */
/*  Site-wide placeholder data.                                        */
/*  These values are stand-ins ONLY, they will be wired to Firebase   */
/*  (Firestore) once the backend is set up.                            */
/* ------------------------------------------------------------------ */

/** The school's founding year. The "Years of Legacy" stat is the
 *  current year minus this, so it rolls over on its own every
 *  January (owner's rule, 2026-10-23: 50 in 2026, 51 in 2027). */
export const SCHOOL_FOUNDED_YEAR = 1976;

export const PLACEHOLDER_STATS = {
  /** Total registered alumni, TODO: read from Firestore `members` count */
  totalMembers: 1200,
  /** Alumni currently living abroad, TODO: query members by country */
  membersAbroad: 150,
  /** Batches represented, TODO: derive from member batch fields */
  batches: 25,
  /** Reunions & events held, TODO: read from Firestore `events` count */
  eventsHeld: 12,
};

export const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Directory", href: "/directory" },
  { label: "Jobs", href: "/jobs" },
  { label: "Events", href: "/events" },
  { label: "Gallery", href: "/gallery" },
  { label: "Committee", href: "/committee" },
  { label: "Blood Donors", href: "/blood-donors" },
  { label: "Success Stories", href: "/stories" },
  { label: "Businesses", href: "/businesses" },
  { label: "Scholarship Fund", href: "/fund" },
];

/** Public navbar, visitors who are not verified members. */
export const PUBLIC_NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Memories", href: "/memories" },
  { label: "Events", href: "/events" },
  { label: "Directory", href: "/directory" },
  { label: "Contact", href: "/contact" },
  { label: "About", href: "/about" },
];

/** Navbar for verified (approved) members. Profile renders after the More dropdown. */
export const MEMBER_NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Memories", href: "/memories" },
  { label: "Members", href: "/members" },
  { label: "Gallery", href: "/gallery" },
  { label: "Events", href: "/events" },
  { label: "Contacts", href: "/contact" },
];

/** The drawer's Profile link: same destination as the desktop chip
 * dropdown's Profile (/profile, which lands on the member's own
 * profile page) — owner's rule, 2026-10-23, mobile and desktop agree. */
export const MEMBER_PROFILE_LINK = { label: "Profile", href: "/profile" };

/** Items inside the members navbar "More" dropdown. */
export const MEMBER_MORE_LINKS = [
  { label: "Jobs", href: "/jobs" },
  { label: "Blood Donors", href: "/blood-donors" },
  { label: "Mentorship", href: "/mentorship" },
  { label: "Batch Groups", href: "/batches" },
  { label: "Success Stories", href: "/stories" },
  { label: "Businesses", href: "/businesses" },
  { label: "Scholarship Fund", href: "/fund" },
  { label: "Committee", href: "/committee" },
];

/* Re-exported demo collections so pages share one placeholder source. */
/* TODO: wire each to its Firestore collection once the backend is live. */
export { DEMO_EVENTS as EVENTS, DEMO_COMMITTEE as COMMITTEE } from "./demo-data";

/* ------------------------- official contact --------------------------- */

export const SITE_FACEBOOK = "https://www.facebook.com/share/1DYzEdVYQV/";
export const SITE_INSTAGRAM = "https://instagram.com/bcbhsalumni";
export const SITE_WHATSAPP = "https://chat.whatsapp.com/LOb86Kx4UL04AV3dQSnTCo?s=cl&p=a&mlu=4&ilr=4";
export const SITE_EMAIL = "bcbhs.alumni2023@gmail.com";
export const SITE_SCHOOL = "https://bcbhs.edu.bd/";
