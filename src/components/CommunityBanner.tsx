"use client";

import Reveal from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/Footer";
import { useAuth } from "@/lib/auth-context";
import { SITE_WHATSAPP } from "@/lib/site";

/** WhatsApp community banner, visible only to logged-in members. */
export default function CommunityBanner() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <section className="bg-ink">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-ink-2 via-ink-3 to-ink p-8 sm:p-12">
            <div className="sunburst absolute inset-0 opacity-40" />
            <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-5">
                <span className="seal-ring flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-gold-2">
                  <WhatsAppIcon />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Members only</p>
                  <h2 className="font-display mt-2 text-2xl font-bold text-ivory sm:text-3xl">
                    Join the <span className="text-gold-gradient">WhatsApp community</span>
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                    Daily adda, urgent notices, blood requests, and event updates
                    straight to your phone, with your batchmates.
                  </p>
                </div>
              </div>
              <a
                href={SITE_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-ink transition-transform duration-300 hover:scale-105"
              >
                Join group
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
