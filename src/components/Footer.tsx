"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_LINKS, SITE_FACEBOOK, SITE_EMAIL } from "@/lib/site";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 shrink-0" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

/** Footer — school crest, affiliation line, quick links. */
export default function Footer() {
  // Year is computed client-side so static prerendering stays deterministic.
  const [year, setYear] = useState(2026);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time client hydration
  useEffect(() => setYear(new Date().getFullYear()), []);
  return (
    <footer className="border-t border-gold/20 bg-[#070b1c]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Brand + affiliation */}
          <div>
            <div className="flex items-center gap-4">
              <span className="seal-ring relative block h-14 w-14 overflow-hidden rounded-full">
                <Image src="/images/logo.jpg" alt="BCBHS Alumni logo" fill className="object-cover" />
              </span>
              <span className="relative block h-14 w-14 overflow-hidden rounded-full border border-ivory/20">
                <Image
                  src="/images/school-logo.png"
                  alt="Bogura Cantonment Board High School logo"
                  fill
                  className="object-cover"
                />
              </span>
            </div>
            <p className="font-display mt-5 text-xl font-bold text-ivory">
              BCBHS <span className="text-gold-gradient">Alumni</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Affiliated with Bogura Cantonment Board High School — the official
              digital home of its graduates, since 2023.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Explore</p>
            <ul className="mt-5 space-y-3">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-muted transition-colors hover:text-gold-2">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Connect</p>
            <ul className="mt-5 space-y-4">
              <li>
                <a
                  href={SITE_FACEBOOK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-sm text-muted transition-colors hover:text-gold-2"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 text-muted transition-all group-hover:border-gold/60 group-hover:text-gold-2">
                    <FacebookIcon />
                  </span>
                  <span>
                    <span className="block font-semibold text-ivory/90 group-hover:text-gold-2">Facebook Page</span>
                    <span className="block text-xs text-muted/70">Follow official updates</span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE_EMAIL}`}
                  className="group flex items-center gap-3 text-sm text-muted transition-colors hover:text-gold-2"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 text-muted transition-all group-hover:border-gold/60 group-hover:text-gold-2">
                    <MailIcon />
                  </span>
                  <span>
                    <span className="block font-semibold text-ivory/90 group-hover:text-gold-2">Email</span>
                    <span className="block break-all text-xs text-muted/70">{SITE_EMAIL}</span>
                  </span>
                </a>
              </li>
            </ul>
            <div className="gold-rule mt-6 w-40" />
            <p className="mt-4 text-xs text-muted/70">
              Once a BCBHSian, always a BCBHSian.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-8 sm:flex-row">
          <p className="text-xs text-muted/70">
            © {year} BCBHS Alumni Portal. All rights reserved.
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-gold/70">Est. 2023 · Bogura</p>
        </div>
      </div>
    </footer>
  );
}
