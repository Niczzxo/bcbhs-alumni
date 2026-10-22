"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import MemberCard from "@/components/MemberCard";
import Reveal from "@/components/Reveal";
import { useDirectory } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import { BLOOD_GROUPS, BD_DISTRICTS, BATCH_YEARS } from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-ivory/15 bg-ink px-4 py-2.5 text-sm text-ivory outline-none transition-colors focus:border-gold/60";

/** How many picked members a logged-out guest may preview. */
const GUEST_PREVIEW_COUNT = 6;

/**
 * The Alumni Directory lists POSITION HOLDERS only (owner's rule,
 * 2026-10-23): alumni who hold an official position in the association.
 * Plain members are NOT listed here; the full member list lives on
 * /members and is visible to approved members only. Guests see the
 * admin-picked (guestVisible) position holders as a preview.
 */
export default function DirectoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const approvedMembers = useDirectory();
  const isGuest = !user;
  const [guestMembers, setGuestMembers] = useState<UserProfile[] | null>(null);
  const [q, setQ] = useState("");
  const [batch, setBatch] = useState("");
  const [district, setDistrict] = useState("");
  const [profession, setProfession] = useState("");
  const [blood, setBlood] = useState("");

  /* Guests: show only the admin-picked preview members.
     Live mode fetches them from Firestore; demo mode filters the local list. */
  useEffect(() => {
    if (!isGuest || !isFirebaseConfigured || !db) {
      setGuestMembers(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { collection, query, where, limit, getDocs } = await import("firebase/firestore");
        /* Both rule-checked fields must be constrained, Firestore
           denies a query whose results it cannot prove readable. */
        const snap = await getDocs(
          query(
            collection(db, "users"),
            where("guestVisible", "==", true),
            where("status", "==", "approved"),
            limit(GUEST_PREVIEW_COUNT * 2),
          )
        );
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<UserProfile, "id">) }))
          .filter((m) => m.status === "approved" && m.guestVisible)
          .slice(0, GUEST_PREVIEW_COUNT);
        if (!cancelled) setGuestMembers(list);
      } catch {
        if (!cancelled) setGuestMembers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isGuest]);

  const members = useMemo(() => {
    if (!isGuest) return approvedMembers;
    if (isFirebaseConfigured) return guestMembers ?? [];
    return approvedMembers.filter((m) => m.guestVisible).slice(0, GUEST_PREVIEW_COUNT);
  }, [isGuest, approvedMembers, guestMembers]);

  /* Position holders only: an official position assigned by the super
     admin is what puts an alumnus in this directory. */
  const holders = useMemo(
    () => members.filter((m) => !!m.position && m.position.trim() !== ""),
    [members],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return holders.filter((m) => {
      if (needle && !`${m.name} ${m.company ?? ""}`.toLowerCase().includes(needle)) return false;
      if (batch && m.batch !== batch) return false;
      if (district && (district === "Abroad" ? !m.isAbroad : m.district !== district)) return false;
      if (profession && !(m.profession ?? "").toLowerCase().includes(profession.toLowerCase())) return false;
      if (blood && m.bloodGroup !== blood) return false;
      return true;
    });
  }, [holders, q, batch, district, profession, blood]);

  const clear = () => { setQ(""); setBatch(""); setDistrict(""); setProfession(""); setBlood(""); };

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Find your people"
          title={<>Alumni <span className="text-gold-gradient">Directory</span></>}
          subtitle={
            isGuest
              ? "The alumni who hold official positions in the association. Log in as a member to browse every registered alumnus."
              : `${holders.length} alumni hold official positions. Search by name, batch, district, profession or blood group. Every registered member is on the Members page.`
          }
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <input className={`${inputCls} xl:col-span-2`} placeholder="Search name or company…" value={q} onChange={(e) => setQ(e.target.value)} />
              <select className={inputCls} value={batch} onChange={(e) => setBatch(e.target.value)}>
                <option value="">All batches</option>
                {BATCH_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="">All districts</option>
                {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                <option value="Abroad">Abroad 🌍</option>
              </select>
              <input className={inputCls} placeholder="Profession…" value={profession} onChange={(e) => setProfession(e.target.value)} />
              <select className={inputCls} value={blood} onChange={(e) => setBlood(e.target.value)}>
                <option value="">Any blood group</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            {(q || batch || district || profession || blood) && (
              <button onClick={clear} className="mt-4 text-xs font-bold uppercase tracking-widest text-gold-2 hover:underline">
                Clear filters ×
              </button>
            )}
          </Reveal>

          {!isGuest && (
            <p className="mt-8 text-sm text-muted">
              Showing <span className="font-semibold text-gold-2">{filtered.length}</span> of {holders.length} position holders
            </p>
          )}
          {filtered.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-ivory/10 bg-ink-2 p-14 text-center">
              <p className="font-display text-xl font-bold text-ivory">
                {holders.length === 0 ? "No position holders yet" : "No position holders match your filters"}
              </p>
              <p className="mt-2 text-sm text-muted">
                {holders.length === 0
                  ? "Alumni appear here once the super admin assigns them an official position."
                  : "Try widening the search."}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m, i) => <MemberCard key={m.id} member={m} delay={Math.min(i % 6, 5) * 0.06} />)}
            </div>
          )}
          {isGuest && (
            <Reveal className="mt-12 text-center">
              <button
                onClick={() => router.push("/login?next=/members")}
                className="rounded-full border border-gold/40 px-9 py-4 text-sm font-bold uppercase tracking-widest text-gold-2 transition-all duration-300 hover:scale-105 hover:bg-gold/10 hover:shadow-[0_0_30px_rgba(212,169,78,0.25)]"
              >
                Browse all members
              </button>
              <p className="mt-4 text-xs text-muted">
                The full member list is visible to logged-in members only.
              </p>
            </Reveal>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
