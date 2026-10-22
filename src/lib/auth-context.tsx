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
import { DEMO_USERS } from "./demo-data";
import { EDITOR_PERMISSIONS } from "./types";
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
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<{ ok: boolean; error?: string }>;
  approveMember: (id: string) => Promise<void>;
  rejectMember: (id: string) => Promise<void>;
  setPermissions: (id: string, permissions: string[]) => Promise<void>;
  setRole: (id: string, role: UserProfile["role"]) => Promise<void>;
  /** Assign / clear a member's official position (admin only, manually verified). */
  setPosition: (id: string, position: string) => Promise<void>;
  /** Toggle whether a member shows in the public (logged-out) directory (staff only). */
  setGuestVisible: (id: string, visible: boolean) => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<{ ok: boolean; error?: string }>;
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
 * session in the background. Display-only — Firestore rules still
 * guard every read and write server-side. */
const AUTH_CACHE_KEY = "bcbhs-auth-cache-v1";

/* Layout effects run before the browser paints — used for the cache
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  /* Live mode starts EMPTY — seeding demo members here would flash
     fake people (and fake stats) on the real site before sign-in
     resolves, and a member whose list query was denied would keep
     seeing them. Demo data belongs to demo mode only. */
  const [members, setMembers] = useState<UserProfile[]>(isFirebaseConfigured ? [] : DEMO_USERS);
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
      /* corrupted storage — fall back to seed data */
    }
    setLoading(false);
  }, []);

  /* Persist demo mutations (never on the effect's first run — see above). */
  useEffect(() => {
    if (isFirebaseConfigured) return;
    if (!persistArmed.current) {
      persistArmed.current = true;
      return;
    }
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(members));
    } catch {
      /* storage full / unavailable — demo still works in memory */
    }
  }, [members]);

  /* Live mode: paint the cached profile the moment the app mounts, so a
   * reload shows the signed-in UI immediately instead of waiting on the
   * network. Runs as a layout effect — before the first paint. The
   * subscription below then refreshes (or clears) it. */
  useIsomorphicLayoutEffect(() => {
    if (!isFirebaseConfigured) return;
    const cached = readCachedProfile();
    if (cached) {
      setUser(cached);
      setLoading(false);
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
      else window.localStorage.removeItem(AUTH_CACHE_KEY);
    } catch {
      /* storage unavailable — reloads simply fall back to the network */
    }
  }, [user]);

  /* Live-mode auth subscription. */
  useEffect(() => {
    const liveAuth = auth;
    const liveDb = db;
    if (!isFirebaseConfigured || !liveAuth || !liveDb) return;
    let cancelled = false;
    const load = async () => {
      const { onAuthStateChanged } = await import("firebase/auth");
      const { doc, getDoc, collection, getDocs, query, where } = await import("firebase/firestore");
      return onAuthStateChanged(liveAuth, async (fbUser) => {
        if (cancelled) return;
        try {
          if (fbUser) {
            /* Resolve the visitor's OWN profile first and end the
             * loading state immediately — the member list (needed by
             * the directory and dashboards) loads right after, so a
             * page reload never flashes the logged-out UI while the
             * collection is still downloading. */
            const snap = await getDoc(doc(liveDb, "users", fbUser.uid));
            if (cancelled) return;
            const own = snap.exists()
              ? ({ id: snap.id, ...(snap.data() as Omit<UserProfile, "id">) } as UserProfile)
              : null;
            if (own) setUser(own);
            setLoading(false);
            /* Role-aware list fetch. Firestore denies a query whose
             * results it cannot prove readable: the full collection is
             * only readable by admins, while regular members may read
             * approved profiles — so they get a status-constrained
             * query (plus their own doc, whatever its status). The old
             * unconstrained fetch silently failed for every non-admin
             * and left the demo seed list on screen. */
            const isStaff = own?.role === "admin" || own?.role === "super_admin";
            const snapList = isStaff
              ? await getDocs(collection(liveDb, "users"))
              : await getDocs(
                  query(collection(liveDb, "users"), where("status", "==", "approved")),
                );
            if (!cancelled) {
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
          /* Firestore unreachable — stay logged out of member data */
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
    async (email: string, _password: string): Promise<{ ok: boolean; error?: string }> => {
      const clean = email.trim().toLowerCase();
      if (!isFirebaseConfigured || !auth || !db) {
        /* Demo mode: match by email; any password is accepted. */
        const found = members.find((m) => m.email.toLowerCase() === clean);
        if (!found) return { ok: false, error: "No account found for this email in demo mode." };
        if (found.status === "rejected")
          return { ok: false, error: "This registration was rejected. Please contact the admin." };
        setUser(found);
        try {
          window.localStorage.setItem(DEMO_USER_KEY, found.id);
        } catch {
          /* session persistence unavailable — in-memory only */
        }
        return { ok: true };
      }
      try {
        const { signInWithEmailAndPassword } = await import("firebase/auth");
        const { doc, getDoc } = await import("firebase/firestore");
        const cred = await signInWithEmailAndPassword(auth, clean, _password);
        const snap = await getDoc(doc(db, "users", cred.user.uid));
        if (!snap.exists()) return { ok: false, error: "Profile not found." };
        const profile = { id: snap.id, ...(snap.data() as Omit<UserProfile, "id">) };
        if (profile.status === "rejected")
          return { ok: false, error: "This registration was rejected. Please contact the admin." };
        setUser(profile);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Login failed." };
      }
    },
    [members],
  );

  const logout = useCallback(async () => {
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
        /* Phone numbers live in the private store — never in the public profile. */
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
   * dashboard controls — controlled selects, checkboxes, badges — snap
   * back to the old value and look broken until the next page reload. */

  const approveMember = useCallback(
    async (id: string) => {
      const target = members.find((m) => m.id === id);
      const memberId = target?.memberId ?? nextMemberId(target?.batch ?? "0000", members);
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "approved", memberId } : m)),
      );
      setUser((u) => (u && u.id === id ? { ...u, status: "approved", memberId } : u));
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
    if (!isFirebaseConfigured || !db) return;
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "users", id), { status: "rejected" }).catch(() => undefined);
    /* A rejected / revoked member must stop verifying immediately. */
    const { removeVerifyDoc } = await import("./verify-sync");
    await removeVerifyDoc(db, target?.memberId);
  }, [members]);

  const setPermissions = useCallback(async (id: string, permissions: string[]) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, permissions } : m)));
    setUser((u) => (u && u.id === id ? { ...u, permissions } : u));
    if (!isFirebaseConfigured || !db) return;
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "users", id), { permissions }).catch(() => undefined);
  }, []);

  const setRole = useCallback(async (id: string, role: UserProfile["role"]) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role, permissions: role === "member" ? [] : m.permissions } : m)),
    );
    setUser((u) => (u && u.id === id ? { ...u, role } : u));
    if (!isFirebaseConfigured || !db) return;
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "users", id), { role }).catch(() => undefined);
  }, []);

  const setPosition = useCallback(async (id: string, position: string) => {
    const clean = position.trim() || undefined;
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, position: clean } : m)));
    setUser((u) => (u && u.id === id ? { ...u, position: clean } : u));
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

  const setGuestVisible = useCallback(async (id: string, visible: boolean) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, guestVisible: visible } : m)));
    setUser((u) => (u && u.id === id ? { ...u, guestVisible: visible } : u));
    if (!isFirebaseConfigured || !db) return;
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "users", id), { guestVisible: visible }).catch(() => undefined);
  }, []);

  const hasPermission = useCallback(
    (perm: string) => {
      if (!user) return false;
      if (user.role === "super_admin") return true;
      if (user.role === "admin") return user.permissions.includes(perm);
      if (user.role === "editor")
        return (EDITOR_PERMISSIONS as readonly string[]).includes(perm);
      return false;
    },
    [user],
  );

  /* A member edits their own profile. Only safe fields may change — never
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
      logout,
      register,
      approveMember,
      rejectMember,
      setPermissions,
      setRole,
      setPosition,
      setGuestVisible,
      updateProfile,
      hasPermission,
      isAdmin: !!user && (user.role === "admin" || user.role === "editor" || user.role === "super_admin"),
      isSuperAdmin: !!user && user.role === "super_admin",
    }),
    [user, members, loading, login, logout, register, approveMember, rejectMember, setPermissions, setRole, setPosition, setGuestVisible, updateProfile, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
