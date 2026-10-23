"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useContent } from "@/lib/content-context";

/** Scholarship & Donation Fund, support students and alumni families. */
export default function FundPage() {
  const { fundInfo, fundDonors } = useContent();
  const donors = [...fundDonors].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const stats = [
    { label: "Total Raised", value: `৳${fundInfo.totalRaised}` },
    { label: "Awarded So Far", value: `৳${fundInfo.totalAwarded}` },
    { label: "Students Helped", value: fundInfo.studentsHelped },
    { label: "Kind Supporters", value: String(donors.length) },
  ];

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Give back, lift up"
          title={<>Scholarship &amp; <span className="text-gold-gradient">Donation Fund</span></>}
          subtitle="No BCBHSian should drop out for want of money. The alumni family stands beside its students, quietly, quickly, with dignity."
        />
        <div className="mx-auto w-full px-5 py-12 sm:px-10 lg:px-[3vw]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.06} className="rounded-3xl border border-gold/25 bg-ink-2 p-6 text-center">
                <p className="font-display text-3xl font-extrabold text-gold-2">{s.value}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-muted">{s.label}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-8">
              <h2 className="font-display text-2xl font-bold text-ivory">About the fund</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">{fundInfo.aboutText}</p>
              <div className="gold-rule mt-6 w-28" />
              <h3 className="font-display mt-6 text-lg font-bold text-ivory">How to apply for support</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{fundInfo.applyText}</p>
            </Reveal>

            <Reveal delay={0.1} className="rounded-3xl border border-gold/30 bg-ink-2 p-8">
              <h2 className="font-display text-2xl font-bold text-ivory">Donate</h2>
              {fundInfo.bkash ? (
                <>
                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    Send your contribution via bKash (personal) and mention
                    <span className="text-ivory"> “BCBHS Fund” </span> in the reference:
                  </p>
                  <p className="font-display mt-5 rounded-2xl border border-gold/40 bg-ink px-6 py-4 text-center text-2xl font-extrabold tracking-wider text-gold-2">
                    {fundInfo.bkash}
                  </p>
                  <p className="mt-4 text-xs leading-relaxed text-muted/80">
                    After sending, inform any committee member so your name can be added to the
                    honour roll below. Anonymous donors are respected, tell us if you prefer not
                    to be listed.
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  Donation channels are being set up. Please contact any committee member to
                  contribute, your generosity will be recorded on the honour roll.
                </p>
              )}
            </Reveal>
          </div>

          <Reveal className="mt-10 rounded-3xl border border-ivory/10 bg-ink-2 p-8">
            <h2 className="font-display text-2xl font-bold text-ivory">Honour Roll</h2>
            {donors.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Be the first name on this wall of kindness.</p>
            ) : (
              <ul className="mt-6 divide-y divide-ivory/8">
                {donors.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span className="text-sm font-semibold text-ivory">
                      {d.name}
                      {d.batch && <span className="ml-2 text-xs font-normal text-muted">Batch {d.batch}</span>}
                    </span>
                    <span className="text-sm text-gold-2">
                      {d.amount}
                      {d.note && <span className="ml-2 text-xs text-muted/70">· {d.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
