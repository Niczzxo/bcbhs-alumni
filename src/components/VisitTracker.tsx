"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db, isFirebaseConfigured } from "@/lib/firebase";

/**
 * Visitor analytics (owner, 2026-10-24): appends ONE visit doc per
 * (browser session, page) to the `visits` collection, so the staff
 * Overview can show how many people come to the site and who they
 * are. Signed-in members are named; guests are anonymous. Dashboard
 * routes are skipped (staff work is not site traffic), nothing
 * personal beyond the member's own name is stored, and a failed
 * write never affects the page.
 */
const SKIP_PREFIXES = ["/super-admin", "/admin", "/editor", "/api"];

function Tracker() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!isFirebaseConfigured || !db || loading || !pathname) return;
    if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return;
    try {
      let sid = window.sessionStorage.getItem("bcbhs-sid");
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        window.sessionStorage.setItem("bcbhs-sid", sid);
      }
      const key = `bcbhs-visit:${sid}:${pathname}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      return;
    }
    (async () => {
      try {
        const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
        await addDoc(collection(db, "visits"), {
          path: pathname,
          uid: user?.id ?? null,
          name: user?.name ?? null,
          role: user?.role ?? null,
          device: window.matchMedia("(pointer: coarse)").matches ? "mobile" : "desktop",
          ts: serverTimestamp(),
        });
      } catch {
        /* analytics must never break the site */
      }
    })();
  }, [pathname, loading, user]);

  return null;
}

export default function VisitTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
