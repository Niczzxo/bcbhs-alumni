/**
 * Tests for the distributed rate-limit layer (src/server/ratelimit.ts)
 * using MOCK limiters, per the brief's allowance for mocked Redis in
 * unit tests. The real limiters are @upstash/ratelimit sliding
 * windows over Upstash Redis; this suite verifies the code that
 * decides WHICH limiter and key apply, how identities are derived,
 * and how 429 / 503 / Retry-After outcomes are produced. A live
 * cross-instance check needs a real Upstash database (owner setup,
 * SECURITY.md §7) and is NOT claimed here.
 *
 * Run: npm run test:security
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LIMIT_POLICIES,
  clientIp,
  evaluateLimits,
  ingestGate,
  pseudonymousId,
} from "../src/server/ratelimit.ts";

const headersOf = (obj) => ({
  get: (name) => obj[name.toLowerCase()] ?? null,
});

/** A stateful fixed-window limiter with an injectable clock. */
function fakeWindowLimiter(limit, windowMs, now) {
  const buckets = new Map();
  return {
    limit: async (key) => {
      const t = now();
      const b = buckets.get(key);
      if (!b || t >= b.reset) {
        buckets.set(key, { count: 1, reset: t + windowMs });
        return { success: true, reset: t + windowMs };
      }
      if (b.count >= limit) return { success: false, reset: b.reset };
      b.count += 1;
      return { success: true, reset: b.reset };
    },
  };
}

const SECRET = "test-secret-not-for-production";

/* ------------------------- trusted IP ------------------------- */

test("clientIp: the Vercel platform header beats a forged X-Forwarded-For", () => {
  const headers = headersOf({
    "x-vercel-forwarded-for": "203.0.113.9",
    "x-forwarded-for": "1.1.1.1, 2.2.2.2",
    "x-real-ip": "1.1.1.1",
  });
  assert.equal(clientIp(headers), "203.0.113.9");
});

test("clientIp: falls back to the first X-Forwarded-For entry off-Vercel", () => {
  assert.equal(clientIp(headersOf({ "x-forwarded-for": "198.51.100.7, 10.0.0.1" })), "198.51.100.7");
});

test("clientIp: missing IP yields null, never a shared placeholder", () => {
  assert.equal(clientIp(headersOf({})), null);
});

/* --------------------- pseudonymous identity ------------------- */

test("pseudonymousId: deterministic, namespaced, secret-dependent, key-safe", () => {
  const a = pseudonymousId(SECRET, "ingest-ip", "203.0.113.9");
  assert.equal(a, pseudonymousId(SECRET, "ingest-ip", "203.0.113.9"));
  assert.notEqual(a, pseudonymousId(SECRET, "ingest-id", "203.0.113.9"), "namespaces separate counters");
  assert.notEqual(a, pseudonymousId(SECRET, "ingest-ip", "203.0.113.10"));
  assert.notEqual(a, pseudonymousId("another-secret", "ingest-ip", "203.0.113.9"));
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.ok(!a.includes("203.0.113.9"), "the raw IP never appears in the key");
});

/* ------------------------- evaluateLimits ---------------------- */

test("requests pass while under the limit, then 429 with Retry-After", async () => {
  let t = 1_000_000;
  const now = () => t;
  const limiter = fakeWindowLimiter(3, 60_000, now);
  const checks = () => [{ scope: "ip", limiter, key: "k1" }];
  assert.equal((await evaluateLimits(checks())).ok, true);
  assert.equal((await evaluateLimits(checks())).ok, true);
  assert.equal((await evaluateLimits(checks())).ok, true);
  const blocked = await evaluateLimits(checks());
  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.scope, "ip");
  assert.ok(blocked.retryAfterSeconds >= 1 && blocked.retryAfterSeconds <= 60);
  t += 60_001;
  assert.equal((await evaluateLimits(checks())).ok, true, "counter recovers after the window");
});

test("account and IP counters behave independently", async () => {
  const now = () => 5_000_000;
  const ipLimiter = fakeWindowLimiter(2, 60_000, now);
  const idLimiter = fakeWindowLimiter(2, 60_000, now);
  const run = (ipKey, idKey) =>
    evaluateLimits([
      { scope: "ip", limiter: ipLimiter, key: ipKey },
      { scope: "identifier", limiter: idLimiter, key: idKey },
    ]);
  await run("ipA", "user1");
  await run("ipA", "user1");
  const third = await run("ipA", "user2");
  assert.equal(third.status, 429);
  assert.equal(third.scope, "ip", "the shared IP budget is what ran out");
  const otherIp = await run("ipB", "user1");
  assert.equal(otherIp.status, 429);
  assert.equal(otherIp.scope, "identifier", "user1 is limited on their own counter too");
  assert.equal((await run("ipB", "user3")).ok, true, "an unrelated user is unaffected");
});

test("one key's traffic never clears or consumes another key's budget", async () => {
  const now = () => 9_000_000;
  const limiter = fakeWindowLimiter(2, 60_000, now);
  await evaluateLimits([{ scope: "identifier", limiter, key: "attacker" }]);
  await evaluateLimits([{ scope: "identifier", limiter, key: "attacker" }]);
  assert.equal((await evaluateLimits([{ scope: "identifier", limiter, key: "victim" }])).ok, true);
  const attacker = await evaluateLimits([{ scope: "identifier", limiter, key: "attacker" }]);
  assert.equal(attacker.status, 429, "success elsewhere does not reset the attacker's counter");
});

test("a limiter error fails closed with 503", async () => {
  const broken = {
    limit: async () => {
      throw new Error("redis unreachable");
    },
  };
  const d = await evaluateLimits([{ scope: "ip", limiter: broken, key: "k" }]);
  assert.deepEqual(d, { ok: false, status: 503, scope: "ip" });
});

test("a missing IP skips only the IP check (identifier limits still apply)", async () => {
  const now = () => 3_000_000;
  const idLimiter = fakeWindowLimiter(1, 60_000, now);
  const checks = (key) => [
    { scope: "ip", limiter: null, key: null },
    { scope: "identifier", limiter: idLimiter, key },
  ];
  assert.equal((await evaluateLimits(checks("u1"))).ok, true);
  assert.equal((await evaluateLimits(checks("u1"))).status, 429);
});

/* --------------------------- ingestGate ------------------------ */

test("ingestGate: unconfigured limiter stack fails closed (503)", async () => {
  const d1 = await ingestGate({ limiters: null, secret: SECRET, ip: "1.2.3.4", identifierHash: "ab".repeat(16) });
  assert.deepEqual(d1, { ok: false, status: 503, scope: "config" });
  const now = () => 7_000_000;
  const limiters = { ip: fakeWindowLimiter(30, 60_000, now), identifier: fakeWindowLimiter(20, 900_000, now) };
  const d2 = await ingestGate({ limiters, secret: null, ip: "1.2.3.4", identifierHash: "ab".repeat(16) });
  assert.equal(d2.status, 503, "no HMAC secret, no service");
});

test("ingestGate: identifier flood is throttled even across rotating IPs", async () => {
  const now = () => 11_000_000;
  const limiters = { ip: fakeWindowLimiter(30, 60_000, now), identifier: fakeWindowLimiter(3, 900_000, now) };
  const hash = "cd".repeat(16);
  for (let i = 0; i < 3; i++) {
    const d = await ingestGate({ limiters, secret: SECRET, ip: `10.0.0.${i}`, identifierHash: hash });
    assert.equal(d.ok, true);
  }
  const d = await ingestGate({ limiters, secret: SECRET, ip: "10.9.9.9", identifierHash: hash });
  assert.equal(d.status, 429);
  assert.equal(d.scope, "identifier");
});

/* ---------------------------- policies ------------------------- */

test("initial policies match the brief's defaults", () => {
  assert.deepEqual(LIMIT_POLICIES.loginAccount, { limit: 5, windowSeconds: 900 });
  assert.deepEqual(LIMIT_POLICIES.loginIp, { limit: 20, windowSeconds: 900 });
  assert.deepEqual(LIMIT_POLICIES.resetAccount, { limit: 3, windowSeconds: 900 });
  assert.deepEqual(LIMIT_POLICIES.registerIp, { limit: 5, windowSeconds: 3600 });
  assert.deepEqual(LIMIT_POLICIES.adminAction, { limit: 10, windowSeconds: 60 });
});
