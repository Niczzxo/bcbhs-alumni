# BCBHS Alumni Portal

The official web portal for the alumni of **Bogura Cantonment Board High
School (BCBHS)** — a community where graduates reconnect, support each other,
and celebrate the school's spirit. *Once a BCBHSian, always a BCBHSian.*

## Tech stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS v4**
- **Framer Motion** for animations
- **Firebase** (Auth, Firestore, Storage, Hosting) — config via env vars, see `.env.example`
- Design: premium navy-blue + gold theme drawn from the official alumni emblem

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in Firebase credentials
npm run dev                  # http://localhost:3000
```

> **Demo mode:** with no Firebase credentials the portal runs fully on
> in-memory seed data (`src/lib/demo-data.ts`, persisted to localStorage),
> so every page — including login, approvals and the ID card — works out
> of the box. Use the "Demo quick login" buttons on `/login`.

Production build check:

```bash
npm run build   # must pass clean — no credentials needed
npm run lint
```

## Project structure

```
src/
  app/
    page.tsx                 # homepage composition
    layout.tsx               # fonts (Playfair Display + Inter), Providers
    globals.css              # design tokens, keyframes, seal/sunburst motifs, print CSS
    register/page.tsx        # registration form → pending approval
    login/page.tsx           # email/password + demo quick login
    directory/page.tsx       # searchable/filterable alumni grid
    member/[id]/             # public profile (page.tsx + MemberView.tsx)
    search/page.tsx          # location search by district
    blood-donors/page.tsx    # donor directory (group + district filters)
    events/page.tsx          # upcoming + past events
    gallery/page.tsx         # photo grid
    committee/page.tsx       # leadership page
    id-card/page.tsx         # official digital ID card + QR + print
    verify/[memberId]/        # public QR verification (page.tsx + VerifyView.tsx)
    admin/page.tsx           # approval queue + member list (role: admin+)
    super-admin/page.tsx     # stats, role + granular permission toggles (super_admin)
  components/
    Navbar.tsx               # sticky nav, auth-aware (Login/Register ↔ Dashboard/Logout)
    Hero.tsx / StatsBand.tsx / Features.tsx / Committee.tsx / IdCardCta.tsx
    Footer.tsx / Reveal.tsx / PageHero.tsx
    MemberCard.tsx           # directory card + initials Avatar
    IdCard.tsx               # official ID card with QRCodeSVG
    RequireRole.tsx          # route guard (redirects to /login)
    Providers.tsx            # AuthProvider wrapper
  lib/
    types.ts                 # UserProfile, PERMISSIONS, BD_DISTRICTS, BLOOD_GROUPS
    demo-data.ts             # seed users / events / committee (demo mode)
    auth-context.tsx         # auth + member store (demo ↔ Firebase Auth/Firestore)
    data.ts                  # useDirectory / useMember / useSiteStats hooks
    site.ts                  # nav links, placeholder stats, EVENTS, COMMITTEE
    firebase.ts              # Firebase init from env vars (no-op until configured)
firestore.rules              # intended Firestore security rules (deploy with Firebase CLI)
public/images/               # logo.jpg, school.jpg, school-logo.png
assets/                      # original brand assets
```

## Firestore data model (`users` collection)

`name, batch, roll, email, phone (private), photoURL, bloodGroup, isDonor,`
`district, country, isAbroad, profession, company, status (pending|approved|`
`rejected), role (member|admin|super_admin), permissions[], memberId`
`(BCBHS-<batch>-<seq>), createdAt`

## Roadmap

**v1.0 (MVP)**
- [x] Homepage (navy/gold, animated, stats band → live when Firebase configured)
- [x] Registration + admin verification flow (demo mode; Firestore path coded)
- [x] Alumni directory (search by name/batch/district/profession/blood group)
- [x] Auto-generated digital ID card with QR + public verification page
- [x] Gallery, Events, Committee pages
- [x] Blood donor directory
- [x] Location search (by district)
- [x] Career info in profiles
- [x] Super admin panel (full access + member approval + granular permission toggles)
- [x] Admin panel (approval queue; actions gated by granted permissions)
- [x] Firebase project setup (console) + deploy `firestore.rules`
- [x] Photo upload (browser-compressed data URLs in the profile — no Storage bucket needed)
- [x] Urgent blood-request flow (members post; super admin resolves from the dashboard)

**v2.0**
- [x] Job board (members-only, WhatsApp apply)
- [x] Mentorship program (senior mentors list themselves; juniors reach out on WhatsApp)
- [x] Scholarship / donation fund (staff-managed totals, bKash channel, honour roll)
- [x] Success stories / Hall of fame
- [x] Polls & voting (one vote per member, live results), Batch groups (per-batch WhatsApp links)
- [x] Memory wall (super-admin curated)
- [x] Business directory (member-submitted, staff-moderated)

## Notes

- Homepage stats are live: a public `site/stats` document (kept in sync whenever a super admin is signed in) feeds the counters, since guests may not count the `users` collection under the security rules.
- Committee seats, events, gallery, announcements and all v2.0 content are managed from the admin dashboards — nothing is hardcoded.
- Site copy is English; a Bangla/English toggle is planned.
