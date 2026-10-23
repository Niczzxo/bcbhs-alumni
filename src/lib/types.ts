/* ------------------------------------------------------------------ */
/*  Shared domain types for the BCBHS Alumni Portal.                   */
/* ------------------------------------------------------------------ */

export type MemberStatus = "pending" | "approved" | "rejected" | "banned";
export type MemberRole = "member" | "editor" | "admin" | "super_admin";

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
    blurb: "Editor: the super admin's helping hand. Works only on the sections the super admin grants, nothing more.",
  },
  admin: {
    label: "Batch Rep",
    badge: "bg-ivory/10 text-ivory",
    blurb: "Batch Representative, only what the super admin explicitly grants.",
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
  phone?: string; // private, only visible to admins / self (lives in users_private)
  whatsapp?: string; // public opt-in contact number, shown as a WhatsApp action button
  photoURL?: string;
  bloodGroup?: string;
  isDonor?: boolean;
  district: string; // BD district, or "Abroad"
  country?: string; // set when district === "Abroad"
  isAbroad: boolean;
  profession?: string;
  company?: string;
  department?: string; // Science | Arts | Commerce, shown on the ID card
  position?: string; // e.g. "President", set ONLY by admins after manual verification
  guestVisible?: boolean; // admin-picked: this profile shows in the public (logged-out) directory
  dob?: string; // Date of birth, ISO YYYY-MM-DD, shown on the ID card
  status: MemberStatus;
  role: MemberRole;
  permissions: string[]; // granular permissions, granted per person by the super admin
  permissionsCustom?: boolean; // editors: true once the super admin has configured this editor's granted permissions
  memberId?: string; // e.g. "BCBHS-2015-0001", assigned on approval
  createdAt: string; // ISO date
}

export interface PortalEvent {
  id: string;
  title: string;
  date: string;
  venue: string;
  description: string;
  upcoming: boolean;
  images?: string[]; // event pictures (compressed data URLs), first one is the cover
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
    "We are the former students of Bogura Cantonment Board High School, bound by classrooms, playgrounds, and memories that never fade.",
  aboutStory: [
    "The BCBHS Alumni Association was founded in 2023 by a group of former students who refused to let graduation be a goodbye. What began as a small reunion committee has grown into a thriving community of alumni across Bangladesh and beyond.",
    "Today we connect batches across decades, seniors guide juniors with career advice and referrals, we stand together in emergencies through our blood donor network, and we gather every year to celebrate the school that made us who we are.",
  ],
  aboutMission:
    "To keep every BCBHSian connected for life, fostering fellowship between batches, supporting juniors with mentorship and opportunity, serving our community, and upholding the honour of our school.",
  aboutValues: [
    {
      title: "Brotherhood",
      text: "Once a BCBHSian, always family, across batches, cities, and countries.",
    },
    {
      title: "Service",
      text: "Blood drives, scholarships, and welfare, we give back to the community that raised us.",
    },
    {
      title: "Excellence",
      text: "We carry the discipline of cantonment life into every profession we touch.",
    },
  ],
};

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

/** HSC departments offered on the registration form. */
export const DEPARTMENTS = ["Science", "Arts", "Commerce"] as const;

/** Job types offered on the Job Board posting form. */
export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Remote"] as const;

/**
 * A job circular posted by a member on the Job Board.
 * Only registered (signed-in) members may view or post, enforced by
 * firestore.rules (`jobs` collection). The poster's WhatsApp number is
 * public on the card so any member can start a chat with one tap.
 */
export interface JobPost {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string; // one of JOB_TYPES
  salary?: string;
  deadline?: string; // YYYY-MM-DD
  description: string;
  requirements?: string;
  whatsapp: string; // applicant contact number (public)
  postedBy: string; // uid of the posting member
  posterName: string;
  posterBatch: string;
  createdAt: string; // ISO date
}

/**
 * Official association positions, chosen from this list in the admin
 * dashboards (never typed freehand) and printed on the member's ID card
 * under their name.
 */
export const POSITIONS: string[] = [
  "President",
  "Vice President",
  "General Secretary",
  "Joint Secretary",
  "Organizing Secretary",
  "Treasurer",
  "Director",
  "Executive Member",
];

/** Granular admin permissions, toggled by the super admin. */
export const PERMISSIONS: { key: string; label: string; hint: string }[] = [
  { key: "approve_members", label: "Approve Members", hint: "Verify & approve new registrations, ban & unban members" },
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

/* ------------------------------------------------------------------ */
/*  v2.0 community features                                            */
/* ------------------------------------------------------------------ */

/** An urgent blood request posted by a member; donors respond directly. */
export interface BloodRequest {
  id: string;
  patientName: string;
  bloodGroup: string; // one of BLOOD_GROUPS
  bagsNeeded?: string;
  hospital: string;
  district: string;
  contact: string; // phone / WhatsApp of the attendant
  neededBy?: string; // YYYY-MM-DD
  note?: string;
  postedBy: string; // uid
  posterName: string;
  createdAt: string; // ISO
  resolved?: boolean;
}

/** A community poll. Votes live in PollVote docs (one per member). */
export interface Poll {
  id: string;
  question: string;
  options: string[];
  active: boolean;
  createdAt: string; // ISO
}

export interface PollVote {
  id: string; // `${pollId}_${uid}` in live mode
  pollId: string;
  uid: string;
  optionIndex: number;
}

/** A Hall of Fame entry, a notable alumnus and their story. */
export interface SuccessStory {
  id: string;
  name: string;
  batch: string;
  title: string; // achievement / role, e.g. "BCS Cadre · Administration"
  story: string;
  photoURL?: string;
  createdAt: string; // ISO
}

/** An alumnus-owned business in the Business Directory. */
export interface Business {
  id: string;
  name: string;
  ownerId: string; // uid
  ownerName: string;
  ownerBatch: string;
  category: string;
  district: string;
  description: string;
  whatsapp: string;
  createdAt: string; // ISO
}

/** A photo on the Memory Wall, school-day memories, super-admin curated. */
export interface WallPhoto {
  id: string;
  url: string; // data URL (browser-compressed) or remote URL
  caption: string;
  year?: string;
  createdAt: string; // ISO
}

/** A senior alumnus offering mentorship to juniors. */
export interface MentorProfile {
  id: string;
  memberId: string; // uid
  name: string;
  batch: string;
  expertise: string; // e.g. "HSC Science · BUET admission · BCS"
  bio: string;
  whatsapp: string;
  createdAt: string; // ISO
}

/** A supporter listed on the Scholarship & Donation Fund honour roll. */
export interface FundDonor {
  id: string;
  name: string;
  batch?: string;
  amount?: string;
  note?: string;
  createdAt: string; // ISO
}

/** Editable Scholarship & Donation Fund settings (site/fund document). */
export interface FundInfo {
  bkash: string;
  totalRaised: string;
  totalAwarded: string;
  studentsHelped: string;
  aboutText: string;
  applyText: string;
}

export const DEFAULT_FUND_INFO: FundInfo = {
  bkash: "",
  totalRaised: "0",
  totalAwarded: "0",
  studentsHelped: "0",
  aboutText:
    "The BCBHS Alumni Scholarship & Donation Fund supports our own, helping talented students from the school and alumni families through hardship, exam fees, books and emergencies. Every taka is accounted for by the association and reported to members.",
  applyText:
    "To apply for support, contact the association office or any committee member with the student's details and the reason for support. All applications are verified by the fund committee before disbursement.",
};

/** A per-batch WhatsApp group link, set by the super admin. */
export interface BatchLink {
  id: string; // the batch year, e.g. "2015"
  link: string;
}
