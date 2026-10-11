"use client";

/* ------------------------------------------------------------------ */
/*  Member data access.                                                  */
/*  Live mode: queries Firestore `users`. Demo mode: filters the        */
/*  in-memory member list from the auth context.                         */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { isFirebaseConfigured, db } from "./firebase";
import { PLACEHOLDER_STATS } from "./site";
import type { UserProfile } from "./types";

export interface SiteStats {
  totalMembers: number;
  membersAbroad: number;
  batches: number;
  eventsHeld: number;
  live: boolean;
}

/** Homepage counters — live Firestore aggregates when configured. */
export function useSiteStats(): SiteStats {
  const { members, isDemo } = useAuth();
  const [live, setLive] = useState<SiteStats | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    let cancelled = false;
    (async () => {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const approved = query(collection(db, "users"), where("status", "==", "approved"));
        const abroad = query(
          collection(db, "users"),
          where("status", "==", "approved"),
          where("isAbroad", "==", true),
        );
        const [aSnap, bSnap] = await Promise.all([getDocs(approved), getDocs(abroad)]);
        const batches = new Set(aSnap.docs.map((d) => (d.data() as { batch?: string }).batch).filter(Boolean));
        if (!cancelled) {
          setLive({
            totalMembers: aSnap.size,
            membersAbroad: bSnap.size,
            batches: batches.size,
            eventsHeld: PLACEHOLDER_STATS.eventsHeld,
            live: true,
          });
        }
      } catch {
        /* fall back to placeholders */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (live) return live;
  if (!isDemo) {
    /* Configured but query pending/failed — derive from context members. */
    const approved = members.filter((m) => m.status === "approved");
    return {
      totalMembers: approved.length,
      membersAbroad: approved.filter((m) => m.isAbroad).length,
      batches: new Set(approved.map((m) => m.batch)).size,
      eventsHeld: PLACEHOLDER_STATS.eventsHeld,
      live: false,
    };
  }
  return { ...PLACEHOLDER_STATS, live: false };
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
