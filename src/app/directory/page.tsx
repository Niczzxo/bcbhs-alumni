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

/** Searchable / filterable alumni directory. Guests see an admin-picked preview. */
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

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return members.filter((m) => {
      if (needle && !`${m.name} ${m.company ?? ""}`.toLowerCase().includes(needle)) return false;
      if (batch && m.batch !== batch) return false;
      if (district && (district === "Abroad" ? !m.isAbroad : m.district !== district)) return false;
      if (profession && !(m.profession ?? "").toLowerCase().includes(profession.toLowerCase())) return false;
      if (blood && m.bloodGroup !== blood) return false;
      return true;
    });
  }, [members, q, batch, district, profession, blood]);

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
              ? "A preview of our community, log in to search every verified member."
              : `${members.length} verified members, search by name, batch, district, profession or blood group.`
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
              Showing <span className="font-semibold text-gold-2">{filtered.length}</span> of {members.length} members
            </p>
          )}
          {filtered.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-ivory/10 bg-ink-2 p-14 text-center">
              <p className="font-display text-xl font-bold text-ivory">No members match your filters</p>
              <p className="mt-2 text-sm text-muted">Try widening the search.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m, i) => <MemberCard key={m.id} member={m} delay={Math.min(i % 6, 5) * 0.06} />)}
            </div>
          )}
          {isGuest && (
            <Reveal className="mt-12 text-center">
              <button
                onClick={() => router.push("/login?next=/directory")}
                className="rounded-full border border-gold/40 px-9 py-4 text-sm font-bold uppercase tracking-widest text-gold-2 transition-all duration-300 hover:scale-105 hover:bg-gold/10 hover:shadow-[0_0_30px_rgba(212,169,78,0.25)]"
              >
                See more directory members
              </button>
              <p className="mt-4 text-xs text-muted">
                Log in to search the full verified directory.
              </p>
            </Reveal>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
