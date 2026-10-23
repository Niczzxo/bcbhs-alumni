<div align="center">

# BCBHS Alumni Portal

**The official digital home of the Bogura Cantonment Board High School alumni community.**

*Once a BCBHSian, always a BCBHSian.*

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.3-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%2B_Firestore-ffca28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://vercel.com)

🌐 **Live site:** [bcbhs-alumni-niczzxos-projects.vercel.app](https://bcbhsalumni.vercel.app)

</div>

---

## About

The **BCBHS Alumni Portal** is a website-only community platform built exclusively for the
alumni of **Bogura Cantonment Board High School (BCBHS)**, Bogura, Bangladesh. It helps
graduates reconnect across batches, find seniors working in their field, support current
students, and stay involved with the school — a verified, members-first community where
personal contact details are never exposed to guests.

The portal follows a premium navy-blue + gold identity drawn from the official alumni
emblem, and the codebase is kept standard, typed and documented so it can be handed
over to any professional development team.

## Features

### For members
- **Verified membership** — registration with admin approval; every account is reviewed
  before it can access member areas.
- **Alumni directory & profiles** — searchable by name, batch, profession and district;
  profiles carry career details (company, position) so juniors can find seniors for
  referrals and guidance.
- **Digital alumni ID card** — auto-generated on approval with photo, batch, member ID
  and a scannable QR code that opens a public verification page; printable, with a
  premium card back.
- **Account settings** — members can update their WhatsApp number, email address and
  password (with re-authentication and email verification).
- **Batch groups** — a member sees the WhatsApp join link of *their own* batch only.

### Community
- **Events** — upcoming and past gatherings with photo covers and galleries.
- **Notice board** — committee announcements on the homepage.
- **Gallery & Memories** — shared photo memories from batches and events.
- **Leadership** — committee page; position holders appear automatically, ranked by role.
- **Blood donors** — donor directory searchable by blood group and district, plus urgent
  blood requests that staff can resolve.
- **Hall of Fame** — alumni success stories.
- **Business directory** — member-submitted businesses with staff moderation.
- **Mentorship** — senior alumni can list themselves as mentors.
- **Scholarship & Donation Fund** — fund totals, bKash details and a donor honour roll.
- **Jobs** — career opportunities shared for the community.

### For staff (dashboards)
- **Three role-based dashboards** — Super Admin, Batch Rep and Editor, each with its own
  sidebar workspace containing exactly the sections that role may use.
- **Granular permissions** — the Super Admin grants each Batch Rep and Editor individual
  permissions; editors start with no access until sections are explicitly switched on.
- **Professional Overview** — live stat cards, a 7/30-day visitor traffic chart, a
  *Who Visited* panel, and a full visitor trail (per person: pages, device, date & time).
- **Member management** — approvals, roles & official positions, banning/unbanning, and
  a site-wide Settings section (contact links, social URLs, founding year).
- **Visitor analytics** — privacy-conscious visit counting (one count per person per
  page per session; dashboards excluded).

## Tech stack

| Layer            | Technology                                                             |
| ---------------- | ---------------------------------------------------------------------- |
| Framework        | [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript  |
| Styling          | Tailwind CSS v4, custom navy/gold design system                        |
| Animation        | Framer Motion (scroll-linked motion, route progress, reveals)          |
| Backend          | Firebase Authentication + Cloud Firestore                              |
| Security logging | Server-only audit trail with Upstash Redis rate limiting               |
| QR codes         | `qrcode` / `qrcode.react` (decoder-verified before release)            |
| Hosting          | Vercel (auto-deploy from `main`)                                       |

> Photo uploads are compressed in the browser and stored as small data URLs, so the
> portal runs entirely on Firebase's free Spark plan — no paid storage required.

## Getting started

### Prerequisites
- Node.js 20 or newer
- npm

### Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (see below)
cp .env.example .env.local

# 3. Run the development server
npm run dev        # http://localhost:3000
```

### Demo mode

With **no Firebase credentials configured**, the portal runs fully in demo mode on
seed data (`src/lib/demo-data.ts`, persisted to `localStorage`). Every page — login,
registration, approvals, dashboards and the ID card — works out of the box. Use the
demo accounts offered on the login screen to explore each role (Super Admin, Batch Rep,
Editor, Member).

### Environment variables

Client-side Firebase config (from the Firebase console):

| Variable                                   | Purpose               |
| ------------------------------------------ | --------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase web API key  |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Auth domain           |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Project ID            |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Storage bucket        |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID   |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase app ID       |

Server-only (set in Vercel → Project Settings → Environment Variables; **never** prefix
these with `NEXT_PUBLIC_`):

| Variable                   | Purpose                                                    |
| -------------------------- | ---------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | Rate-limit store for `POST /api/security/log`              |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token                                         |
| `RATE_LIMIT_SECRET`        | HMAC secret for hashed audit identifiers                   |
| `FIREBASE_SERVICE_ACCOUNT` | Service-account JSON — the only writer of `security_logs`  |

Without the server variables the security-log endpoint fails closed (503) by design.
See [`SECURITY.md`](SECURITY.md) for the full security model.

## Available scripts

| Command                 | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Start the development server                              |
| `npm run build`         | Production build (must pass clean; no credentials needed) |
| `npm run start`         | Serve the production build                                |
| `npm run lint`          | Run ESLint                                                |
| `npm run test:security` | Run the security test suite (`tests/`)                    |

## Project structure

```
src/
├── app/                          # App Router routes
│   ├── page.tsx                  # Homepage (hero, stats, leadership, notices…)
│   ├── directory/  members/      # Position holders showcase / full member list
│   ├── member/[id]/              # Member profile
│   ├── register/  login/         # Auth flows
│   ├── id-card/  verify/         # Digital ID card + public QR verification
│   ├── events/  gallery/  memories/  committee/
│   ├── blood-donors/  stories/  businesses/  mentorship/  fund/  batches/  jobs/
│   ├── settings/  profile/       # Member account settings
│   ├── super-admin/  admin/  editor/   # Role dashboards
│   └── api/security/log/         # Rate-limited audit-log endpoint
├── components/
│   ├── Navbar.tsx  Footer.tsx  Hero.tsx  PageHero.tsx  Reveal.tsx
│   ├── MemberCard.tsx  IdCard.tsx  DottedQr.tsx
│   ├── DashboardShell.tsx        # Dashboard sidebar + section switching
│   ├── RequireRole.tsx  BannedGate.tsx  VisitTracker.tsx
│   └── content/                  # Dashboard section managers
│       ├── OverviewPanel.tsx     # Stats, visitor chart, Who Visited
│       ├── ContentManager.tsx  V2Manager.tsx
│       └── SettingsManager.tsx AboutEditor.tsx
├── lib/
│   ├── auth-context.tsx          # Auth, roles, permissions, member actions
│   ├── content-context.tsx       # Site content (events, stories, fund…)
│   ├── firebase.ts  demo-data.ts  types.ts  site.ts
│   ├── security.ts               # Error mapping, audit events
│   └── use-visits.ts             # Live visitor analytics hook
├── firestore.rules               # Firestore security rules
└── tests/                        # Security tests (node --test)
```

## Roles & permissions

| Role            | Access                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| **Super Admin** | Full access: approvals, roles, positions, bans, all content, site settings, visitor analytics. |
| **Batch Rep**   | Member approvals within their scope, plus only the content/community sections the Super Admin grants. |
| **Editor**      | Content only. Starts with **no** permissions; each section is granted individually. |
| **Member**      | Approved alumni: directory, profiles, ID card, batch group, community pages. |
| **Guest**       | Public pages only — no member contact details, no WhatsApp links.      |

WhatsApp numbers live in a private collection (`users_private`) and are never written
to public member documents; every WhatsApp contact button on the site is
approved-members-only.

## Security

Security is treated as a feature, not an afterthought:

- Firestore rules enforce role- and permission-based access; private data (phone
  numbers) is isolated in `users_private`.
- The audit log (`security_logs`) is **server-write-only** via a service account, with
  hashed identifiers, progressive login cooldowns and Upstash rate limiting
  (30 req/min per IP, 20 per 15 min per identifier, fail-closed).
- Login errors are field-specific (email vs password), password reset is
  existence-neutral, and visitor records can be created by guests but read only by staff.
- Firebase App Check is wired. See [`SECURITY.md`](SECURITY.md) for the complete model,
  threat notes and the operator runbook.

## Deployment

- **Frontend:** Vercel — every push to `main` auto-deploys; deployment status is shown
  on each GitHub commit.
- **Backend:** Firebase (Asia South) — Authentication + Firestore.
- **Firestore rules:** published through the Firebase Console
  (Firestore Database → Rules) using [`firestore.rules`](firestore.rules) from this repo.

## Contact

- 📧 Email: **bcbhs.alumni2023@gmail.com**
- 📘 Facebook: [BCBHS Alumni](https://www.facebook.com/share/1DYzEdVYQV/)
- 📸 Instagram: [@bcbhsalumni](https://instagram.com/bcbhsalumni)

---

<div align="center">

**BCBHS Alumni Portal** · Bogura Cantonment Board High School · Est. 2023 · Bogura, Bangladesh

© BCBHS Alumni. All rights reserved. Built for the BCBHS alumni community.

</div>
