/**
 * Distributed server-side rate limiting (Upstash Redis).
 *
 * SERVER-ONLY module: imported exclusively by route handlers under
 * src/app/api. The Redis token and the HMAC secret never reach the
 * browser (no NEXT_PUBLIC_ prefix, no client imports).
 *
 * What this protects: APPLICATION-CONTROLLED endpoints only (today:
 * POST /api/security/log). It does NOT, and cannot, rate-limit
 * Firebase Authentication traffic: sign-in, registration and password
 * reset go from the browser straight to Google's identity endpoints
 * and never pass through this code. Those are throttled by Firebase
 * itself (see SECURITY.md §3).
 *
 * Failure policy: FAIL CLOSED. If Redis is unconfigured, unreachable
 * or errors, protected endpoints answer 503 instead of silently
 * skipping the check.
 */

import { createHmac } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/* ------------------------------------------------------------------ */
/* Pure helpers (unit-tested in tests/ratelimit.test.mjs)              */
/* ------------------------------------------------------------------ */

export interface LimiterLike {
  limit: (key: string) => Promise<{ success: boolean; reset: number }>;
}

export type RateLimitDecision =
  | { ok: true }
  | { ok: false; status: 429; retryAfterSeconds: number; scope: string }
  | { ok: false; status: 503; scope: string };

/**
 * Trusted client IP. On Vercel the platform itself sets
 * `x-vercel-forwarded-for` at the edge (a client cannot forge the
 * value Vercel records), so it wins over any client-supplied
 * `x-forwarded-for`, which is only a fallback for non-Vercel local
 * runs. When nothing trustworthy exists we return null and the
 * caller SKIPS the IP check (account/identifier limits still apply)
 * instead of lumping every request under a shared placeholder key.
 */
export function clientIp(headers: { get: (name: string) => string | null }): string | null {
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) {
    const first = vercel.split(",")[0]?.trim();
    if (first) return first;
  }
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  return null;
}

/**
 * Privacy-preserving rate-limit identity: HMAC-SHA256 of the
 * identifier under a server-only secret, namespaced per control so
 * counters never collide across endpoints. Raw emails and IPs are
 * never used as Redis keys.
 */
export function pseudonymousId(secret: string, namespace: string, identifier: string): string {
  return createHmac("sha256", secret)
    .update(`${namespace}:${identifier}`)
    .digest("hex")
    .slice(0, 32);
}

export interface LimitCheck {
  scope: string;
  limiter: LimiterLike | null;
  key: string | null;
}

/**
 * Run the checks in order (cheapest / broadest first). A missing
 * limiter or key SKIPS that check; a limiter ERROR fails closed with
 * a 503 decision; an exhausted limiter yields 429 with the
 * Retry-After derived from its reset timestamp.
 */
export async function evaluateLimits(checks: LimitCheck[]): Promise<RateLimitDecision> {
  for (const check of checks) {
    if (!check.limiter || !check.key) continue;
    let result: { success: boolean; reset: number };
    try {
      result = await check.limiter.limit(check.key);
    } catch {
      return { ok: false, status: 503, scope: check.scope };
    }
    if (!result.success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      return { ok: false, status: 429, retryAfterSeconds, scope: check.scope };
    }
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Policies (initial values from the security brief; each limit and   */
/* window is overridable via env: RL_<NAME>_LIMIT / RL_<NAME>_WINDOW) */
/* ------------------------------------------------------------------ */

export interface LimitPolicy {
  limit: number;
  windowSeconds: number;
}

export const LIMIT_POLICIES: Record<string, LimitPolicy> = {
  /* For future application-controlled auth-adjacent endpoints.
     Firebase Auth traffic itself is NOT routed through here. */
  loginAccount: { limit: 5, windowSeconds: 15 * 60 },
  loginIp: { limit: 20, windowSeconds: 15 * 60 },
  resetAccount: { limit: 3, windowSeconds: 15 * 60 },
  registerIp: { limit: 5, windowSeconds: 60 * 60 },
  adminAction: { limit: 10, windowSeconds: 60 },
  /* The live policies of POST /api/security/log (audit ingest):
     generous enough for honest bursts, tight enough to stop floods. */
  ingestIp: { limit: 30, windowSeconds: 60 },
  ingestIdentifier: { limit: 20, windowSeconds: 15 * 60 },
};

function policyFromEnv(name: string): LimitPolicy {
  const base = LIMIT_POLICIES[name];
  const envLimit = Number(process.env[`RL_${name.toUpperCase()}_LIMIT`]);
  const envWindow = Number(process.env[`RL_${name.toUpperCase()}_WINDOW`]);
  return {
    limit: Number.isFinite(envLimit) && envLimit > 0 ? envLimit : base.limit,
    windowSeconds: Number.isFinite(envWindow) && envWindow > 0 ? envWindow : base.windowSeconds,
  };
}

/* ------------------------------------------------------------------ */
/* Upstash wiring (lazy singletons, created once per server process)  */
/* ------------------------------------------------------------------ */

let redisCache: Redis | null | undefined;
let ingestCache: { ip: LimiterLike; identifier: LimiterLike } | null | undefined;

export function getRedis(): Redis | null {
  if (redisCache !== undefined) return redisCache;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redisCache = url && token ? new Redis({ url, token }) : null;
  return redisCache;
}

export function rateLimitSecret(): string | null {
  return process.env.RATE_LIMIT_SECRET || null;
}

function makeLimiter(redis: Redis, name: string): LimiterLike {
  const policy = policyFromEnv(name);
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(policy.limit, `${policy.windowSeconds} s`),
    prefix: `bcbhs:${name}`,
    analytics: false,
  });
}

/** Limiters for the audit-ingest endpoint; null when unconfigured. */
export function getIngestLimiters(): { ip: LimiterLike; identifier: LimiterLike } | null {
  if (ingestCache !== undefined) return ingestCache;
  const redis = getRedis();
  ingestCache = redis
    ? { ip: makeLimiter(redis, "ingestIp"), identifier: makeLimiter(redis, "ingestIdentifier") }
    : null;
  return ingestCache;
}

/**
 * The ingest gate used by POST /api/security/log: fails closed (503)
 * when the limiter stack or the HMAC secret is not configured, so a
 * protected endpoint never silently runs unlimited.
 */
export async function ingestGate(input: {
  limiters: { ip: LimiterLike; identifier: LimiterLike } | null;
  secret: string | null;
  ip: string | null;
  identifierHash: string | null;
}): Promise<RateLimitDecision> {
  if (!input.limiters || !input.secret) return { ok: false, status: 503, scope: "config" };
  return evaluateLimits([
    {
      scope: "ip",
      limiter: input.limiters.ip,
      key: input.ip ? pseudonymousId(input.secret, "ingest-ip", input.ip) : null,
    },
    {
      scope: "identifier",
      limiter: input.limiters.identifier,
      key: input.identifierHash
        ? pseudonymousId(input.secret, "ingest-id", input.identifierHash)
        : null,
    },
  ]);
}
