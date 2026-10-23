/**
 * Security tests for the client-side login throttle + identifier
 * normalization (src/lib/throttle.ts).
 *
 * Scope, stated honestly: this suite covers the pure logic that runs
 * in the browser. The authoritative server-side enforcement for this
 * site is Firebase Authentication (per-account and per-IP throttling
 * at Google) plus Firestore security rules; those are verified by the
 * rules audit in SECURITY.md, not by unit tests here, because they
 * execute on Google's infrastructure. Run: npm run test:security
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LoginThrottle,
  cooldownForFailures,
  normalizeIdentifier,
  FAILURE_WINDOW_MS,
} from "../src/lib/throttle.ts";

function fakeClock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms) => (t += ms) };
}

test("normalization: casing and whitespace collapse to one identifier", () => {
  assert.equal(normalizeIdentifier("  User@Example.COM "), "user@example.com");
  assert.equal(normalizeIdentifier("user@example.com"), "user@example.com");
  assert.equal(normalizeIdentifier("\tUSER@example.com\n"), "user@example.com");
});

test("equivalent normalized identifiers share one account counter", () => {
  const clock = fakeClock();
  const th = new LoginThrottle(clock.now);
  th.recordFailure("Person@Example.com");
  th.recordFailure(" person@example.com ");
  th.recordFailure("PERSON@EXAMPLE.COM");
  const { failures } = th.recordFailure("person@example.com");
  assert.equal(failures, 4);
  assert.equal(th.failureCount("  PERSON@example.com"), 4);
});

test("first three failures are free, then a progressive cooldown applies", () => {
  assert.equal(cooldownForFailures(1), 0);
  assert.equal(cooldownForFailures(3), 0);
  assert.equal(cooldownForFailures(4), 5_000);
  assert.equal(cooldownForFailures(5), 15_000);
  assert.equal(cooldownForFailures(6), 30_000);
  assert.equal(cooldownForFailures(7), 60_000);
  assert.equal(cooldownForFailures(8), 120_000);
});

test("cooldown is capped and never becomes a permanent lockout", () => {
  assert.equal(cooldownForFailures(50), 120_000);
  const clock = fakeClock();
  const th = new LoginThrottle(clock.now);
  for (let i = 0; i < 12; i++) th.recordFailure("a@b.com");
  assert.ok(th.check("a@b.com") > 0);
  clock.advance(120_001);
  assert.equal(th.check("a@b.com"), 0, "after the cap the user may try again");
});

test("account counters are independent", () => {
  const clock = fakeClock();
  const th = new LoginThrottle(clock.now);
  for (let i = 0; i < 6; i++) th.recordFailure("victim@example.com");
  assert.ok(th.check("victim@example.com") > 0);
  assert.equal(th.check("someone-else@example.com"), 0);
  assert.equal(th.failureCount("someone-else@example.com"), 0);
});

test("a successful login clears only that account's counter", () => {
  const clock = fakeClock();
  const th = new LoginThrottle(clock.now);
  for (let i = 0; i < 6; i++) {
    th.recordFailure("one@example.com");
    th.recordFailure("two@example.com");
  }
  th.recordSuccess("one@example.com");
  assert.equal(th.check("one@example.com"), 0);
  assert.ok(th.check("two@example.com") > 0, "the other counter is untouched");
});

test("failures expire after the 15-minute window", () => {
  const clock = fakeClock();
  const th = new LoginThrottle(clock.now);
  for (let i = 0; i < 5; i++) th.recordFailure("a@b.com");
  assert.equal(th.failureCount("a@b.com"), 5);
  clock.advance(FAILURE_WINDOW_MS + 1);
  assert.equal(th.failureCount("a@b.com"), 0);
  const { failures } = th.recordFailure("a@b.com");
  assert.equal(failures, 1, "counting restarts after the window");
});

test("a burst of parallel failures cannot exceed the capped cooldown", () => {
  const clock = fakeClock();
  const th = new LoginThrottle(clock.now);
  let max = 0;
  for (let i = 0; i < 100; i++) max = Math.max(max, th.recordFailure("a@b.com").retryAfterMs);
  assert.equal(max, 120_000);
});

test("check() counts down as time passes", () => {
  const clock = fakeClock();
  const th = new LoginThrottle(clock.now);
  for (let i = 0; i < 4; i++) th.recordFailure("a@b.com");
  assert.equal(th.check("a@b.com"), 5_000);
  clock.advance(2_000);
  assert.equal(th.check("a@b.com"), 3_000);
  clock.advance(3_000);
  assert.equal(th.check("a@b.com"), 0);
});
