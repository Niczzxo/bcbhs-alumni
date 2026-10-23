# BCBHS Alumni — Security Architecture & Controls

_Last updated: 2026-10-23. This document describes what actually
protects this site, where each control lives, and what is still
pending. It deliberately distinguishes verified controls from
documented-but-not-yet-enabled ones._

## 1. The actual architecture (audit result)

The implementation brief this work followed assumed Vite + React +
PostgreSQL + custom API routes. **None of that is this project.** The
real stack, verified by inspection on 2026-10-23:

- **Next.js 16** (App Router) on **Vercel** — static/PPR pages, plus
  exactly **one** application-controlled API route,
  `POST /api/security/log` (added 2026-10-23, §7). No other API routes
  exist; nothing user-facing depends on a custom backend.
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
browser to `identitytoolkit.googleapis.com` — **no code in this repo
can rate-limit it**, and §3 is explicit about that boundary.
Controls live at the layers that exist: Firebase Auth's built-in
throttling, Firestore rules, a client-side progressive cooldown, an
append-only audit log, and — for the one endpoint we do control —
a distributed Upstash rate limiter (§7).

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
- Rules (hardened in pass 2): `allow create, update, delete: if
  false` for EVERY client; **read is super-admin only** (the
  administrator audit view). Records are created exclusively by the
  server endpoint with a Google service account (which bypasses
  rules, Admin-SDK style). Rules alone could never distinguish
  "browser wrote directly" from "our endpoint wrote with the user's
  token"; the service-account-only writer is what makes records
  non-forgeable.
- Logging is fire-and-forget: a logging failure never blocks or
  delays the action it records. Live delivery goes ONLY to
  POST /api/security/log, with exactly one bounded retry on network
  failure reusing the same eventId (the server write is idempotent).
  There is NO direct-Firestore fallback: on 429/503 the event is
  dropped by design (see §10).
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

## 7. Server-side rate limiting (Upstash) — ACTIVE (activated 2026-10-23)

**Implemented in code (2026-10-23):** `src/server/ratelimit.ts`
(@upstash/redis + @upstash/ratelimit, sliding windows, lazy
singletons), `src/server/verify-token.ts` (Firebase ID-token
verification against Google's JWKs), and the route
`src/app/api/security/log/route.ts`, plus
`src/server/service-account.ts` (the endpoint's only write path).
The client logger posts there and NOWHERE else: the former
direct-write fallback was removed in pass 2 because it let any
client mint unverifiable audit records while bypassing the limiter.

The endpoint pipeline: body validation (allowlisted event types,
4 KB cap, meta sanitization) → **rate-limit gate before any expensive
work** → token verification (actor comes from the verified token,
never the body) → Firestore write with the service account. The
client supplies an `eventId` per event and the document is created
under that id, so the bounded retry is idempotent (a repeat write
returns 409, mapped to success, never a duplicate).

Policies (`LIMIT_POLICIES`, each overridable via
`RL_<NAME>_LIMIT` / `RL_<NAME>_WINDOW` env vars):

| Policy | Limit | Applies to |
|---|---|---|
| ingestIp | 30 / 60 s | POST /api/security/log, per trusted IP |
| ingestIdentifier | 20 / 15 min | POST /api/security/log, per hashed identifier |
| loginAccount | 5 / 15 min | reserved for future app-controlled endpoints |
| loginIp | 20 / 15 min | reserved |
| resetAccount | 3 / 15 min | reserved |
| registerIp | 5 / 1 h | reserved |
| adminAction | 10 / 1 min | reserved |

Identities are `HMAC-SHA256(RATE_LIMIT_SECRET, namespace:id)` — raw
emails/IPs are never Redis keys. Trusted IP = `x-vercel-forwarded-for`
(the value Vercel's edge records), then `x-forwarded-for` locally;
when no IP is available the IP check is skipped (never a shared
placeholder key) and identifier limits still apply.

**Failure policy: fail closed.** Unconfigured or erroring Redis →
the endpoint answers **503 `{error:"security_service_unavailable"}`**
(verified by smoke test, §9). Rate-limited → **429** with
`Retry-After`. During an outage the client DROPS events rather than
writing them through any unverifiable path (deliberate trade-off,
§10).

**Activation: COMPLETED 2026-10-23.** The Upstash database
`bcbhs-alumni` (ap-south-1 Mumbai, Free plan) and the service
account `audit-log-writer` (Cloud Datastore User role only, single
live key) were created, all four variables below were set in
Vercel Production, and the site was redeployed. **Live verification
against the production endpoint (same day):** valid event → **202**;
malformed → **400**; oversized → **413**; a 22-request flood against
one identifier produced exactly 20 x 202 then **429 with
`Retry-After`**, the shared Redis counter staying exact across
serverless instances; the recorded event was read back from
Firestore in the expected shape, and all 21 test records were
deleted afterwards. Original setup steps kept for reference:
1. Upstash: sign in at console.upstash.com → Create Database (Redis,
   regional, close to the deployment) → open it → REST API section →
   copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
2. Service account: Google Cloud Console (project
   bcbhs-alumni-a18d8) → IAM & Admin → Service Accounts → Create
   service account (e.g. `audit-log-writer`) → grant ONLY the role
   **Cloud Datastore User** → Keys → Add key → Create new key → JSON
   → download. That file is a production secret: never commit it,
   never paste it into chat.
3. Vercel → Project bcbhs-alumni → Settings → Environment Variables
   (Production): set FOUR **server-only** variables (never
   `NEXT_PUBLIC_`): `UPSTASH_REDIS_REST_URL`,
   `UPSTASH_REDIS_REST_TOKEN` (step 1), `RATE_LIMIT_SECRET` (any
   long random string), `FIREBASE_SERVICE_ACCOUNT` (the ENTIRE
   contents of the JSON key from step 2 as one value; base64 also
   accepted).
4. Redeploy. The endpoint switches from fail-closed 503 to active
   automatically; verify with the smoke commands in §9.

**Not covered, by design:** Firebase Authentication requests
(sign-in / register / reset / OTP) never pass through this or any
endpoint here, so Upstash cannot throttle them; Firebase's own
limits apply (§3). A Vercel Firewall rule on `/api/*` can add a
coarse IP layer for the ingest endpoint (Dashboard → Firewall,
start log-only), but the firewall likewise cannot see Firebase
Auth traffic, which does not transit Vercel.

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

- `npm run test:security` — **31 node:test cases, all passing**
  (2026-10-23). 9 cover the client throttle and normalization
  (shared counters for equivalent identifiers, counter independence,
  success clearing only its own account, schedule + cap, 15-minute
  expiry, burst behaviour, countdown). 12 cover the server
  rate-limit layer with **mocked limiters**: trusted-IP precedence
  (a forged `X-Forwarded-For` cannot beat the platform header),
  HMAC identity properties, 429 + Retry-After derivation, counter
  independence, fail-closed 503 on limiter errors, identifier
  throttling across rotating IPs, and the brief's policy defaults.
- Endpoint smoke test against the production build (no Upstash
  configured): invalid body → **400**, unknown event type → **400**,
  oversized body → **413**, valid event → **503** (fail closed, as
  specified). The 429/202 path activates once the owner configures
  Upstash (§7) and was verified at the gate-logic level by the
  mocked-limiter tests, not against a live Redis.
- Pass 2 (fallback removal) added 10 cases: delivery semantics
  (429/503 final and never rerouted; exactly one network retry with
  an identical eventId; token attached only when supplied), a static
  source assertion that no direct `security_logs` write remains in
  the client, service-account env parsing (raw / base64 / junk),
  the 409-to-success outcome mapping, and a static rules assertion
  (client writes denied, super-admin read preserved).
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
  and its rules guarantee entries cannot be created by clients at
  all, forged for another actor, or altered after the fact.
- No alerting pipeline yet: repeated `login_failed` /
  `login_throttled` spikes are visible in `security_logs` but do not
  yet notify anyone. A scheduled check can be added if wanted.
- The audit ingest endpoint is **ACTIVE in production** (§7,
  live-verified 2026-10-23: 202/400/413, exact 429 threshold with
  Retry-After, Firestore read-back, test records deleted). One
  residual note: between the pass-2 deployment and activation
  (same day), live audit events were dropped by design rather than
  recorded through the removed insecure fallback, so the trail has
  a short gap on 2026-10-23; from activation onward it is
  continuous. (Demo mode's local trail is unaffected; it never
  claimed trust.)
