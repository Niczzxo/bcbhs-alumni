/**
 * Security audit logging + auth hardening helpers.
 *
 * Audit log: append-only `security_logs` collection. Firestore rules
 * (see firestore.rules) make it write-only for clients and readable
 * ONLY by the super admin; entries can never be edited or deleted
 * from a client. Events NEVER contain passwords, tokens, OTPs or raw
 * email addresses: pre-auth events carry a SHA-256 hash of the
 * normalized identifier, post-auth events carry user IDs (which the
 * super admin can already see in the members list).
 *
 * Demo mode keeps the same trail in a capped localStorage ring so the
 * behaviour is identical without Firebase.
 */

import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { LoginThrottle, normalizeIdentifier } from "@/lib/throttle";

export type SecurityEventType =
  | "login_success"
  | "login_failed"
  | "login_throttled"
  | "logout"
  | "password_reset_requested"
  | "member_approved"
  | "member_rejected"
  | "member_banned"
  | "member_unbanned"
  | "role_changed"
  | "permissions_changed"
  | "position_changed"
  | "guest_visibility_changed";

export interface SecurityEventDetails {
  targetUid?: string;
  /** Raw identifier to hash (never stored raw). */
  identifier?: string;
  meta?: Record<string, string | number | boolean>;
}

const DEMO_LOG_KEY = "bcbhs-security-log-demo";
const DEMO_LOG_CAP = 200;

/** SHA-256 of the normalized identifier, truncated for storage. */
export async function hashIdentifier(raw: string): Promise<string> {
  const normalized = normalizeIdentifier(raw);
  try {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`bcbhs:${normalized}`),
    );
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  } catch {
    /* WebCrypto unavailable (very old browser): fall back to a plain
       non-reversible marker rather than skipping the audit entry. */
    let h = 0;
    for (let i = 0; i < normalized.length; i++) h = (h * 31 + normalized.charCodeAt(i)) | 0;
    return `weak:${(h >>> 0).toString(16)}`;
  }
}

function currentActorUid(): string | null {
  if (isFirebaseConfigured) return auth?.currentUser?.uid ?? null;
  try {
    return window.localStorage.getItem("bcbhs-demo-user-id");
  } catch {
    return null;
  }
}

/**
 * Record one security event. Fire-and-forget by design: auditing must
 * never break or delay the action it records, so every failure here
 * is swallowed silently.
 */
export async function logSecurityEvent(
  type: SecurityEventType,
  details: SecurityEventDetails = {},
): Promise<void> {
  try {
    const entry: Record<string, unknown> = {
      type,
      actorUid: currentActorUid(),
    };
    if (details.targetUid) entry.targetUid = details.targetUid;
    if (details.identifier) entry.identifierHash = await hashIdentifier(details.identifier);
    if (details.meta) entry.meta = details.meta;

    if (!isFirebaseConfigured || !db) {
      try {
        const raw = window.localStorage.getItem(DEMO_LOG_KEY);
        const list = raw ? (JSON.parse(raw) as unknown[]) : [];
        list.push({ ...entry, createdAt: new Date().toISOString() });
        window.localStorage.setItem(DEMO_LOG_KEY, JSON.stringify(list.slice(-DEMO_LOG_CAP)));
      } catch {
        /* storage unavailable, demo trail is best-effort */
      }
      return;
    }
    const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
    await addDoc(collection(db, "security_logs"), { ...entry, createdAt: serverTimestamp() });
  } catch {
    /* auditing is best-effort; the action itself already happened */
  }
}

/** The shared client-side login throttle (one per browser session). */
export const loginThrottle = new LoginThrottle();

/**
 * Map a Firebase Auth failure to a safe, generic message. The raw
 * provider message is never shown: it can reveal whether an account
 * exists and exposes internal error codes.
 */
export function friendlyAuthError(e: unknown): string {
  const code =
    typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts from this network. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Network problem. Check your connection and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact the admin.";
    case "auth/invalid-email":
      return "That email address does not look valid.";
    default:
      return "Login failed. Please try again.";
  }
}
