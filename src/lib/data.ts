"use client";

/* ------------------------------------------------------------------ */
/*  Member data access.                                                  */
/*  Live mode: queries Firestore `users`. Demo mode: filters the        */
/*  in-memory member list from the auth context.                         */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { useContent } from "./content-context";
import { isFirebaseConfigured, db } from "./firebase";
import type { UserProfile } from "./types";

export interface SiteStats {
  totalMembers: number;
  membersAbroad: number;
  batches: number;
  eventsHeld: number;
  live: boolean;
}

/**
 * Homepage counters.
 *
 * Live mode: read the public `site/stats` document — Firestore rules
 * stop guests from counting the `users` collection directly (they may
 * only read guest-visible profiles), so the totals are published to
 * this doc instead. StatsSync (mounted in Providers) recomputes it
 * from the real member list whenever the super admin is signed in.
 *
 * Demo mode / before the doc exists: derive from the member list in
 * context. "Registered" counts everyone who signed up and was not
 * rejected (pending + approved).
 */
export function useSiteStats(): SiteStats {
  const { members } = useAuth();
  const { events } = useContent();
  const [remote, setRemote] = useState<SiteStats | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    let cancelled = false;
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const { doc, onSnapshot } = await import("firebase/firestore");
        if (cancelled || !db) return;
        unsub = onSnapshot(
          doc(db, "site", "stats"),
          (snap) => {
            if (!snap.exists()) return;
            const d = snap.data() as Partial<SiteStats>;
            setRemote({
              totalMembers: d.totalMembers ?? 0,
              membersAbroad: d.membersAbroad ?? 0,
              batches: d.batches ?? 0,
              eventsHeld: d.eventsHeld ?? 0,
              live: true,
            });
          },
          () => undefined,
        );
      } catch {
        /* no stats doc yet — the derived fallback below applies */
      }
    })();
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  if (remote) return remote;

  const counted = members.filter((m) => m.status !== "rejected");
  return {
    totalMembers: counted.length,
    membersAbroad: counted.filter((m) => m.isAbroad).length,
    batches: new Set(counted.map((m) => m.batch).filter(Boolean)).size,
    eventsHeld: events.length,
    live: false,
  };
}

/** Approved members only — the public directory. */
export function useDirectory(): UserProfile[] {
  const { members } = useAuth();
  return members.filter((m) => m.status === "approved");
}

/** Find one member by id or memberId. */
export function useMember(lookup: string | undefined): UserProfile | null | undefined {
  const { members } = useAuth();
  const [remote, setRemote] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    if (!lookup || !isFirebaseConfigured || !db) return;
    let cancelled = false;
    (async () => {
      try {
        const { collection, getDocs, query, where, limit } = await import("firebase/firestore");
        const q = query(collection(db, "users"), where("memberId", "==", lookup), limit(1));
        const snap = await getDocs(q);
        if (!cancelled) {
          setRemote(
            snap.empty
              ? null
              : ({ id: snap.docs[0]!.id, ...(snap.docs[0]!.data() as Omit<UserProfile, "id">) } as UserProfile),
          );
        }
      } catch {
        if (!cancelled) setRemote(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lookup]);

  if (!lookup) return null;
  if (remote !== undefined) return remote; // live result (or null)
  if (isFirebaseConfigured) return undefined; // still loading
  return members.find((m) => m.id === lookup || m.memberId === lookup) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Private phone numbers.                                              */
/*  Live mode: read from `users_private/{uid}` — Firestore rules allow  */
/*  only the owner and staff (admin / super_admin) to read.             */
/*  Demo mode: the phone lives on the in-memory profile.                */
/* ------------------------------------------------------------------ */

/** Phone number of a member, or null when the viewer may not see it. */
export function usePrivatePhone(userId: string): string | null {
  const { user, members, isSuperAdmin, hasPermission } = useAuth();
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: string | null = null;
      if (user) {
        const allowed =
          user.id === userId || isSuperAdmin || hasPermission("view_member_data");
        if (allowed) {
          if (!isFirebaseConfigured || !db) {
            next = members.find((m) => m.id === userId)?.phone ?? null;
          } else {
            try {
              const { doc, getDoc } = await import("firebase/firestore");
              const snap = await getDoc(doc(db, "users_private", userId));
              next = snap.exists() ? ((snap.data().phone as string) ?? null) : null;
            } catch {
              next = null;
            }
          }
        }
      }
      if (!cancelled) {
        setPhone(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, user, members, isSuperAdmin, hasPermission]);

  return phone;
}
