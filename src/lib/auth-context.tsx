"use client";

/* ------------------------------------------------------------------ */
/*  Auth + member-store context.                                         */
/*  DEMO MODE (no Firebase credentials): everything runs against the   */
/*  in-memory DEMO_USERS list (persisted to localStorage), so every     */
/*  page renders and `npm run build` passes with zero backend.          */
/*  LIVE MODE (credentials present): Firebase Auth + Firestore `users`  */
/*  collection are used instead. See firestore.rules for access rules.  */
/* ------------------------------------------------------------------ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isFirebaseConfigured, auth, db } from "./firebase";
import type { MultiFactorError, MultiFactorResolver, TotpSecret } from "firebase/auth";
import { logSecurityEvent, loginThrottle, authErrorInfo, type AuthErrorField } from "@/lib/security";
import { DEMO_USERS } from "./demo-data";
import type { UserProfile } from "./types";

export interface RegisterInput {
  name: string;
  batch: string;
  roll?: string;
  email: string;
  password?: string;
  phone: string;
  whatsapp: string;
  bloodGroup: string;
  isDonor: boolean;
  district: string;
  country: string;
  department: string;
  dob: string;
  profession: string;
  company: string;
  photoURL?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  members: UserProfile[];
  loading: boolean;
  isDemo: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; field?: AuthErrorField; mfaResolver?: MultiFactorResolver }>;
  /** Second login step for TOTP-enrolled accounts. */
  completeMfaLogin: (
    resolver: MultiFactorResolver,
    code: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  /** TOTP two-factor (super admins, opt-in): is it enrolled on this account? */
  getTotpEnrolled: () => Promise<boolean>;
  /** Start TOTP enrollment: secret + QR URL for the authenticator app. */
  beginTotpEnrollment: () => Promise<{
    ok: boolean;
    secret?: TotpSecret;
    secretKey?: string;
    qrUrl?: string;
    error?: string;
  }>;
  /** Finish TOTP enrollment with the 6-digit code from the authenticator app. */
  confirmTotpEnrollment: (secret: TotpSecret, code: string) => Promise<{ ok: boolean; error?: string }>;
  /** Remove the TOTP factor from this account. */
  disableTotp: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ ok: boolean; error?: string }>;
  approveMember: (id: string) => Promise<void>;
  rejectMember: (id: string) => Promise<void>;
  banMember: (id: string) => Promise<void>;
  unbanMember: (id: string) => Promise<void>;
  /** Permanently delete a banned member (profile + phone + login),
      so they can register again anytime. Server-confirmed only. */
  deleteMember: (id: string) => Promise<{ ok: boolean; error?: string }>;
  setPermissions: (id: string, permissions: string[]) => Promise<void>;
  setRole: (id: string, role: UserProfile["role"]) => Promise<void>;
  /** Assign / clear a member's official position (admin only, manually verified). */
  setPosition: (id: string, position: string) => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<{ ok: boolean; error?: string }>;
  /** Account settings: the member's own WhatsApp number (users_private). */
  updatePhone: (phone: string) => Promise<{ ok: boolean; error?: string }>;
  /** Account settings: verification-first email change (reauth required). */
  changeEmail: (currentPassword: string, newEmail: string) => Promise<{ ok: boolean; error?: string }>;
  /** Account settings: password change (reauth required). */
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  hasPermission: (perm: string) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

/** Fields a member may edit on their own profile. */
export interface ProfileUpdateInput {
  name: string;
  batch: string;
  roll?: string;
  district: string;
  country: string;
  department: string;
  dob: string;
  profession: string;
  company: string;
  institution: string;
  eduSession: string;
  eduDepartment: string;
  eduRunning: boolean;
  phone: string;
  whatsapp: string;
  bloodGroup: string;
  isDonor: boolean;
  photoURL: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_STORAGE_KEY = "bcbhs-demo-members-v1";
const DEMO_USER_KEY = "bcbhs-demo-user-id";
/* Last known live profile, kept in the browser so a page reload can
 * paint the signed-in UI instantly while Firebase re-verifies the
 * session in the background. Display-only, Firestore rules still
 * guard every read and write server-side. */
const AUTH_CACHE_KEY = "bcbhs-auth-cache-v1";
/* The last verified member list for the cached profile's account, so
 * member-driven pages paint instantly on reload instead of waiting
 * for the full users fetch (perf, 2026-10-23). Keyed by uid: a
 * different account never sees another account's cached list. */
const MEMBERS_CACHE_KEY = "bcbhs-members-cache-v1";

function readCachedMembers(uid: string): UserProfile[] | null {
  try {
    const raw = window.localStorage.getItem(MEMBERS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { uid?: string; members?: UserProfile[] };
    if (!parsed || parsed.uid !== uid || !Array.isArray(parsed.members)) return null;
    return parsed.members;
  } catch {
    return null;
  }
}

/* Layout effects run before the browser paints, used for the cache
 * hydration below so the very first visible frame is already correct.
 * On the server this falls back to useEffect (no window, no cache). */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function readCachedProfile(): UserProfile | null {
  try {
    const raw = window.localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    return parsed && typeof parsed === "object" && typeof parsed.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function nextMemberId(batch: string, members: UserProfile[]): string {
  const seq = members.filter((m) => m.memberId).length + 1;
  return `BCBHS-${batch}-${String(seq).padStart(4, "0")}`;
}

/** Friendly messages for the account-settings flows (reauth + update). */
function settingsError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Current password is incorrect.";
    case "auth/email-already-in-use":
      return "That email is already used by another account.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "The new password is too weak. Use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a while and try again.";
    case "auth/requires-recent-login":
      return "Please log out and log in again, then try once more.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  /* Live mode starts EMPTY, seeding demo members here would flash
     fake people (and fake stats) on the real site before sign-in
     resolves, and a member whose list query was denied would keep
     seeing them. Demo data belongs to demo mode only. */
  const [members, setMembers] = useState<UserProfile[]>(isFirebaseConfigured ? [] : DEMO_USERS);
  const membersRef = useRef<UserProfile[]>(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);
  const [loading, setLoading] = useState(true);
  /* Skips the persist effect's first run per mount: the rehydrate effect
     above calls setMembers asynchronously, so persisting on the very first
     run would overwrite localStorage with the seed list before the stored
     list has been applied (and under StrictMode's double effects the
     second rehydrate would then "restore" that clobbered seed). */
  const persistArmed = useRef(false);

  /* Rehydrate demo store + session from localStorage (client only). */
  useEffect(() => {
    if (isFirebaseConfigured) return;
    try {
      const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
      let list = DEMO_USERS;
      if (raw) {
        const parsed = JSON.parse(raw) as UserProfile[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time client hydration
          setMembers(parsed);
          list = parsed;
        }
      }
      const uid = window.localStorage.getItem(DEMO_USER_KEY);
      if (uid) {
        const found = list.find((m) => m.id === uid);
        if (found) setUser(found);
      }
    } catch {
      /* corrupted storage, fall back to seed data */
    }
    setLoading(false);
  }, []);

  /* Persist demo mutations (never on the effect's first run, see above). */
  useEffect(() => {
    if (isFirebaseConfigured) return;
    if (!persistArmed.current) {
      persistArmed.current = true;
      return;
    }
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(members));
    } catch {
      /* storage full / unavailable, demo still works in memory */
    }
  }, [members]);

  /* Live mode: paint the cached profile the moment the app mounts, so a
   * reload shows the signed-in UI immediately instead of waiting on the
   * network. Runs as a layout effect, before the first paint. The
   * subscription below then refreshes (or clears) it. */
  useIsomorphicLayoutEffect(() => {
    if (!isFirebaseConfigured) return;
    const cached = readCachedProfile();
    if (cached) {
      setUser(cached);
      setLoading(false);
      const cachedMembers = readCachedMembers(cached.id);
      if (cachedMembers) setMembers(cachedMembers);
    }
  }, []);

  /* Keep the cache in step with the verified profile. First run is
   * skipped: on mount `user` is still null until hydration lands, and
   * persisting then would wipe the very cache being restored. */
  const cacheArmed = useRef(false);
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (!cacheArmed.current) {
      cacheArmed.current = true;
      return;
    }
    try {
      if (user) window.localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
      else {
        window.localStorage.removeItem(AUTH_CACHE_KEY);
        window.localStorage.removeItem(MEMBERS_CACHE_KEY);
      }
    } catch {
      /* storage unavailable, reloads simply fall back to the network */
    }
  }, [user]);

  /* Keep the member-list cache in step for the signed-in account. */
  useEffect(() => {
    if (!isFirebaseConfigured || !user || members.length === 0) return;
    try {
      window.localStorage.setItem(
        MEMBERS_CACHE_KEY,
        JSON.stringify({ uid: user.id, members }),
      );
    } catch {
      /* storage full / unavailable, the list simply refetches next time */
    }
  }, [user, members]);

  /* Live-mode auth subscription. */
  useEffect(() => {
    const liveAuth = auth;
    const liveDb = db;
    if (!isFirebaseConfigured || !liveAuth || !liveDb) return;
    let cancelled = false;
    const load = async () => {
      const { onAuthStateChanged } = await import("firebase/auth");
      const { doc, getDoc, updateDoc, collection, getDocs, query, where } = await import("firebase/firestore");
      return onAuthStateChanged(liveAuth, async (fbUser) => {
        if (cancelled) return;
        try {
          if (fbUser) {
            /* Start the approved-members query NOW, in parallel with
             * the own-profile fetch (perf, 2026-10-23): for regular
             * members it IS the final list, so member pages stop
             * waiting a whole extra serial round trip. Staff upgrade
             * to the full collection once their role is known. */
            const approvedPromise = getDocs(
              query(collection(liveDb, "users"), where("status", "==", "approved")),
            ).catch(() => null);
            /* Resolve the visitor's OWN profile first and end the
             * loading state immediately, the member list (needed by
             * the directory and dashboards) loads right after, so a
             * page reload never flashes the logged-out UI while the
             * collection is still downloading. */
            const snap = await getDoc(doc(liveDb, "users", fbUser.uid));
            if (cancelled) return;
            let own = snap.exists()
              ? ({ id: snap.id, ...(snap.data() as Omit<UserProfile, "id">) } as UserProfile)
              : null;
            /* Email self-sync (Settings email change): Firebase moves
               the sign-in email only after the member verifies the new
               inbox, so mirror it into the profile doc on the next
               sign-in and directory/admin views stay in agreement. */
            if (own && fbUser.email && own.email !== fbUser.email) {
              own = { ...own, email: fbUser.email };
              void updateDoc(doc(liveDb, "users", fbUser.uid), { email: fbUser.email }).catch(
                () => undefined,
              );
            }
            if (own) setUser(own);
            setLoading(false);
            /* Role-aware list fetch. Firestore denies a query whose
             * results it cannot prove readable: the full collection is
             * only readable by admins, while regular members may read
             * approved profiles, so they get a status-constrained
             * query (plus their own doc, whatever its status). The old
             * unconstrained fetch silently failed for every non-admin
             * and left the demo seed list on screen. */
            const isStaff = own?.role === "admin" || own?.role === "super_admin";
            const snapList = isStaff
              ? await getDocs(collection(liveDb, "users"))
              : await approvedPromise;
            if (!cancelled && snapList) {
              const list = snapList.docs.map(
                (d) => ({ id: d.id, ...(d.data() as Omit<UserProfile, "id">) }) as UserProfile,
              );
              if (own && !list.some((m) => m.id === own.id)) list.push(own);
              setMembers(list);
            }
          } else {
            setUser(null);
            if (!cancelled) setLoading(false);
          }
        } catch {
          /* Firestore unreachable, stay logged out of member data */
          if (!cancelled) setLoading(false);
        }
      });
    };
    const unsubPromise = load();
    return () => {
      cancelled = true;
      unsubPromise.then((u) => u && u()).catch(() => undefined);
    };
  }, []);

  const login = useCallback(
    async (
      email: string,
      _password: string,
    ): Promise<{ ok: boolean; error?: string; field?: AuthErrorField; mfaResolver?: MultiFactorResolver }> => {
      const clean = email.trim().toLowerCase();
      if (!isFirebaseConfigured || !auth || !db) {
        /* Demo mode: match by email; any password is accepted. */
        const found = members.find((m) => m.email.toLowerCase() === clean);
        if (!found) {
          void logSecurityEvent("login_failed", { identifier: clean });
          return { ok: false, field: "email", error: "No account found for this email in demo mode." };
        }
        if (found.status === "rejected")
          return { ok: false, error: "This registration was rejected. Please contact the admin." };
        setUser(found);
        try {
          window.localStorage.setItem(DEMO_USER_KEY, found.id);
        } catch {
          /* session persistence unavailable, in-memory only */
        }
        void logSecurityEvent("login_success", {});
        return { ok: true };
      }
      /* Progressive cooldown (client layer over Firebase Auth's own
         server-side throttling): after repeated failures this browser
         must wait before another password is even sent. Checked
         BEFORE the expensive verification, keyed on the normalized
         email, and a success clears only this account's counter. */
      const waitMs = loginThrottle.check(clean);
      if (waitMs > 0) {
        void logSecurityEvent("login_throttled", {
          identifier: clean,
          meta: { waitSeconds: Math.ceil(waitMs / 1000) },
        });
        return {
          ok: false,
          error: `Too many failed attempts. Please wait ${Math.ceil(waitMs / 1000)} seconds and try again.`,
        };
      }
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const { doc, getDoc } = await import("firebase/firestore");
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, clean, _password);
      } catch (e) {
        /* TOTP second step (2026-10-28): the password was right, only
           the authenticator code is missing. This is NOT a failed
           login, so it must not count toward throttling or log a
           failure. The form shows the code step instead. */
        if ((e as { code?: string })?.code === "auth/multi-factor-auth-required") {
          const { getMultiFactorResolver } = await import("firebase/auth");
          return { ok: false, mfaResolver: getMultiFactorResolver(auth, e as MultiFactorError) };
        }
        loginThrottle.recordFailure(clean);
        void logSecurityEvent("login_failed", { identifier: clean });
        /* Mapped messages only, never the raw provider text. When
           Firebase names the failing field the form marks that
           field alone (owner's instruction, 2026-10-24); on this
           project enumeration protection merges both credential
           failures into auth/invalid-credential, which authErrorInfo
           keeps as the one shared message. */
        const info = authErrorInfo(e);
        return { ok: false, error: info.message, field: info.field };
      }
      loginThrottle.recordSuccess(clean);
      try {
        const snap = await getDoc(doc(db, "users", cred.user.uid));
        if (!snap.exists()) return { ok: false, error: "Profile not found." };
        const profile = { id: snap.id, ...(snap.data() as Omit<UserProfile, "id">) };
        if (profile.status === "rejected")
          return { ok: false, error: "This registration was rejected. Please contact the admin." };
        setUser(profile);
        void logSecurityEvent("login_success", {});
        return { ok: true };
      } catch {
        return { ok: false, error: "Signed in, but your profile could not be loaded. Please try again." };
      }
    },
    [members],
  );

  /* Second login step for TOTP-enrolled accounts (2026-10-28): the
     resolver comes from the login attempt itself, so the code step
     must run in the same browser session, right after login. */
  const completeMfaLogin = useCallback(
    async (resolver: MultiFactorResolver, code: string) => {
      if (!isFirebaseConfigured || !auth || !db)
        return { ok: false, error: "Two-factor needs a live account." };
      try {
        const { TotpMultiFactorGenerator } = await import("firebase/auth");
        const { doc, getDoc } = await import("firebase/firestore");
        const assertion = TotpMultiFactorGenerator.assertionForSignIn(
          resolver.hints[0].uid,
          code.trim(),
        );
        const cred = await resolver.resolveSignIn(assertion);
        const snap = await getDoc(doc(db, "users", cred.user.uid));
        if (!snap.exists()) return { ok: false, error: "Profile not found." };
        const profile = { id: snap.id, ...(snap.data() as Omit<UserProfile, "id">) };
        if (profile.status === "rejected")
          return { ok: false, error: "This registration was rejected. Please contact the admin." };
        setUser(profile);
        void logSecurityEvent("login_success", {});
        return { ok: true };
      } catch (e) {
        const c = (e as { code?: string })?.code ?? "";
        if (c === "auth/invalid-verification-code")
          return { ok: false, error: "Wrong code. Check your authenticator app and try again." };
        return { ok: false, error: "Verification failed. Please try again." };
      }
    },
    [],
  );

  /* TOTP two-factor for super admins, opt-in (2026-10-28). Nobody is
     forced: a super admin enrolls from their own settings, and can
     disable it any time while signed in. */
  const getTotpEnrolled = useCallback(async () => {
    if (!isFirebaseConfigured || !auth?.currentUser) return false;
    try {
      const { multiFactor } = await import("firebase/auth");
      await auth.currentUser.reload();
      const factors = multiFactor(auth.currentUser).enrolledFactors ?? [];
      return factors.some((f) => f.factorId === "totp");
    } catch {
      return false;
    }
  }, []);

  const beginTotpEnrollment = useCallback(async () => {
    if (!isFirebaseConfigured || !auth?.currentUser)
      return { ok: false, error: "Two-factor needs a live account." };
    try {
      const { multiFactor, TotpMultiFactorGenerator } = await import("firebase/auth");
      const session = await multiFactor(auth.currentUser).getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(session);
      return {
        ok: true,
        secret,
        secretKey: secret.secretKey,
        qrUrl: secret.generateQrCodeUrl(auth.currentUser.email ?? "BCBHS Alumni", "BCBHS Alumni"),
      };
    } catch {
      return { ok: false, error: "Could not start two-factor setup. Please try again." };
    }
  }, []);

  const confirmTotpEnrollment = useCallback(async (secret: TotpSecret, code: string) => {
    if (!isFirebaseConfigured || !auth?.currentUser)
      return { ok: false, error: "Two-factor needs a live account." };
    try {
      const { multiFactor, TotpMultiFactorGenerator } = await import("firebase/auth");
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code.trim());
      await multiFactor(auth.currentUser).enroll(assertion, "Authenticator app");
      void logSecurityEvent("mfa_enrolled", {});
      return { ok: true };
    } catch (e) {
      const c = (e as { code?: string })?.code ?? "";
      if (c === "auth/invalid-verification-code")
        return { ok: false, error: "Wrong code. Check your authenticator app and try again." };
      if (c === "auth/requires-recent-login")
        return { ok: false, error: "Please log out and log in again, then try once more." };
      return { ok: false, error: "Could not enable two-factor. Please try again." };
    }
  }, []);

  const disableTotp = useCallback(async () => {
    if (!isFirebaseConfigured || !auth?.currentUser)
      return { ok: false, error: "Two-factor needs a live account." };
    try {
      const { multiFactor } = await import("firebase/auth");
      const factors = multiFactor(auth.currentUser).enrolledFactors ?? [];
      const totp = factors.find((f) => f.factorId === "totp");
      if (!totp) return { ok: true };
      await multiFactor(auth.currentUser).unenroll(totp.uid);
      void logSecurityEvent("mfa_disabled", {});
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not disable two-factor. Please try again." };
    }
  }, []);

  /* Password recovery (owner's request, 2026-10-23): Firebase emails
     a reset link; following it lets the member set a new password.
     In demo mode any password works, so there is nothing to reset. */
  const resetPassword = useCallback(async (email: string) => {
    const clean = email.trim().toLowerCase();
    void logSecurityEvent("password_reset_requested", { identifier: clean });
    if (!isFirebaseConfigured || !auth) return { ok: true };
    try {
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(auth, clean);
    } catch {
      /* Deliberately swallowed: the response is identical whether or
         not an account exists for this email, so this flow cannot be
         used to enumerate registered addresses. Firebase's own
         per-address and per-IP reset throttling still applies. */
    }
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    void logSecurityEvent("logout", {});
    if (isFirebaseConfigured && auth) {
      const { signOut } = await import("firebase/auth");
      await signOut(auth).catch(() => undefined);
    }
    try {
      window.localStorage.removeItem(DEMO_USER_KEY);
    } catch {
      /* noop */
    }
    setUser(null);
  }, []);

  const register = useCallback(
    async (input: RegisterInput): Promise<{ ok: boolean; error?: string }> => {
      const clean = input.email.trim().toLowerCase();
      if (members.some((m) => m.email.toLowerCase() === clean))
        return { ok: false, error: "This email is already registered." };

      if (!isFirebaseConfigured || !auth || !db) {
        const profile: UserProfile = {
          id: `u-${Date.now()}`,
          name: input.name.trim(),
          batch: input.batch,
          roll: input.roll?.trim(),
          email: clean,
          phone: input.phone.trim(),
          bloodGroup: input.bloodGroup || undefined,
          isDonor: input.isDonor,
          district: input.district,
          country: input.district === "Abroad" ? input.country.trim() || undefined : undefined,
          isAbroad: input.district === "Abroad",
          department: input.department || undefined,
          dob: input.dob || undefined,
          profession: input.profession.trim() || undefined,
          company: input.company.trim() || undefined,
          photoURL: input.photoURL || undefined,
          whatsapp: input.whatsapp.trim() || undefined,
          status: "pending",
          role: "member",
          permissions: [],
          createdAt: new Date().toISOString(),
        };
        setMembers((prev) => [...prev, profile]);
        return { ok: true };
      }

      try {
        const { createUserWithEmailAndPassword } = await import("firebase/auth");
        const { doc, setDoc } = await import("firebase/firestore");
        // NOTE: in live mode the password comes from the registration form.
        const cred = await createUserWithEmailAndPassword(auth, clean, input.password ?? "");
        await setDoc(doc(db, "users", cred.user.uid), {
          name: input.name.trim(),
          batch: input.batch,
          roll: input.roll?.trim() || null,
          email: clean,
          bloodGroup: input.bloodGroup || null,
          isDonor: input.isDonor,
          district: input.district,
          country: input.district === "Abroad" ? input.country.trim() || null : null,
          isAbroad: input.district === "Abroad",
          department: input.department || null,
          dob: input.dob || null,
          profession: input.profession.trim() || null,
          company: input.company.trim() || null,
          photoURL: input.photoURL || null,
          whatsapp: input.whatsapp.trim() || null,
          status: "pending",
          role: "member",
          permissions: [],
          memberId: null,
          createdAt: new Date().toISOString(),
        });
        /* Phone numbers live in the private store, never in the public profile. */
        const phone = input.phone.trim();
        if (phone) {
          await setDoc(doc(db, "users_private", cred.user.uid), { phone });
        }
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Registration failed." };
      }
    },
    [members],
  );

  /* Admin mutations update local state FIRST in both modes, then write
   * to Firestore in live mode. The member list is loaded once per login
   * (no live subscription), so without the optimistic update the
   * dashboard controls, controlled selects, checkboxes, badges, snap
   * back to the old value and look broken until the next page reload. */

  const approveMember = useCallback(
    async (id: string) => {
      const target = members.find((m) => m.id === id);
      const memberId = target?.memberId ?? nextMemberId(target?.batch ?? "0000", members);
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "approved", memberId } : m)),
      );
      setUser((u) => (u && u.id === id ? { ...u, status: "approved", memberId } : u));
      void logSecurityEvent("member_approved", { targetUid: id });
      if (!isFirebaseConfigured || !db) return;
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", id), { status: "approved", memberId }).catch(() => undefined);
      /* Publish the public verification record so the new member's
         card QR verifies for anyone, signed in or not. */
      if (target) {
        const { syncVerifyDoc } = await import("./verify-sync");
        await syncVerifyDoc(db, { ...target, status: "approved", memberId });
      }
    },
    [members],
  );

  const rejectMember = useCallback(async (id: string) => {
    const target = members.find((m) => m.id === id);
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: "rejected" } : m)));
    setUser((u) => (u && u.id === id ? { ...u, status: "rejected" } : u));
      void logSecurityEvent("member_rejected", { targetUid: id });
    if (!isFirebaseConfigured || !db) return;
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "users", id), { status: "rejected" }).catch(() => undefined);
    /* A rejected / revoked member must stop verifying immediately. */
    const { removeVerifyDoc } = await import("./verify-sync");
    await removeVerifyDoc(db, target?.memberId);
  }, [members]);

  /* Staff moderation (owner, 2026-10-30): batch reps and editors ban /
     unban through the server endpoint, which enforces the own-batch
     rule and syncs the verify doc; the super admin keeps the direct
     flow. Returns false when the server refuses the action. */
  const moderateMember = useCallback(
    async (id: string, action: "ban" | "unban"): Promise<boolean> => {
      if (!isFirebaseConfigured) return true; // demo: the caller already flipped local state
      const currentUser = auth?.currentUser;
      if (!currentUser) return false;
      try {
        const token = await currentUser.getIdToken();
        const resp = await fetch("/api/admin/moderate-member", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ targetUid: id, action }),
        });
        return resp.ok;
      } catch {
        return false;
      }
    },
    [],
  );

  /* Ban: an approved member is suspended (owner's feature, 2026-10-23).
     Their profile stops counting as approved everywhere at once:
     listings filter on status, their ID card stops verifying, and
     the app shows them a suspension gate instead of member content. */
  const banMember = useCallback(async (id: string) => {
    const target = members.find((m) => m.id === id);
    const prevStatus = target?.status;
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: "banned" } : m)));
    setUser((u) => (u && u.id === id ? { ...u, status: "banned" } : u));
      void logSecurityEvent("member_banned", { targetUid: id });
    if (!isFirebaseConfigured || !db) return;
    if (user?.role === "super_admin") {
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", id), { status: "banned" }).catch(() => undefined);
      const { removeVerifyDoc } = await import("./verify-sync");
      await removeVerifyDoc(db, target?.memberId);
      return;
    }
    const ok = await moderateMember(id, "ban");
    if (!ok && prevStatus) {
      /* Server refused: revert the optimistic flip. */
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: prevStatus } : m)));
      setUser((u) => (u && u.id === id ? { ...u, status: prevStatus } : u));
    }
  }, [members, user, moderateMember]);

  /* Unban restores full approved status, ID-card verification included. */
  const unbanMember = useCallback(async (id: string) => {
    const target = members.find((m) => m.id === id);
    const prevStatus = target?.status;
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: "approved" } : m)));
    setUser((u) => (u && u.id === id ? { ...u, status: "approved" } : u));
      void logSecurityEvent("member_unbanned", { targetUid: id });
    if (!isFirebaseConfigured || !db) return;
    if (user?.role === "super_admin") {
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", id), { status: "approved" }).catch(() => undefined);
      if (target) {
        const { syncVerifyDoc } = await import("./verify-sync");
        await syncVerifyDoc(db, { ...target, status: "approved" });
      }
      return;
    }
    const ok = await moderateMember(id, "unban");
    if (!ok && prevStatus) {
      /* Server refused: revert the optimistic flip. */
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: prevStatus } : m)));
      setUser((u) => (u && u.id === id ? { ...u, status: prevStatus } : u));
    }
  }, [members, user, moderateMember]);

  /* Delete (owner's feature, 2026-10-29): a BANNED member is removed
     permanently - profile, phone, and login - through the server
     endpoint, so the same email can register again anytime. Unlike
     ban/unban, the local list changes ONLY after the server confirms:
     a half-delete (docs gone, login alive) would trap the person
     between "cannot sign in" and "cannot re-register". */
  const deleteMember = useCallback(async (id: string): Promise<{ ok: boolean; error?: string }> => {
    if (!isFirebaseConfigured || !db) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      return { ok: true };
    }
    const currentUser = auth?.currentUser;
    if (!currentUser) return { ok: false, error: "Session expired. Please log in again." };
    try {
      const token = await currentUser.getIdToken();
      const resp = await fetch("/api/admin/delete-member", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUid: id }),
      });
      if (!resp.ok) {
        const data = (await resp.json().catch(() => null)) as { error?: string } | null;
        const code = data?.error;
        if (code === "unauthorized") return { ok: false, error: "Session expired. Please log in again." };
        if (code === "forbidden") return { ok: false, error: "You don't have permission to delete this member." };
        if (code === "not_banned") return { ok: false, error: "Only banned members can be deleted." };
        if (code === "member_not_found") return { ok: false, error: "Member not found." };
        if (code === "auth_delete_failed") return { ok: false, error: "Could not remove the login account. Nothing was deleted." };
        if (code === "docs_delete_failed") return { ok: false, error: "Profile removal incomplete. Please try again." };
        return { ok: false, error: "Delete failed. Please try again." };
      }
      setMembers((prev) => prev.filter((m) => m.id !== id));
      return { ok: true };
    } catch {
      return { ok: false, error: "Delete failed. Please try again." };
    }
  }, []);

  const setPermissions = useCallback(async (id: string, permissions: string[]) => {
    /* Granting an EDITOR also flips permissionsCustom, marking that
       the super admin has configured this editor's grants. */
    const target = membersRef.current.find((m) => m.id === id);
    const isEditor = target?.role === "editor";
    const patch = isEditor ? { permissions, permissionsCustom: true } : { permissions };
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    void logSecurityEvent("permissions_changed", { targetUid: id, meta: { count: permissions.length } });
    setUser((u) => (u && u.id === id ? { ...u, ...patch } : u));
    if (!isFirebaseConfigured || !db) return;
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "users", id), patch).catch(() => undefined);
  }, []);

  const setRole = useCallback(async (id: string, role: UserProfile["role"]) => {
    /* A fresh editor starts with NO access at all: clear any old
       list whenever the editor role is (re)given, so the super admin
       grants each section explicitly (owner's rule, 2026-10-23). */
    const patch =
      role === "editor"
        ? { role, permissions: [] as string[], permissionsCustom: false }
        : role === "member"
          ? { role, permissions: [] as string[] }
          : { role };
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    setUser((u) => (u && u.id === id ? { ...u, ...patch } : u));
    void logSecurityEvent("role_changed", { targetUid: id, meta: { role } });
    if (!isFirebaseConfigured || !db) return;
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "users", id), patch).catch(() => undefined);
  }, []);

  const setPosition = useCallback(async (id: string, position: string) => {
    const clean = position.trim() || undefined;
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, position: clean } : m)));
    setUser((u) => (u && u.id === id ? { ...u, position: clean } : u));
      void logSecurityEvent("position_changed", { targetUid: id, meta: { position: clean ?? "" } });
    if (!isFirebaseConfigured || !db) return;
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "users", id), { position: clean ?? null }).catch(() => undefined);
    /* The position is printed on the public verification record too. */
    const target = members.find((m) => m.id === id);
    if (target?.memberId && target.status === "approved") {
      const { syncVerifyDoc } = await import("./verify-sync");
      await syncVerifyDoc(db, { ...target, position: clean });
    }
  }, [members]);

  /* Account settings (owner, 2026-10-24): the member's own phone,
     email and password, edited from the /settings page. Email and
     password changes re-authenticate with the current password
     first; the email change itself is verification-first. */
  const updatePhone = useCallback(
    async (phone: string): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: "Please log in first." };
      const value = phone.trim();
      if (!value) return { ok: false, error: "Enter your WhatsApp number." };
      if (!isFirebaseConfigured || !db) {
        setMembers((prev) => prev.map((m) => (m.id === user.id ? { ...m, phone: value } : m)));
        setUser((u) => (u ? { ...u, phone: value } : u));
        return { ok: true };
      }
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "users_private", user.id), { phone: value });
        setUser((u) => (u ? { ...u, phone: value } : u));
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not save the number. Please try again." };
      }
    },
    [user],
  );

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: "Please log in first." };
      if (newPassword.length < 6)
        return { ok: false, error: "New password must be at least 6 characters." };
      if (!isFirebaseConfigured || !auth) {
        void logSecurityEvent("password_changed", {});
        return { ok: true };
      }
      try {
        const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } =
          await import("firebase/auth");
        const current = auth.currentUser;
        if (!current || !current.email)
          return { ok: false, error: "Session expired. Please log in again." };
        await reauthenticateWithCredential(
          current,
          EmailAuthProvider.credential(current.email, currentPassword),
        );
        await updatePassword(current, newPassword);
        void logSecurityEvent("password_changed", {});
        return { ok: true };
      } catch (e) {
        return { ok: false, error: settingsError(e) };
      }
    },
    [user],
  );

  const changeEmail = useCallback(
    async (
      currentPassword: string,
      newEmail: string,
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: "Please log in first." };
      const clean = newEmail.trim().toLowerCase();
      if (!clean || !clean.includes("@"))
        return { ok: false, error: "Enter a valid email address." };
      if (clean === user.email.toLowerCase())
        return { ok: false, error: "That is already your current email." };
      if (!isFirebaseConfigured || !auth) {
        /* Demo mode has no real mailbox: apply immediately. */
        setMembers((prev) => prev.map((m) => (m.id === user.id ? { ...m, email: clean } : m)));
        setUser((u) => (u ? { ...u, email: clean } : u));
        void logSecurityEvent("email_change_requested", { identifier: clean });
        return { ok: true };
      }
      try {
        const { EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } =
          await import("firebase/auth");
        const current = auth.currentUser;
        if (!current || !current.email)
          return { ok: false, error: "Session expired. Please log in again." };
        await reauthenticateWithCredential(
          current,
          EmailAuthProvider.credential(current.email, currentPassword),
        );
        await verifyBeforeUpdateEmail(current, clean);
        void logSecurityEvent("email_change_requested", { identifier: clean });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: settingsError(e) };
      }
    },
    [user],
  );

  const hasPermission = useCallback(
    (perm: string) => {
      if (!user) return false;
      if (user.status === "banned") return false;
      if (user.role === "super_admin") return true;
      if (user.role === "admin") return user.permissions.includes(perm);
      if (user.role === "editor")
        /* Editors hold ONLY what the super admin granted them: their
           own permissions list, and nothing by default (owner's rule,
           2026-10-23). An editor is the super admin's helping hand
           for exactly the sections switched on for them. */
        return user.permissions.includes(perm);
      return false;
    },
    [user],
  );

  /* A member edits their own profile. Only safe fields may change, never
   * status / role / permissions / memberId / email. */
  const updateProfile = useCallback(
    async (input: ProfileUpdateInput): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: "Please log in first." };
      if (!input.name.trim() || !input.batch || !input.district) {
        return { ok: false, error: "Name, batch and district are required." };
      }
      const isAbroad = input.district === "Abroad";
      const patch: Partial<UserProfile> = {
        name: input.name.trim(),
        batch: input.batch,
        roll: input.roll?.trim() || undefined,
        district: input.district,
        country: isAbroad ? input.country.trim() || undefined : undefined,
        isAbroad,
        department: input.department || undefined,
        dob: input.dob || undefined,
        profession: input.profession.trim() || undefined,
        company: input.company.trim() || undefined,
        institution: input.institution.trim() || undefined,
        eduSession: input.eduSession.trim() || undefined,
        eduDepartment: input.eduDepartment.trim() || undefined,
        eduRunning: input.eduRunning,
        whatsapp: input.whatsapp.trim() || undefined,
        bloodGroup: input.bloodGroup || undefined,
        isDonor: input.isDonor,
        photoURL: input.photoURL || undefined,
      };
      const phone = input.phone.trim();

      if (!isFirebaseConfigured || !db) {
        const full: Partial<UserProfile> = { ...patch, phone: phone || undefined };
        setMembers((prev) => prev.map((m) => (m.id === user.id ? { ...m, ...full } : m)));
        setUser((u) => (u ? ({ ...u, ...full } as UserProfile) : u));
        return { ok: true };
      }
      try {
        const { doc, updateDoc, setDoc } = await import("firebase/firestore");
        const clean: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(patch)) {
          clean[k] = v === undefined ? null : v;
        }
        await updateDoc(doc(db, "users", user.id), clean);
        if (phone) {
          await setDoc(doc(db, "users_private", user.id), { phone });
        }
        /* Keep the public verification record (name / batch / photo)
           in step with the profile. */
        if (user.status === "approved" && user.memberId) {
          const { syncVerifyDoc } = await import("./verify-sync");
          await syncVerifyDoc(db, { ...user, ...patch } as UserProfile);
        }
        setUser((u) => (u ? ({ ...u, ...patch, phone: phone || u.phone } as UserProfile) : u));
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not save your profile. Please try again." };
      }
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      members,
      loading,
      isDemo: !isFirebaseConfigured,
      login,
      completeMfaLogin,
      getTotpEnrolled,
      beginTotpEnrollment,
      confirmTotpEnrollment,
      disableTotp,
      logout,
      resetPassword,
      register,
      approveMember,
      rejectMember,
      banMember,
      unbanMember,
      deleteMember,
      setPermissions,
      setRole,
      setPosition,
      updateProfile,
      updatePhone,
      changeEmail,
      changePassword,
      hasPermission,
      isAdmin: !!user && (user.role === "admin" || user.role === "editor" || user.role === "super_admin"),
      isSuperAdmin: !!user && user.role === "super_admin",
    }),
    [user, members, loading, login, completeMfaLogin, getTotpEnrolled, beginTotpEnrollment, confirmTotpEnrollment, disableTotp, logout, resetPassword, register, approveMember, rejectMember, banMember, unbanMember, deleteMember, setPermissions, setRole, setPosition, updateProfile, updatePhone, changeEmail, changePassword, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
