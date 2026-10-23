"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_LINKS, SITE_FACEBOOK, SITE_INSTAGRAM, SITE_WHATSAPP, SITE_EMAIL } from "@/lib/site";
import { useAuth } from "@/lib/auth-context";

export const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 shrink-0" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 shrink-0" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

/** Footer, school crest, affiliation line, quick links. */
export default function Footer() {
  // Year is computed client-side so static prerendering stays deterministic.
  const [year, setYear] = useState(2026);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time client hydration
  useEffect(() => setYear(new Date().getFullYear()), []);
  const { user } = useAuth();
  return (
    <footer className="border-t border-gold/20 bg-[#070b1c]">
      <div className="mx-auto w-full px-5 py-10 sm:px-10 sm:py-12 lg:px-[3vw]">
        {/* Column shares sized to their content (owner's fix,
            2026-10-23): Explore is widest so its links spread out, and
            no column leaves a dead gap on the right any more. */}
        <div className="grid gap-9 md:grid-cols-[1.1fr_1.5fr_1.1fr] md:gap-12 xl:gap-16">
          {/* Brand + affiliation: centered on phones (owner's rule,
              2026-10-23), left-aligned from md up. */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center gap-4 md:justify-start">
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
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted md:mx-0">
              Affiliated with Bogura Cantonment Board High School, the official
              digital home of its graduates, since 2023.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Explore</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 xl:grid-cols-3">
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
            <ul className="mt-4 space-y-3">
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
                  href={SITE_INSTAGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-sm text-muted transition-colors hover:text-gold-2"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 text-muted transition-all group-hover:border-gold/60 group-hover:text-gold-2">
                    <InstagramIcon />
                  </span>
                  <span>
                    <span className="block font-semibold text-ivory/90 group-hover:text-gold-2">Instagram</span>
                    <span className="block text-xs text-muted/70">@bcbhsalumni</span>
                  </span>
                </a>
              </li>
              {/* WhatsApp group, approved members only */}
              {user?.status === "approved" && (
                <li>
                  <a
                    href={SITE_WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 text-sm text-muted transition-colors hover:text-gold-2"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 text-muted transition-all group-hover:border-gold/60 group-hover:text-gold-2">
                      <WhatsAppIcon />
                    </span>
                    <span>
                      <span className="block font-semibold text-ivory/90 group-hover:text-gold-2">WhatsApp Group</span>
                      <span className="block text-xs text-muted/70">Members only · tap to join</span>
                    </span>
                  </a>
                </li>
              )}
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
            <div className="gold-rule mt-6 w-full" />
            <p className="mt-4 text-xs text-muted/70">
              Once a BCBHSian, always a BCBHSian.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-6 text-center sm:mt-14 sm:flex-row sm:pt-8 sm:text-left">
          <p className="text-xs text-muted/70">
            © {year} BCBHS Alumni Portal. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="whitespace-nowrap text-xs text-muted/70 transition-colors hover:text-gold-2">
              Privacy Policy
            </Link>
            <Link href="/terms" className="whitespace-nowrap text-xs text-muted/70 transition-colors hover:text-gold-2">
              Terms of Service
            </Link>
            <p className="whitespace-nowrap text-xs uppercase tracking-[0.3em] text-gold/70">Est. 2023 · Bogura</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
