/**
 * Login throttling primitives (pure, dependency-free, unit-tested in
 * tests/security-core.test.mjs).
 *
 * Layering note: the REAL enforcement for this site lives server-side
 * at Firebase Authentication (Google throttles sign-in attempts per
 * account and per IP, and returns auth/too-many-requests). This module
 * is the client-side progressive-cooldown layer on top: it slows down
 * repeated failed attempts from this browser, gives the member a
 * clear wait message, and feeds the security audit log. It never
 * permanently locks an account, and a successful sign-in clears only
 * that account's own counter, never anyone else's.
 */

/** Normalize an account identifier the same way everywhere: the auth
 *  layer already trims and lowercases email before sign-in, and the
 *  throttle keys on exactly that normalized form, so casing or
 *  whitespace variants share one counter. */
export function normalizeIdentifier(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Failures older than this window stop counting (15 minutes). */
export const FAILURE_WINDOW_MS = 15 * 60 * 1000;

/** Progressive cooldown after the Nth consecutive failure (ms).
 *  Failures 1-3 are free (typos happen), then 5s, 15s, 30s, 60s,
 *  capped at 120s. It is a cooldown, never a lockout. */
const COOLDOWN_SCHEDULE_MS = [0, 0, 0, 0, 5_000, 15_000, 30_000, 60_000, 120_000];

export function cooldownForFailures(failures: number): number {
  if (failures <= 0) return 0;
  return COOLDOWN_SCHEDULE_MS[Math.min(failures, COOLDOWN_SCHEDULE_MS.length - 1)];
}

interface Entry {
  failures: number;
  lastFailureAt: number;
  cooldownUntil: number;
}

export class LoginThrottle {
  private entries = new Map<string, Entry>();
  private nowFn: () => number;

  constructor(now: () => number = () => Date.now()) {
    this.nowFn = now;
  }

  /** Milliseconds the identifier must still wait (0 = may try now). */
  check(rawIdentifier: string): number {
    const entry = this.entries.get(normalizeIdentifier(rawIdentifier));
    if (!entry) return 0;
    return Math.max(0, entry.cooldownUntil - this.nowFn());
  }

  /** Record one failed attempt; returns the cooldown now in force. */
  recordFailure(rawIdentifier: string): { failures: number; retryAfterMs: number } {
    const key = normalizeIdentifier(rawIdentifier);
    const t = this.nowFn();
    const prev = this.entries.get(key);
    const withinWindow = prev && t - prev.lastFailureAt <= FAILURE_WINDOW_MS;
    const failures = (withinWindow ? prev.failures : 0) + 1;
    const retryAfterMs = cooldownForFailures(failures);
    this.entries.set(key, { failures, lastFailureAt: t, cooldownUntil: t + retryAfterMs });
    return { failures, retryAfterMs };
  }

  /** A successful sign-in clears ONLY this identifier's counter. */
  recordSuccess(rawIdentifier: string): void {
    this.entries.delete(normalizeIdentifier(rawIdentifier));
  }

  /** Current consecutive-failure count (after window expiry). */
  failureCount(rawIdentifier: string): number {
    const entry = this.entries.get(normalizeIdentifier(rawIdentifier));
    if (!entry) return 0;
    return this.nowFn() - entry.lastFailureAt <= FAILURE_WINDOW_MS ? entry.failures : 0;
  }
}
