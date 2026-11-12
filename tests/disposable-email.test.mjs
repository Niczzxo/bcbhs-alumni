/**
 * Tests for the disposable-email blocklist (src/lib/disposable-email-domains.ts).
 *
 * Run: npm run test:security
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { isDisposableEmail } from "../src/lib/disposable-email-domains.ts";

test("well-known temp-mail services are blocked", () => {
  for (const email of [
    "someone@temp-mail.org",
    "someone@tempmail.com",
    "someone@guerrillamail.com",
    "someone@10minutemail.com",
    "someone@mailinator.com",
    "someone@yopmail.com",
    "someone@maildrop.cc",
    "someone@getnada.com",
    "someone@throwawaymail.com",
    "someone@fakemail.net",
    "someone@1secmail.com",
    "someone@mohmal.com",
  ]) {
    assert.equal(isDisposableEmail(email), true, email);
  }
});

test("subdomains of a blocked service are blocked too", () => {
  assert.equal(isDisposableEmail("someone@eu.temp-mail.org"), true);
  assert.equal(isDisposableEmail("someone@a.b.guerrillamail.com"), true);
});

test("real inboxes are allowed", () => {
  for (const email of [
    "someone@gmail.com",
    "someone@yahoo.com",
    "someone@outlook.com",
    "someone@bcbhsalumni.org",
    "someone@company.com.bd",
  ]) {
    assert.equal(isDisposableEmail(email), false, email);
  }
});

test("lookalike domains are not blocked", () => {
  // Suffix matching strips whole labels only: "nottemp-mail.org"
  // is a different domain from "temp-mail.org".
  assert.equal(isDisposableEmail("someone@nottemp-mail.org"), false);
  assert.equal(isDisposableEmail("someone@mygmail.com"), false);
});

test("casing, whitespace and malformed input", () => {
  assert.equal(isDisposableEmail("Someone@TEMP-MAIL.ORG"), true);
  assert.equal(isDisposableEmail("someone@temp-mail.org "), true);
  assert.equal(isDisposableEmail("not-an-email"), false);
  assert.equal(isDisposableEmail("someone@"), false);
  assert.equal(isDisposableEmail(""), false);
});
