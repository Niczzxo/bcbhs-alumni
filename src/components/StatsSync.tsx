"use client";

/* ------------------------------------------------------------------ */
/*  Keeps the public `site/stats` document in sync with the real      */
/*  member database.                                                   */
/*                                                                     */
/*  Guests cannot count the `users` collection (rules only let them   */
/*  read guest-visible profiles), so the homepage counters read this  */
/*  public doc instead. Only the super admin may write it (rules:     */
/*  site/{doc}, public read, super-admin write), so the sync runs    */
/*  on any page while the super admin is signed in and recomputes     */
/*  whenever the member or event list changes (approvals included).   */
/* ------------------------------------------------------------------ */

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useContent } from "@/lib/content-context";
import { isFirebaseConfigured, db } from "@/lib/firebase";

export default function StatsSync() {
  const { user, members, loading } = useAuth();
  const { events } = useContent();
  const lastWritten = useRef<string>("");

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    if (loading || !user || user.role !== "super_admin") return;
    /* Never publish demo seed data: demo ids always contain a hyphen
       (u-1, u-<timestamp>); real Firestore/Auth ids never do. */
    if (members.length === 0 || members.some((m) => m.id.includes("-"))) return;

    const counted = members.filter((m) => m.status !== "rejected" && m.status !== "banned");
    const stats = {
      totalMembers: counted.length,
      membersAbroad: counted.filter((m) => m.isAbroad).length,
      batches: new Set(counted.map((m) => m.batch).filter(Boolean)).size,
      eventsHeld: events.length,
    };
    const key = JSON.stringify(stats);
    if (key === lastWritten.current) return;
    lastWritten.current = key;

    (async () => {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        if (!db) return;
        await setDoc(
          doc(db, "site", "stats"),
          { ...stats, updatedAt: new Date().toISOString() },
          { merge: true },
        );
      } catch {
        /* offline / rules, retried on the next change or visit */
        lastWritten.current = "";
      }
    })();
  }, [user, members, events, loading]);

  return null;
}
