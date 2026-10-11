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

Production build check:

```bash
npm run build
```

## Project structure

```
src/
  app/
    page.tsx          # homepage composition
    layout.tsx        # fonts (Playfair Display + Inter), metadata
    globals.css       # design tokens, keyframes, seal/sunburst motifs
  components/
    Navbar.tsx        # sticky nav, transparent → solid on scroll
    Hero.tsx          # parallax campus hero
    StatsBand.tsx     # animated stat counters (placeholder data)
    Features.tsx      # 6-card feature grid
    Committee.tsx     # leadership preview strip
    IdCardCta.tsx     # join CTA + ID-card mock with QR motif
    Footer.tsx        # school crest + affiliation
    Reveal.tsx        # scroll-reveal wrapper
  lib/
    site.ts           # placeholder stats & nav links (TODO: wire to Firestore)
    firebase.ts       # Firebase init from env vars (no-op until configured)
public/images/       # logo.jpg, school.jpg, school-logo.png
assets/              # original brand assets
```

## Roadmap

**v1.0 (MVP)**
- [x] Homepage (navy/gold, animated, stats band)
- [ ] Firebase project setup + Auth
- [ ] Registration + admin verification flow
- [ ] Alumni directory (search by name/batch/city)
- [ ] Auto-generated digital ID card with QR verification page
- [ ] Gallery, Events, Committee pages
- [ ] Blood donor directory
- [ ] Location search (by district)
- [ ] Career info in profiles
- [ ] Super admin panel (full access + member approval)
- [ ] Admin panel (granular, per-admin permissions)

**v2.0**
- [ ] Job board, Mentorship program
- [ ] Scholarship / donation fund
- [ ] Success stories / Hall of fame
- [ ] Polls & voting, Batch groups
- [ ] Memory wall (super-admin only)
- [ ] Business directory

## Notes

- Homepage stats are placeholders (`src/lib/site.ts`) until Firestore is wired.
- Committee seats are placeholders until the admin panel manages them.
- Site copy is English; a Bangla/English toggle is planned.
