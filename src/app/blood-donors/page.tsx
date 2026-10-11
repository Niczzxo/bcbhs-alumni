"use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import MemberCard from "@/components/MemberCard";
import Reveal from "@/components/Reveal";
import { useDirectory } from "@/lib/data";
import { BLOOD_GROUPS, BD_DISTRICTS } from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-ivory/15 bg-ink px-4 py-2.5 text-sm text-ivory outline-none transition-colors focus:border-gold/60";

/** Blood donor directory — filter by group + district. */
export default function BloodDonorsPage() {
  const members = useDirectory();
  const [group, setGroup] = useState("");
  const [district, setDistrict] = useState("");

  const donors = useMemo(
    () =>
      members.filter((m) => {
        if (!m.isDonor) return false;
        if (group && m.bloodGroup !== group) return false;
        if (district && (district === "Abroad" ? !m.isAbroad : m.district !== district)) return false;
        return true;
      }),
    [members, group, district],
  );

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Donate blood, save life"
          title={<>Blood <span className="text-gold-gradient">Donor Network</span> 🩸</>}
          subtitle="In an emergency, every minute counts. Find a verified alumni donor near you."
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <Reveal className="rounded-3xl border border-red-400/25 bg-ink-2 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <select className={inputCls} value={group} onChange={(e) => setGroup(e.target.value)}>
                <option value="">All blood groups</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <select className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="">All districts</option>
                {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                <option value="Abroad">Abroad 🌍</option>
              </select>
              <a
                href="#urgent"
                className="btn-shimmer rounded-xl bg-gradient-to-r from-red-700 via-red-500 to-red-700 px-4 py-2.5 text-center text-sm font-bold uppercase tracking-widest text-white"
              >
                Urgent request
              </a>
            </div>
          </Reveal>

          <p className="mt-8 text-sm text-muted">
            <span className="font-semibold text-gold-2">{donors.length}</span> registered donors
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {donors.map((m, i) => (
              <MemberCard key={m.id} member={m} delay={Math.min(i % 6, 5) * 0.06} />
            ))}
          </div>
          {donors.length === 0 && (
            <p className="mt-6 text-center text-sm text-muted">No donors match — try widening the filters.</p>
          )}

          <div id="urgent">
            <Reveal className="mt-14 rounded-3xl border border-gold/30 bg-ink-2 p-8 text-center">
            <h2 className="font-display text-2xl font-bold text-ivory">Need blood urgently?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
              Post an urgent request with the required blood group, hospital and contact number.
              {/* TODO: urgent-request flow → Firestore `requests` + admin notification */}
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.25em] text-gold">Coming at launch — admin notification included</p>
            </Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
