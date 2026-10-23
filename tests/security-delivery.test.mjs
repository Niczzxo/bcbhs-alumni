/**
 * Tests for the hardened audit-delivery + server write path
 * (2026-10-23 pass 2):
 *
 * - The client delivers ONLY to POST /api/security/log. There is no
 *   direct-Firestore fallback (also asserted statically against the
 *   source, so the fallback cannot silently return).
 * - 429 and 503 are final: dropped, never retried, never rerouted.
 * - Exactly one bounded retry exists, for network failures only,
 *   reusing the same eventId so the server write is idempotent.
 * - Service-account env parsing and the Firestore status mapping
 *   that turns a 409 (duplicate eventId) into success.
 * - Firestore rules statically deny all client writes to
 *   security_logs while preserving super-admin read.
 *
 * Run: npm run test:security
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deliverSecurityEvent } from "../src/lib/security-delivery.ts";
import {
  firestoreOutcomeForStatus,
  parseServiceAccount,
} from "../src/server/service-account.ts";

const PAYLOAD = {
  type: "login_failed",
  eventId: "123e4567-e89b-42d3-a456-426614174000",
  identifierHash: "ab".repeat(16),
};
const noSleep = async () => {};

/* ------------------------- delivery ----------------------------- */

test("success: one attempt to the endpoint only, delivered", async () => {
  const calls = [];
  const out = await deliverSecurityEvent({
    fetchFn: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 202 };
    },
    sleep: noSleep,
    payload: PAYLOAD,
    token: null,
  });
  assert.deepEqual(out, { delivered: true, attempts: 1, lastStatus: 202 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/security/log");
});

test("429 is final: dropped, not retried, not rerouted", async () => {
  let calls = 0;
  const out = await deliverSecurityEvent({
    fetchFn: async () => {
      calls += 1;
      return { ok: false, status: 429 };
    },
    sleep: noSleep,
    payload: PAYLOAD,
    token: "tok",
  });
  assert.deepEqual(out, { delivered: false, attempts: 1, lastStatus: 429 });
  assert.equal(calls, 1);
});

test("503 is final: dropped, not retried, not rerouted", async () => {
  let calls = 0;
  const out = await deliverSecurityEvent({
    fetchFn: async () => {
      calls += 1;
      return { ok: false, status: 503 };
    },
    sleep: noSleep,
    payload: PAYLOAD,
    token: "tok",
  });
  assert.deepEqual(out, { delivered: false, attempts: 1, lastStatus: 503 });
  assert.equal(calls, 1);
});

test("network failure: exactly one retry, same eventId (idempotent)", async () => {
  const bodies = [];
  let n = 0;
  const out = await deliverSecurityEvent({
    fetchFn: async (url, init) => {
      bodies.push(init.body);
      n += 1;
      if (n === 1) throw new Error("network down");
      return { ok: true, status: 202 };
    },
    sleep: noSleep,
    payload: PAYLOAD,
    token: null,
  });
  assert.deepEqual(out, { delivered: true, attempts: 2, lastStatus: 202 });
  assert.equal(bodies[0], bodies[1], "the retry reuses the identical body and eventId");
  assert.equal(JSON.parse(bodies[1]).eventId, PAYLOAD.eventId);
});

test("double network failure: dropped after the bounded retry", async () => {
  let calls = 0;
  const out = await deliverSecurityEvent({
    fetchFn: async () => {
      calls += 1;
      throw new Error("offline");
    },
    sleep: noSleep,
    payload: PAYLOAD,
    token: null,
  });
  assert.deepEqual(out, { delivered: false, attempts: 2, lastStatus: null });
  assert.equal(calls, 2, "no third attempt, ever");
});

test("the bearer token is attached only when one is supplied", async () => {
  const seen = [];
  const fetchFn = async (url, init) => {
    seen.push(init.headers);
    return { ok: true, status: 202 };
  };
  await deliverSecurityEvent({ fetchFn, sleep: noSleep, payload: PAYLOAD, token: "ID_TOKEN" });
  await deliverSecurityEvent({ fetchFn, sleep: noSleep, payload: PAYLOAD, token: null });
  assert.equal(seen[0].Authorization, "Bearer ID_TOKEN");
  assert.ok(!("Authorization" in seen[1]), "pre-auth events carry no token");
});

/* --------------------- fallback stays removed -------------------- */

test("source check: the client has no direct security_logs write left", () => {
  const src = readFileSync(new URL("../src/lib/security.ts", import.meta.url), "utf8");
  assert.ok(!src.includes("addDoc"), "no addDoc fallback in the audit logger");
  assert.ok(!src.includes('collection(db, "security_logs")'), "no direct collection write");
  assert.ok(src.includes("deliverSecurityEvent"), "delivery goes through the endpoint helper");
});

/* ---------------------- service account -------------------------- */

const SA = {
  client_email: "audit-writer@bcbhs-alumni-a18d8.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n",
  project_id: "bcbhs-alumni-a18d8",
};

test("parseServiceAccount accepts raw and base64 JSON, rejects junk", () => {
  assert.equal(parseServiceAccount(JSON.stringify(SA))?.client_email, SA.client_email);
  const b64 = Buffer.from(JSON.stringify(SA), "utf8").toString("base64");
  assert.equal(parseServiceAccount(b64)?.client_email, SA.client_email);
  assert.equal(parseServiceAccount("not json at all"), null);
  assert.equal(parseServiceAccount(JSON.stringify({ client_email: "x@y.z" })), null);
  assert.equal(parseServiceAccount(undefined), null);
  assert.equal(parseServiceAccount(""), null);
});

test("firestoreOutcomeForStatus: 409 is an idempotent success, not an error", () => {
  assert.equal(firestoreOutcomeForStatus(200), "written");
  assert.equal(firestoreOutcomeForStatus(201), "written");
  assert.equal(firestoreOutcomeForStatus(409), "exists");
  assert.equal(firestoreOutcomeForStatus(403), "error");
  assert.equal(firestoreOutcomeForStatus(500), "error");
});

/* ----------------------------- rules ----------------------------- */

test("rules: clients cannot write security_logs; super admins can read", () => {
  const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
  const start = rules.indexOf("match /security_logs/");
  assert.ok(start >= 0, "security_logs match exists");
  const block = rules.slice(start, start + 1500);
  assert.ok(block.includes("allow create, update, delete: if false"), "all client writes denied");
  assert.ok(block.includes("allow read: if isSuperAdmin()"), "admin audit view preserved");
});
