"use client";

import { useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useDirectory } from "@/lib/data";
import { useContent } from "@/lib/content-context";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/components/AuthModal";

/** Batch Groups, every batch at a glance, with its WhatsApp group link. */
export default function BatchesPage() {
  const members = useDirectory();
  const { batchLinks } = useContent();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const batches = useMemo(() => {
    const map = new Map<string, { total: number; donors: number; abroad: number }>();
    for (const m of members) {
      const cur = map.get(m.batch) ?? { total: 0, donors: 0, abroad: 0 };
      cur.total += 1;
      if (m.isDonor) cur.donors += 1;
      if (m.isAbroad) cur.abroad += 1;
      map.set(m.batch, cur);
    }
    return [...map.entries()]
      .map(([batch, s]) => ({
        batch,
        ...s,
        link: batchLinks.find((b) => b.id === batch)?.link,
      }))
      .sort((a, b) => b.batch.localeCompare(a.batch));
  }, [members, batchLinks]);

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Every batch, one family"
          title={<>Batch <span className="text-gold-gradient">Groups</span></>}
          subtitle="Find your own batch's corner of the family, member counts, donors, and the batch WhatsApp group."
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          {!user ? (
            <Reveal className="mx-auto max-w-2xl rounded-3xl border border-gold/30 bg-ink-2 p-10 text-center">
              <p className="font-display text-2xl font-bold text-ivory">Members only</p>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                Batch group links are shared inside the alumni family. Log in to find your batch.
              </p>
              <button
                onClick={() => openAuthModal("login")}
                className="btn-shimmer mt-6 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-8 py-3 text-sm font-bold uppercase tracking-widest text-ink"
              >
                Log In
              </button>
            </Reveal>
          ) : batches.length === 0 ? (
            <p className="text-center text-sm text-muted">Batch groups will appear as members join.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {batches.map((b, i) => (
                <Reveal key={b.batch} delay={Math.min(i % 6, 5) * 0.06} className="rounded-3xl border border-ivory/10 bg-ink-2 p-7">
                  <div className="flex items-baseline justify-between">
                    <p className="font-display text-4xl font-extrabold text-ivory">
                      {b.batch}
                    </p>
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold/80">Batch</span>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-ink px-2 py-3">
                      <p className="text-lg font-extrabold text-gold-2">{b.total}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted">Members</p>
                    </div>
                    <div className="rounded-2xl bg-ink px-2 py-3">
                      <p className="text-lg font-extrabold text-gold-2">{b.donors}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted">Donors</p>
                    </div>
                    <div className="rounded-2xl bg-ink px-2 py-3">
                      <p className="text-lg font-extrabold text-gold-2">{b.abroad}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted">Abroad</p>
                    </div>
                  </div>
                  {b.link ? (
                    <a
                      href={b.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 block rounded-full border border-gold/40 px-5 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-gold-2 transition-colors hover:bg-gold/10"
                    >
                      Join Batch WhatsApp Group
                    </a>
                  ) : (
                    <p className="mt-6 rounded-full bg-ivory/5 px-5 py-2.5 text-center text-xs text-muted/70">
                      WhatsApp group link coming soon
                    </p>
                  )}
                  {user.batch === b.batch && (
                    <p className="mt-3 text-center text-xs font-semibold text-emerald-300">This is your batch</p>
                  )}
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
