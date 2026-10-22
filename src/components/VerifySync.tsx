"use client";

/* ------------------------------------------------------------------ */
/*  Keeps the public `verify` registry in sync with the member        */
/*  database: one doc per approved member (keyed by memberId),        */
/*  removed as soon as a member is no longer approved.                */
/*                                                                     */
/*  Runs on any page while the super admin is signed in (the only     */
/*  role guaranteed to see the full member list) and reconciles      */
/*  whenever the list changes — this both backfills members who       */
/*  were approved before the registry existed and repairs any         */
/*  best-effort write a client flow missed. Same pattern as           */
/*  StatsSync.                                                         */
/* ------------------------------------------------------------------ */

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { verifyRecordOf, type VerifyRecord } from "@/lib/verify-sync";

export default function VerifySync() {
  const { user, members, loading } = useAuth();
  const lastSynced = useRef<string>("");

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    if (loading || !user || user.role !== "super_admin") return;
    /* Never publish demo seed data: demo ids always contain a hyphen
       (u-1, u-<timestamp>); real Firestore/Auth ids never do. */
    if (members.length === 0 || members.some((m) => m.id.includes("-"))) return;

    const desired = new Map<string, VerifyRecord>();
    for (const m of members) {
      const rec = verifyRecordOf(m);
      if (rec) desired.set(rec.memberId, rec);
    }
    const key = JSON.stringify([...desired.entries()].sort());
    if (key === lastSynced.current) return;
    lastSynced.current = key;

    (async () => {
      try {
        const { collection, getDocs, doc, setDoc, deleteDoc } = await import("firebase/firestore");
        if (!db) return;
        const snap = await getDocs(collection(db, "verify"));
        const existing = new Map<string, string>();
        snap.docs.forEach((d) => existing.set(d.id, JSON.stringify(d.data())));
        /* Upsert missing / changed records. */
        for (const [memberId, rec] of desired) {
          if (existing.get(memberId) !== JSON.stringify(rec)) {
            await setDoc(doc(db, "verify", memberId), rec);
          }
        }
        /* Remove records for members no longer approved. */
        for (const memberId of existing.keys()) {
          if (!desired.has(memberId)) {
            await deleteDoc(doc(db, "verify", memberId));
          }
        }
      } catch {
        /* offline / rules — retried on the next change or visit */
        lastSynced.current = "";
      }
    })();
  }, [user, members, loading]);

  return null;
}
