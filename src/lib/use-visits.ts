"use client";

import { useEffect, useState } from "react";
import { db, isFirebaseConfigured } from "./firebase";

/** One recorded site visit (see VisitTracker + the visits rules). */
export interface Visit {
  id: string;
  path: string;
  uid: string | null;
  name: string | null;
  role: string | null;
  device: "mobile" | "desktop";
  /** Epoch milliseconds. */
  ts: number;
}

/**
 * Live visitor trail for the staff dashboards (newest first).
 * Demo mode (no Firebase configured) synthesizes a plausible week
 * from the demo members so the Overview design can be previewed;
 * the live site always shows the real collection.
 */
export function useVisits(limitCount = 300): { visits: Visit[]; loaded: boolean } {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setVisits(demoVisits());
      setLoaded(true);
      return;
    }
    let unsub: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const { collection, query, orderBy, limit, onSnapshot } = await import("firebase/firestore");
      if (cancelled) return;
      unsub = onSnapshot(
        query(collection(db, "visits"), orderBy("ts", "desc"), limit(limitCount)),
        (snap) => {
          setVisits(
            snap.docs.map((d) => {
              const v = d.data() as Record<string, unknown>;
              return {
                id: d.id,
                path: typeof v.path === "string" ? v.path : "/",
                uid: typeof v.uid === "string" ? v.uid : null,
                name: typeof v.name === "string" ? v.name : null,
                role: typeof v.role === "string" ? v.role : null,
                device: v.device === "mobile" ? "mobile" : "desktop",
                ts:
                  (v.ts as { toMillis?: () => number } | undefined)?.toMillis?.() ?? Date.now(),
              } as Visit;
            }),
          );
          setLoaded(true);
        },
        () => setLoaded(true),
      );
    })();
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [limitCount]);

  return { visits, loaded };
}

/* ------------------------- demo fixture ------------------------- */

const DEMO_PEOPLE: { name: string | null; role: string | null }[] = [
  { name: "MD Omar Faruque", role: "super_admin" },
  { name: "Riyazul Islam", role: "super_admin" },
  { name: "Arifa Sultana", role: "admin" },
  { name: "Tanvir Ahmed", role: "member" },
  { name: "Farhana Rahman", role: "member" },
  { name: null, role: null },
  { name: null, role: null },
  { name: null, role: null },
];
const DEMO_PATHS = ["/", "/", "/", "/events", "/directory", "/memories", "/gallery", "/blood-donors", "/fund", "/stories"];

function demoVisits(): Visit[] {
  const out: Visit[] = [];
  const now = Date.now();
  for (let day = 0; day < 7; day++) {
    const count = [9, 6, 11, 7, 13, 8, 5][day];
    for (let i = 0; i < count; i++) {
      const person = DEMO_PEOPLE[(day * 3 + i) % DEMO_PEOPLE.length];
      out.push({
        id: `demo-${day}-${i}`,
        path: DEMO_PATHS[(day + i * 2) % DEMO_PATHS.length],
        uid: person.name ? `demo-${person.name}` : null,
        name: person.name,
        role: person.role,
        device: (day + i) % 3 === 0 ? "desktop" : "mobile",
        ts: now - day * 86_400_000 - i * 3_600_000 - 900_000,
      });
    }
  }
  return out.sort((a, b) => b.ts - a.ts);
}
