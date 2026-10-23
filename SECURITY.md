# BCBHS Alumni — Security Architecture & Controls

_Last updated: 2026-10-23. This document describes what actually
protects this site, where each control lives, and what is still
pending. It deliberately distinguishes verified controls from
documented-but-not-yet-enabled ones._

## 1. The actual architecture (audit result)

The implementation brief this work followed assumed Vite + React +
PostgreSQL + custom API routes. **None of that is this project.** The
real stack, verified by inspection on 2026-10-23:

- **Next.js 16** (App Router) on **Vercel** — static/PPR pages, **zero
  custom API routes** (`src/app/api` does not exist).
- **Firebase Authentication** (Email/Password) — passwords are hashed
  and verified **by Google** (scrypt). The app never sees, stores or
  transmits a password anywhere except the Firebase Auth SDK call.
- **Cloud Firestore** — all data. Authorization is enforced
  **server-side by `firestore.rules`** on every read/write; the
  browser's role claims are never trusted.
- Sessions are Firebase ID tokens managed by the Auth SDK; every
  Firestore request is re-authorized by the rules against the caller's
  real `users/{uid}` document (`can()`, `isSuperAdmin()`).

Consequence: there is no login endpoint on our infrastructure to put
a Redis rate limiter in front of. Sign-in traffic goes from the
browser to `identitytoolkit.googleapis.com`. Controls were therefore
implemented at the layers that exist: Firebase Auth's built-in
throttling, Firestore rules, a client-side progressive cooldown, and
an append-only audit log. Adding Upstash in front of nothing would
have been security theatre, so it is **not** wired up; exact steps to
add it if real API routes appear are in §7.

## 2. Vulnerabilities found in the audit

| # | Finding | Status |
|---|---------|--------|
| 1 | Login form displayed **raw Firebase error messages** (`e.message`), which can reveal whether an account exists (user-not-found vs wrong-password) and expose provider internals. | **Fixed** — all auth errors map to generic messages (`friendlyAuthError`). |
| 2 | Password-reset behaved observably differently for existing vs non-existing emails (error vs success). | **Fixed** — response is now always identical and neutral; the UI copy says "If an account exists…". |
| 3 | **No audit trail** for logins or privileged actions (approvals, bans, role changes). | **Fixed** — `security_logs` collection, see §4. |
| 4 | No client-side slowdown between password guesses; a botnet is still Firebase's problem, but a single browser could hammer the form. | **Fixed** — progressive cooldown layer, see §3. |
| 5 | **App Check** is wired in code but not enforced (registration in Google Cloud Console is blocked on the project owner's Terms-of-Service acceptance). | **Pending owner action**, §8. |
| 6 | **MFA is not enabled** for Super Admin accounts. | **Pending enablement**, §8. |
| 7 | Email enumeration protection state in Firebase Console not verified during this pass. | **Verify in console**, §8. |

## 3. Login & reset protection (as configured)

**Server side (authoritative, Google-operated):** Firebase
Authentication throttles sign-in attempts per account and per IP and
returns `auth/too-many-requests`; password-reset sends are likewise
throttled per address and per IP. Password verification only happens
there; nothing in this codebase can weaken it.

**Client side (progressive cooldown, `src/lib/throttle.ts`):**

- Keyed on the **normalized** email (`trim().toLowerCase()` — the
  exact form the auth layer uses), so casing/whitespace variants
  share one counter.
- Failures 1–3 free; then cooldowns of **5s, 15s, 30s, 60s, capped at
  120s**. Never a permanent lockout.
- The check runs **before** the password is sent for verification.
- A successful sign-in clears **only that account's** counter.
- Failures stop counting after a **15-minute window**.
- Every throttled attempt is audit-logged.

**Registration:** public sign-up can only create a `pending` member
(the Firestore create rule requires exactly the registration field
set, `status: "pending"`, `role: "member"`); privileged roles cannot
be self-assigned — verified in the rules audit.

**Admin actions:** approvals, bans, role/permission/position changes
are authorized **only** by Firestore rules (`can('approve_members')`,
super-admin branches) regardless of what the UI shows, and are now
audit-logged. There is no admin API surface to attach a per-minute
API quota to; if API routes are introduced, apply the brief's
10 req/min/admin default at that layer (§7).

## 4. Audit log (`security_logs`)

- Written by `logSecurityEvent` (`src/lib/security.ts`) from the auth
  layer: `login_success`, `login_failed`, `login_throttled`,
  `logout`, `password_reset_requested`, `member_approved`,
  `member_rejected`, `member_banned`, `member_unbanned`,
  `role_changed`, `permissions_changed`, `position_changed`,
  `guest_visibility_changed`.
- **Never** contains passwords, tokens, OTPs or raw emails. Pre-auth
  events store a truncated **SHA-256 hash** of the normalized email;
  post-auth events store user IDs.
- Rules: clients may **create only** (actor must be themselves, or
  `null` + hash for pre-auth events, with a strict field allowlist);
  **update/delete are denied to everyone**; **read is super-admin
  only** (Firestore Console or a future admin view).
- Logging is fire-and-forget: a logging failure never blocks or
  delays the action it records (documented availability trade-off —
  enforcement does not depend on the log).
- Retention: review quarterly; old entries can be pruned by the super
  admin in the Firestore Console (a Firestore TTL policy on
  `createdAt` can automate this).

## 5. IP handling

The app has **no server code that reads client IPs**, so there is no
spoofable `X-Forwarded-For` trust anywhere in this codebase. IP-based
throttling for auth is done by Firebase/Vercel platform layers,
which derive the address from the connection, not from
client-supplied headers. Account-based controls (rules + cooldown by
normalized identifier) work even if IP identification is unavailable.

## 6. HTTP / UI behaviour

- Auth failures show one generic message; the reset flow is
  indistinguishable for existing/non-existing emails.
- Cooldowns surface as a clear "Please wait N seconds" message; the
  form never auto-retries.
- Security headers (HSTS, X-Frame-Options DENY, nosniff,
  Referrer-Policy, Permissions-Policy) are set in `next.config.ts`.

## 7. If server API routes are added later (Upstash runbook)

1. Create an Upstash Redis database (same region as the deployment).
2. Set **server-only** env vars in Vercel (never `NEXT_PUBLIC_`):
   `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
   `RATE_LIMIT_SECRET` (HMAC key for pseudonymous identifiers).
   Names are pre-documented in `.env.example`.
3. Build limiters with `@upstash/ratelimit` (sliding window),
   instances created once at module scope; keys namespaced
   (`login:account:`, `login:ip:`, `reset:`, `otp:`, `register:`,
   `admin:`) using `HMAC(RATE_LIMIT_SECRET, normalizedIdentifier)`,
   never raw emails.
4. Initial policy from the brief: login 5 failures/account/15min +
   20 attempts/IP/15min; reset 3/account/15min + IP limit;
   OTP 5/challenge/10min; registration 5/IP/hour; sensitive admin
   actions 10/admin/min; everything else route-specific.
5. **Failure policy: fail closed.** If Redis errors or times out on
   an auth-sensitive route, return **503** with a generic message —
   never silently skip the check. Log the outage as a security event.
6. Vercel Firewall can then add a coarse per-IP layer on the `/api`
   paths (Dashboard → Firewall), starting in log-only mode. Note the
   firewall can **never** throttle Firebase Auth traffic — those
   calls do not pass through Vercel.

## 8. Pending owner actions (cannot be done from code)

1. **App Check:** accept the Google Cloud Terms in the Firebase
   Console (project `bcbhs-alumni-a18d8`), then register the web app
   in App Check (reCAPTCHA Enterprise) and flip enforcement on for
   Firestore + Auth. Code-side wiring already exists.
2. **MFA for Super Admins:** Firebase Console → Authentication →
   Sign-in method → enable TOTP multi-factor; then enrollment UI for
   the two super-admin accounts is a small follow-up build.
3. **Enumeration protection:** Console → Authentication → Settings →
   User actions — confirm "Email enumeration protection" is enabled.
4. **Vercel Firewall (optional, future):** only becomes meaningful
   if `/api` routes are introduced; see §7.6.

## 9. Tests

- `npm run test:security` — 9 node:test cases over the throttle and
  normalization logic (shared counters for equivalent identifiers,
  counter independence, success clearing only its own account,
  schedule + cap, 15-minute expiry, burst behaviour, countdown).
  **All 9 pass** (2026-10-23).
- Firestore rules behaviour is covered by the manual rules audit in
  §2–§4 and the demo-mode route sweep (27 routes, 0 errors). A
  Firebase-emulator rules test suite is the recommended next step if
  the rules grow further.
- Firebase-side throttling, session handling and password hashing
  execute on Google infrastructure and are not unit-testable from
  here; claims about them rest on the provider's documented behaviour,
  not on tests in this repo.

## 10. Known limitations

- The client cooldown is a UX/abuse-damping layer only; it can be
  bypassed by a determined attacker with a fresh browser — real
  enforcement is Firebase's (§3). It is labelled as such in code.
- Audit entries are written by the client whose action they describe;
  a malicious insider with a modified client could omit an entry.
  The system of record for privileged changes remains Firestore
  itself (rules + document history); the log is a monitoring aid,
  and its rules guarantee entries cannot be forged for another actor
  or altered after the fact.
- No alerting pipeline yet: repeated `login_failed` /
  `login_throttled` spikes are visible in `security_logs` but do not
  yet notify anyone. A scheduled check can be added if wanted.
