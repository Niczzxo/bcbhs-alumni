/**
 * Delivery for security audit events: POST to the protected ingest
 * endpoint (POST /api/security/log), and NOTHING else.
 *
 * There is deliberately NO direct-Firestore fallback. Firestore rules
 * deny all client creates on `security_logs`, and a fallback would
 * let a modified client mint "trusted" audit records while bypassing
 * the server's rate limiting and actor verification. If the endpoint
 * refuses (429) or is unavailable (503), the event is dropped;
 * audit delivery is best-effort and must never weaken the trust
 * boundary to gain reliability.
 *
 * Retry policy: exactly one retry, and only after a NETWORK failure
 * (no response received, where delivery is genuinely uncertain).
 * HTTP responses - including 429 and 503 - are final. Every attempt
 * carries the same `eventId`, and the endpoint writes under that id,
 * so a retry after an uncertain network failure is idempotent and
 * cannot create a duplicate record.
 */

export interface DeliveryOutcome {
  delivered: boolean;
  attempts: number;
  /** HTTP status of the final attempt, or null for a network failure. */
  lastStatus: number | null;
}

interface FetchResponseLike {
  ok: boolean;
  status: number;
}

export async function deliverSecurityEvent(input: {
  fetchFn: (url: string, init: Record<string, unknown>) => Promise<FetchResponseLike>;
  sleep: (ms: number) => Promise<void>;
  payload: Record<string, unknown>;
  token: string | null;
}): Promise<DeliveryOutcome> {
  const init: Record<string, unknown> = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(input.token ? { Authorization: `Bearer ${input.token}` } : {}),
    },
    body: JSON.stringify(input.payload),
  };
  const MAX_ATTEMPTS = 2;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await input.fetchFn("/api/security/log", init);
      /* Any HTTP response is final: success delivers; 429/503/4xx/5xx
         drop the event. Never retried, never rerouted. */
      return { delivered: res.ok, attempts: attempt, lastStatus: res.status };
    } catch {
      if (attempt === MAX_ATTEMPTS) {
        return { delivered: false, attempts: attempt, lastStatus: null };
      }
      await input.sleep(750);
    }
  }
  return { delivered: false, attempts: MAX_ATTEMPTS, lastStatus: null };
}
