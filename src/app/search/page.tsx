"use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import MemberCard from "@/components/MemberCard";
import Reveal from "@/components/Reveal";
import { useDirectory } from "@/lib/data";
import { BD_DISTRICTS } from "@/lib/types";

/** Location search, pick a district, see who's there now. */
export default function SearchPage() {
  const members = useDirectory();
  const [district, setDistrict] = useState("");

  const results = useMemo(
    () => (district ? members.filter((m) => (district === "Abroad" ? m.isAbroad : m.district === district)) : []),
    [members, district],
  );

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Nearby alumni"
          title={<>Who&apos;s in <span className="text-gold-gradient">your district?</span></>}
          subtitle="New in town? Search a district to find fellow BCBHSians around you, perfect for meetups."
        />
        <div className="mx-auto w-full px-5 py-12 sm:px-10 lg:px-[3vw]">
          <Reveal className="mx-auto max-w-xl rounded-3xl border border-ivory/10 bg-ink-2 p-6">
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-muted">
              Choose a district
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full rounded-xl border border-ivory/15 bg-ink px-4 py-3 text-sm text-ivory outline-none focus:border-gold/60"
            >
              <option value="">Select…</option>
              {BD_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
              <option value="Abroad">Abroad 🌍</option>
            </select>
          </Reveal>

          {district && (
            <>
              <p className="mt-10 text-center text-sm text-muted">
                <span className="font-display text-3xl font-extrabold text-gold-gradient">{results.length}</span>
                <br />
                {results.length === 1 ? "alumnus" : "alumni"} currently in{" "}
                <span className="font-semibold text-ivory">{district === "Abroad" ? "abroad 🌍" : district}</span>
              </p>
              {results.length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted">No verified members here yet, be the first to register!</p>
              ) : (
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((m, i) => (
                    <MemberCard key={m.id} member={m} delay={Math.min(i % 6, 5) * 0.06} />
                  ))}
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
