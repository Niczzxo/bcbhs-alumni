/* ------------------------------------------------------------------ */
/*  Shared domain types for the BCBHS Alumni Portal.                   */
/* ------------------------------------------------------------------ */

export type MemberStatus = "pending" | "approved" | "rejected";
export type MemberRole = "member" | "editor" | "admin" | "super_admin";

/** Fixed permission bundle for the editor role (content staff). */
export const EDITOR_PERMISSIONS = [
  "manage_events",
  "manage_gallery",
  "post_announcements",
  "manage_committee",
] as const;

/** Display metadata per role for admin UIs. */
export const ROLE_META: Record<
  MemberRole,
  { label: string; badge: string; blurb: string }
> = {
  member: {
    label: "Member",
    badge: "bg-emerald-500/15 text-emerald-300",
    blurb: "Standard alumni member.",
  },
  editor: {
    label: "Editor",
    badge: "bg-sky-400/15 text-sky-300",
    blurb: "Content staff — manages events, gallery, announcements & committee. No member approvals.",
  },
  admin: {
    label: "Admin",
    badge: "bg-ivory/10 text-ivory",
    blurb: "Administrator — only what the super admin explicitly grants.",
  },
  super_admin: {
    label: "Super Admin",
    badge: "bg-gold/20 text-gold-2",
    blurb: "Full access to everything.",
  },
};

export interface UserProfile {
  id: string;
  name: string;
  batch: string; // e.g. "2015"
  roll?: string;
  email: string;
  phone?: string; // private — only visible to admins / self (lives in users_private)
  whatsapp?: string; // public opt-in contact number — shown as a WhatsApp action button
  photoURL?: string;
  bloodGroup?: string;
  isDonor?: boolean;
  district: string; // BD district, or "Abroad"
  country?: string; // set when district === "Abroad"
  isAbroad: boolean;
  profession?: string;
  company?: string;
  status: MemberStatus;
  role: MemberRole;
  permissions: string[]; // granular admin permissions
  memberId?: string; // e.g. "BCBHS-2015-0001" — assigned on approval
  createdAt: string; // ISO date
}

export interface PortalEvent {
  id: string;
  title: string;
  date: string;
  venue: string;
  description: string;
  upcoming: boolean;
}

export interface CommitteeSeat {
  id: string;
  role: string;
  name: string;
  batch: string;
  note: string;
  photoURL?: string;
}

export interface GalleryPhoto {
  id: string;
  src: string; // data URL or remote URL
  caption: string;
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface SiteContent {
  aboutEyebrow: string;
  aboutTitle: string;
  aboutIntro: string;
  aboutStory: string[];
  aboutMission: string;
  aboutValues: { title: string; text: string }[];
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  aboutEyebrow: "Our story",
  aboutTitle: "The BCBHS Alumni Association",
  aboutIntro:
    "We are the former students of Bogura Cantonment Board High School — bound by classrooms, playgrounds, and memories that never fade.",
  aboutStory: [
    "The BCBHS Alumni Association was founded in 2023 by a group of former students who refused to let graduation be a goodbye. What began as a small reunion committee has grown into a thriving community of alumni across Bangladesh and beyond.",
    "Today we connect batches across decades — seniors guide juniors with career advice and referrals, we stand together in emergencies through our blood donor network, and we gather every year to celebrate the school that made us who we are.",
  ],
  aboutMission:
    "To keep every BCBHSian connected for life — fostering fellowship between batches, supporting juniors with mentorship and opportunity, serving our community, and upholding the honour of our school.",
  aboutValues: [
    {
      title: "Brotherhood",
      text: "Once a BCBHSian, always family — across batches, cities, and countries.",
    },
    {
      title: "Service",
      text: "Blood drives, scholarships, and welfare — we give back to the community that raised us.",
    },
    {
      title: "Excellence",
      text: "We carry the discipline of cantonment life into every profession we touch.",
    },
  ],
};

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

/** Granular admin permissions — toggled by the super admin. */
export const PERMISSIONS: { key: string; label: string; hint: string }[] = [
  { key: "approve_members", label: "Approve Members", hint: "Verify & approve new registrations" },
  { key: "manage_events", label: "Manage Events", hint: "Create, edit & delete events" },
  { key: "manage_gallery", label: "Manage Gallery", hint: "Upload & curate gallery photos" },
  { key: "post_announcements", label: "Post Announcements", hint: "Publish notices to all members" },
  { key: "view_member_data", label: "View Member Data", hint: "See private contact details" },
  { key: "manage_committee", label: "Manage Committee", hint: "Edit leadership seats" },
  { key: "moderate_content", label: "Moderate Content", hint: "Remove posts & comments" },
];

/** All 64 districts of Bangladesh. */
export const BD_DISTRICTS = [
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura",
  "Brahmanbaria", "Chandpur", "Chattogram", "Chuadanga", "Cox's Bazar", "Cumilla",
  "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj",
  "Habiganj", "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat",
  "Khagrachari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur",
  "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar",
  "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi",
  "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh",
  "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur",
  "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet",
  "Tangail", "Thakurgaon",
];

/** Batch years offered on the registration form. */
export const BATCH_YEARS: string[] = Array.from({ length: 31 }, (_, i) =>
  String(2025 - i),
);
