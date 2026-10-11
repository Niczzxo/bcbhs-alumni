"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Reveal from "./Reveal";

/** Join CTA band — ID-card teaser with a QR motif. */
export default function IdCardCta() {
  return (
    <section id="join" className="relative overflow-hidden py-24 sm:py-32">
      {/* giant watermark emblem */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none">
        <span className="font-display text-[26vw] font-extrabold leading-none text-ivory/[0.025]">
          2023
        </span>
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
            Membership
          </p>
          <h2 className="font-display mt-4 text-4xl font-bold leading-tight text-ivory sm:text-5xl">
            Get your official
            <br />
            <span className="text-gold-gradient">Alumni ID Card</span>
          </h2>
          <p className="mt-5 max-w-lg leading-relaxed text-muted">
            Register with your batch and roll, get verified by our admins, and
            your official digital ID card is generated automatically — complete
            with a QR code anyone can scan to confirm you are a true BCBHSian.
            Print it, carry it, show it with pride.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="#top"
              className="btn-shimmer rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-9 py-4 text-sm font-bold uppercase tracking-widest text-ink shadow-[0_0_36px_rgba(212,169,78,0.45)] transition-transform duration-300 hover:scale-105"
            >
              Register Now
            </Link>
          </div>
          <ul className="mt-8 space-y-3 text-sm text-muted">
            {[
              "Free registration for all BCBHS graduates",
              "Admin-verified — no fake members, ever",
              "QR verification works even when printed",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gold/60 text-[10px] text-gold">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* ID card mock */}
        <Reveal delay={0.15} className="flex justify-center">
          <motion.div
            whileHover={{ rotateY: 8, rotateX: -6, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ transformPerspective: 900 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-ink-3 via-ink-2 to-ink p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_50px_rgba(212,169,78,0.12)]"
          >
            <div className="sunburst pointer-events-none absolute inset-0" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold">BCBHS Alumni</p>
                <p className="font-display mt-1 text-2xl font-bold text-ivory">Official ID Card</p>
              </div>
              <div className="seal-ring flex h-14 w-14 items-center justify-center rounded-full bg-ink">
                <span className="font-display text-lg font-bold text-gold">B</span>
              </div>
            </div>
            <div className="relative mt-8 flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gold/30 bg-ink-3 text-3xl">
                🎓
              </div>
              <div>
                <p className="font-display text-xl font-bold text-ivory">Your Name</p>
                <p className="text-sm text-muted">Batch of 20XX · Member #0000</p>
                <p className="mt-1 inline-block rounded-full border border-gold/40 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-gold-2">
                  Verified
                </p>
              </div>
            </div>
            <div className="relative mt-8 flex items-center justify-between border-t border-gold/20 pt-6">
              {/* decorative QR motif */}
              <div className="grid h-20 w-20 grid-cols-5 gap-1" aria-hidden>
                {Array.from({ length: 25 }).map((_, i) => (
                  <span
                    key={i}
                    className={`rounded-[2px] ${[0, 4, 6, 8, 12, 16, 18, 20, 24].includes(i) ? "bg-gold" : "bg-ivory/25"}`}
                  />
                ))}
              </div>
              <p className="max-w-[200px] text-right text-xs leading-relaxed text-muted">
                Scan to verify
                <br />
                alumni membership
              </p>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
