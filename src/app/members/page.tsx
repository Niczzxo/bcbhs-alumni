"use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import MemberCard from "@/components/MemberCard";
import Reveal from "@/components/Reveal";
import { useDirectory } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/components/AuthModal";
import { BLOOD_GROUPS, BD_DISTRICTS, BATCH_YEARS } from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-ivory/15 bg-ink px-4 py-2.5 text-sm text-ivory outline-none transition-colors focus:border-gold/60";

/**
 * The full member list: EVERY approved alumnus on the portal.
 * Members-only by the owner's rule (2026-10-23): guests and pending
 * accounts never see it, so member data cannot leak to outsiders.
 * The public /directory instead shows position holders only.
 */
export default function MembersPage() {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
  const { openAuthModal } = useAuthModal();
  const approvedMembers = useDirectory();
  const canBrowse = !!user && (user.status === "approved" || isAdmin || isSuperAdmin);
  const [q, setQ] = useState("");
  const [batch, setBatch] = useState("");
  const [district, setDistrict] = useState("");
  const [profession, setProfession] = useState("");
  const [blood, setBlood] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return approvedMembers.filter((m) => {
      if (needle && !`${m.name} ${m.company ?? ""}`.toLowerCase().includes(needle)) return false;
      if (batch && m.batch !== batch) return false;
      if (district && (district === "Abroad" ? !m.isAbroad : m.district !== district)) return false;
      if (profession && !(m.profession ?? "").toLowerCase().includes(profession.toLowerCase())) return false;
      if (blood && m.bloodGroup !== blood) return false;
      return true;
    });
  }, [approvedMembers, q, batch, district, profession, blood]);

  const clear = () => { setQ(""); setBatch(""); setDistrict(""); setProfession(""); setBlood(""); };

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Our community"
          title={<>All <span className="text-gold-gradient">Members</span></>}
          subtitle="Every verified alumnus registered on the portal, searchable by name, batch, district, profession or blood group."
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          {loading ? (
            <p className="text-center text-muted">Loading…</p>
          ) : !canBrowse ? (
            <Reveal className="mx-auto max-w-xl rounded-3xl border border-ivory/10 bg-ink-2 p-10 text-center">
              <p className="font-display text-2xl font-bold text-ivory">Members only</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {user
                  ? "Your registration is still awaiting approval. The member list opens as soon as an admin approves your account."
                  : "The full member list is visible only to logged-in, approved members, so our alumni's data stays inside the community."}
              </p>
              {!user && (
                <button
                  onClick={() => openAuthModal("login")}
                  className="btn-shimmer mt-6 inline-block rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-8 py-3 text-sm font-bold uppercase tracking-widest text-ink"
                >
                  Log In
                </button>
              )}
            </Reveal>
          ) : (
            <>
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

              <p className="mt-8 text-sm text-muted">
                Showing <span className="font-semibold text-gold-2">{filtered.length}</span> of {approvedMembers.length} members
              </p>
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
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
