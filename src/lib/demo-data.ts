/* ------------------------------------------------------------------ */
/*  Demo-mode seed data.                                               */
/*  Used when Firebase credentials are absent (see src/lib/firebase.ts) */
/*  so every page renders and `npm run build` passes with no backend.  */
/*  TODO: replace with live Firestore reads once the project is live.  */
/* ------------------------------------------------------------------ */

import type {
  UserProfile,
  PortalEvent,
  CommitteeSeat,
  GalleryPhoto,
  AnnouncementItem,
  JobPost,
  BloodRequest,
  SuccessStory,
  Business,
  MentorProfile,
  FundDonor,
  BatchLink,
} from "./types";

export const DEMO_USERS: UserProfile[] = [
  {
    id: "u-superadmin",
    name: "BCBHS Super Admin",
    batch: "2010",
    roll: "01",
    email: "superadmin@bcbhs-alumni.org",
    phone: "01XXXXXXXXX",
    bloodGroup: "O+",
    isDonor: true,
    district: "Bogura",
    isAbroad: false,
    profession: "Alumni Coordinator",
    company: "BCBHS Alumni Association",
    status: "approved",
    role: "super_admin",
    permissions: [],
    position: "President",
    memberId: "BCBHS-2010-0001",
    createdAt: "2023-01-15T00:00:00.000Z",
  },
  {
    id: "u-admin",
    name: "Arifa Sultana",
    batch: "2012",
    roll: "14",
    email: "admin@bcbhs-alumni.org",
    phone: "01XXXXXXXXX",
    bloodGroup: "B+",
    isDonor: true,
    district: "Dhaka",
    isAbroad: false,
    profession: "HR Manager",
    company: "Grameenphone",
    status: "approved",
    role: "admin",
    permissions: ["approve_members", "manage_events", "view_member_data"],
    position: "General Secretary",
    memberId: "BCBHS-2012-0002",
    createdAt: "2023-02-10T00:00:00.000Z",
  },
  {
    id: "u-editor",
    name: "Demo Editor",
    batch: "2018",
    roll: "07",
    email: "editor@bcbhs-alumni.org",
    phone: "01XXXXXXXXX",
    bloodGroup: "A+",
    isDonor: false,
    district: "Bogura",
    isAbroad: false,
    profession: "Content Creator",
    company: "BCBHS Alumni Association",
    status: "approved",
    role: "editor",
    /* Granted by the super admin (the demo editor's working set).
       Editors start with NO access; this list is their grant. */
    permissions: ["manage_events", "manage_gallery", "post_announcements", "manage_committee"],
    permissionsCustom: true,
    memberId: "BCBHS-2018-0010",
    createdAt: "2023-03-05T00:00:00.000Z",
  },
  {
    id: "u-1",
    name: "Tanvir Ahmed",
    batch: "2015",
    roll: "22",
    email: "tanvir.ahmed@example.com",
    phone: "01XXXXXXXXX",
    whatsapp: "01712345678",
    bloodGroup: "O+",
    isDonor: true,
    district: "Dhaka",
    isAbroad: false,
    profession: "Software Engineer",
    company: "Brain Station 23",
    institution: "BUET",
    eduSession: "2022-23",
    eduDepartment: "CSE",
    eduRunning: true,
    status: "approved",
    role: "member",
    permissions: [],
    memberId: "BCBHS-2015-0003",
    createdAt: "2024-05-01T00:00:00.000Z",
  },
  {
    id: "u-2",
    name: "Nusrat Jahan",
    batch: "2018",
    roll: "07",
    email: "nusrat.jahan@example.com",
    phone: "01XXXXXXXXX",
    bloodGroup: "B+",
    isDonor: false,
    district: "Chattogram",
    isAbroad: false,
    profession: "Doctor",
    company: "Chattogram Medical College",
    institution: "University of Dhaka",
    eduSession: "2020-21",
    eduDepartment: "Mathematics",
    eduRunning: false,
    status: "approved",
    role: "member",
    permissions: [],
    memberId: "BCBHS-2018-0004",
    createdAt: "2024-06-12T00:00:00.000Z",
  },
  {
    id: "u-3",
    name: "Rafid Hasan",
    batch: "2012",
    roll: "31",
    email: "rafid.hasan@example.com",
    phone: "+44XXXXXXXXXX",
    bloodGroup: "A+",
    isDonor: true,
    district: "Abroad",
    country: "United Kingdom",
    isAbroad: true,
    profession: "Data Scientist",
    company: "HSBC",
    status: "approved",
    role: "member",
    permissions: [],
    memberId: "BCBHS-2012-0005",
    createdAt: "2024-03-20T00:00:00.000Z",
  },
  {
    id: "u-4",
    name: "Sharmin Akter",
    batch: "2020",
    roll: "11",
    email: "sharmin.akter@example.com",
    phone: "01XXXXXXXXX",
    bloodGroup: "O-",
    isDonor: true,
    district: "Bogura",
    isAbroad: false,
    profession: "Teacher",
    company: "Bogura Cantonment Board High School",
    status: "approved",
    role: "member",
    permissions: [],
    memberId: "BCBHS-2020-0006",
    createdAt: "2024-08-02T00:00:00.000Z",
  },
  {
    id: "u-5",
    name: "Mahmudul Karim",
    batch: "2016",
    roll: "19",
    email: "mahmudul.karim@example.com",
    phone: "01XXXXXXXXX",
    bloodGroup: "AB+",
    isDonor: false,
    district: "Sylhet",
    isAbroad: false,
    profession: "Banker",
    company: "Dutch-Bangla Bank",
    status: "approved",
    role: "member",
    permissions: [],
    memberId: "BCBHS-2016-0007",
    createdAt: "2024-04-15T00:00:00.000Z",
  },
  {
    id: "u-6",
    name: "Farhana Islam",
    batch: "2019",
    roll: "05",
    email: "farhana.islam@example.com",
    phone: "+1XXXXXXXXXX",
    bloodGroup: "B-",
    isDonor: true,
    district: "Abroad",
    country: "United States",
    isAbroad: true,
    profession: "Researcher",
    company: "MIT",
    status: "approved",
    role: "member",
    permissions: [],
    memberId: "BCBHS-2019-0008",
    createdAt: "2024-09-10T00:00:00.000Z",
  },
  {
    id: "u-7",
    name: "Sakib Rahman",
    batch: "2014",
    roll: "28",
    email: "sakib.rahman@example.com",
    phone: "01XXXXXXXXX",
    bloodGroup: "A-",
    isDonor: true,
    district: "Rajshahi",
    isAbroad: false,
    profession: "Entrepreneur",
    company: "Rahman Agro Foods",
    status: "approved",
    role: "member",
    permissions: [],
    memberId: "BCBHS-2014-0009",
    createdAt: "2024-07-22T00:00:00.000Z",
  },
  {
    id: "u-8",
    name: "Priya Saha",
    batch: "2021",
    roll: "16",
    email: "priya.saha@example.com",
    phone: "01XXXXXXXXX",
    bloodGroup: "O+",
    isDonor: false,
    district: "Khulna",
    isAbroad: false,
    profession: "Student",
    company: "KUET",
    status: "approved",
    role: "member",
    permissions: [],
    memberId: "BCBHS-2021-0010",
    createdAt: "2025-01-08T00:00:00.000Z",
  },
  {
    id: "u-9",
    name: "Kamal Hossain",
    batch: "2022",
    roll: "09",
    email: "kamal.hossain@example.com",
    phone: "01XXXXXXXXX",
    bloodGroup: "B+",
    isDonor: true,
    district: "Bogura",
    isAbroad: false,
    profession: "Marketing Executive",
    company: "Square Pharmaceuticals",
    status: "pending",
    role: "member",
    permissions: [],
    createdAt: "2026-10-05T00:00:00.000Z",
  },
  {
    id: "u-10",
    name: "Lima Akter",
    batch: "2023",
    roll: "21",
    email: "lima.akter@example.com",
    phone: "01XXXXXXXXX",
    bloodGroup: "AB-",
    isDonor: false,
    district: "Dhaka",
    isAbroad: false,
    profession: "Student",
    company: "Dhaka University",
    status: "pending",
    role: "member",
    permissions: [],
    createdAt: "2026-10-09T00:00:00.000Z",
  },
];

/* ------------------------- events (placeholder) ------------------------ */
/* TODO: move to Firestore `events` collection, managed via admin panel.    */

export const DEMO_EVENTS: PortalEvent[] = [
  {
    id: "e-1",
    title: "Grand Reunion 2026",
    date: "2026-12-25",
    venue: "BCBHS School Field, Bogura",
    description:
      "The biggest gathering of BCBHSians yet, cultural program, dinner, and the annual general meeting under one sky.",
    upcoming: true,
  },
  {
    id: "e-2",
    title: "Iftar Mahfil 2026",
    date: "2026-03-18",
    venue: "Bogura Cantonment Community Hall",
    description:
      "An evening of togetherness during Ramadan, alumni, teachers, and families welcome.",
    upcoming: true,
  },
  {
    id: "e-3",
    title: "Career Guidance Workshop",
    date: "2026-02-08",
    venue: "Online (Zoom)",
    description:
      "Senior alumni guide current students and fresh graduates on university admission and first jobs.",
    upcoming: true,
  },
  {
    id: "e-4",
    title: "Reunion 2024",
    date: "2024-12-27",
    venue: "BCBHS School Field, Bogura",
    description:
      "Over 400 alumni joined the 2024 reunion, a day of memories, music, and renewed friendships.",
    upcoming: false,
  },
  {
    id: "e-5",
    title: "Blood Donation Drive 2024",
    date: "2024-08-15",
    venue: "Bogura Sadar Hospital",
    description:
      "Alumni donors collected 87 bags of blood in a single day for local patients.",
    upcoming: false,
  },
];

/* ------------------------ committee (placeholder) ---------------------- */
/* TODO: manage via admin panel → Firestore `committee` collection.        */

export const DEMO_COMMITTEE: CommitteeSeat[] = [
  {
    id: "c-1",
    role: "President",
    name: "Engr. Mahbub Alam",
    batch: "2005",
    note: "Leads the association and represents the alumni community.",
  },
  {
    id: "c-2",
    role: "Vice President",
    name: "Dr. Shamima Nasrin",
    batch: "2008",
    note: "Oversees welfare programs and the blood donor network.",
  },
  {
    id: "c-3",
    role: "General Secretary",
    name: "Tanvir Ahmed",
    batch: "2015",
    note: "Coordinates events, membership, and day-to-day operations.",
  },
  {
    id: "c-4",
    role: "Director",
    name: "Col. (Retd.) Rezaul Karim",
    batch: "1998",
    note: "Guides strategy and liaison with the school authority.",
  },
];

/* ------------------------- gallery (placeholder) ----------------------- */
/* TODO: move to Firestore `gallery` collection, managed via admin panel.   */

export const DEMO_GALLERY: GalleryPhoto[] = [
  {
    id: "g-1",
    src: "/images/school.jpg",
    caption: "The campus, home of a thousand memories",
    createdAt: "2024-01-15T00:00:00.000Z",
  },
];

/* ---------------------- announcements (placeholder) -------------------- */

export const DEMO_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: "a-1",
    title: "Grand Reunion 2026 announced",
    body: "Mark your calendars, December 25, 2026 at the BCBHS School Field. Registration opens soon.",
    createdAt: "2026-10-01T00:00:00.000Z",
  },
];

/* ------------------------- job board (placeholder) --------------------- */
/* TODO: move to Firestore `jobs` collection. Only signed-in members may  */
/* read/write, see firestore.rules.                                      */

export const DEMO_JOBS: JobPost[] = [
  {
    id: "j-1",
    title: "Junior Software Engineer",
    company: "Brain Station 23",
    location: "Dhaka",
    jobType: "Full-time",
    salary: "৳45,000 – ৳60,000",
    deadline: "2026-11-30",
    description:
      "We are hiring a junior software engineer for our fintech team. You will build and maintain web applications with React and Node.js, work closely with senior engineers, and ship features used by millions.",
    requirements: "• 1+ year of React/Node.js experience\n• Good English communication\n• BCBHS alumni preferred",
    whatsapp: "01712345678",
    postedBy: "u-1",
    posterName: "Tanvir Ahmed",
    posterBatch: "2015",
    createdAt: "2026-10-08T00:00:00.000Z",
  },
  {
    id: "j-2",
    title: "Marketing Executive",
    company: "Grameenphone",
    location: "Dhaka",
    jobType: "Full-time",
    salary: "৳50,000+",
    deadline: "2026-11-15",
    description:
      "Looking for a dynamic marketing executive to lead campus outreach and digital campaigns for our youth segment. Fresh graduates with strong communication skills are welcome to apply.",
    requirements: "• Bachelor's degree in any discipline\n• Strong presentation skills\n• Willing to travel",
    whatsapp: "01812345678",
    postedBy: "u-admin",
    posterName: "Arifa Sultana",
    posterBatch: "2012",
    createdAt: "2026-10-05T00:00:00.000Z",
  },
  {
    id: "j-3",
    title: "Remote UI/UX Designer (Internship)",
    company: "Sheba Platform",
    location: "Remote",
    jobType: "Internship",
    salary: "৳20,000",
    description:
      "3-month paid remote internship for a UI/UX designer. You will redesign core user flows, build a design system in Figma, and work with our product team. High chance of a full-time offer.",
    requirements: "• Figma portfolio\n• Basic understanding of design systems",
    whatsapp: "01912345678",
    postedBy: "u-2",
    posterName: "Nusrat Jahan",
    posterBatch: "2018",
    createdAt: "2026-10-02T00:00:00.000Z",
  },
];

/* --------------------------- v2.0 features ----------------------------- */

export const DEMO_BLOOD_REQUESTS: BloodRequest[] = [
  {
    id: "br-1",
    patientName: "Abdul Karim",
    bloodGroup: "B+",
    bagsNeeded: "2 bags",
    hospital: "Shaheed Ziaur Rahman Medical College, Bogura",
    district: "Bogura",
    contact: "01712345678",
    note: "Urgent, surgery scheduled tomorrow morning.",
    postedBy: "u-1",
    posterName: "Tanvir Ahmed",
    createdAt: "2026-10-20T00:00:00.000Z",
  },
];



export const DEMO_STORIES: SuccessStory[] = [
  {
    id: "s-1",
    name: "Tanvir Ahmed",
    batch: "2015",
    title: "Software Engineer · Brain Station 23",
    story:
      "From the back benches of BCBHS to building fintech used by millions, Tanvir credits the discipline of cantonment school life for his work ethic, and now mentors junior alumni entering tech.",
    createdAt: "2026-10-10T00:00:00.000Z",
  },
];

export const DEMO_BUSINESSES: Business[] = [
  {
    id: "b-1",
    name: "Bogura Computer & IT Solution",
    ownerId: "u-1",
    ownerName: "Tanvir Ahmed",
    ownerBatch: "2015",
    category: "IT & Electronics",
    district: "Bogura",
    description:
      "Sales and servicing of laptops, desktops and accessories. Special discount for BCBHS alumni, just show your alumni ID card.",
    whatsapp: "01712345678",
    createdAt: "2026-10-09T00:00:00.000Z",
  },
];


export const DEMO_MENTORS: MentorProfile[] = [
  {
    id: "m-1",
    memberId: "u-1",
    name: "Tanvir Ahmed",
    batch: "2015",
    expertise: "Software careers · React · Job interviews",
    bio: "Working in fintech for 6+ years. Happy to guide juniors on learning programming, building a CV and preparing for software job interviews.",
    whatsapp: "01712345678",
    createdAt: "2026-10-08T00:00:00.000Z",
  },
];

export const DEMO_FUND_DONORS: FundDonor[] = [
  {
    id: "fd-1",
    name: "Tanvir Ahmed",
    batch: "2015",
    amount: "৳5,000",
    note: "For the scholarship fund",
    createdAt: "2026-10-05T00:00:00.000Z",
  },
];

export const DEMO_BATCH_LINKS: BatchLink[] = [];
