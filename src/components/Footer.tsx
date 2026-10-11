import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/site";

/** Footer — school crest, affiliation line, quick links. */
export default function Footer() {
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

          {/* Community promise */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Our promise</p>
            <p className="mt-5 text-sm leading-relaxed text-muted">
              A respectful, verified community. No hate speech, no politics, no
              gossip — just BCBHSians lifting each other up.
            </p>
            <div className="gold-rule mt-6 w-40" />
            <p className="mt-4 text-xs text-muted/70">
              Once a BCBHSian, always a BCBHSian.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-8 sm:flex-row">
          <p className="text-xs text-muted/70">
            © {new Date().getFullYear()} BCBHS Alumni Portal. All rights reserved.
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-gold/70">Est. 2023 · Bogura</p>
        </div>
      </div>
    </footer>
  );
}
