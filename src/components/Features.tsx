import Reveal from "./Reveal";

interface Feature {
  title: string;
  blurb: string;
  icon: React.ReactNode;
}

const ICON_CLASS = "h-8 w-8 text-gold";

const FEATURES: Feature[] = [
  {
    title: "Alumni Directory",
    blurb:
      "Search every BCBHSian by name, batch, profession or city, and reconnect in one tap.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={ICON_CLASS}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.8-3.8" strokeLinecap="round" />
        <circle cx="11" cy="11" r="3" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    title: "Digital ID Card",
    blurb:
      "An official, printable alumni ID auto-generated on approval, scan the QR to verify membership instantly.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={ICON_CLASS}>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <circle cx="8.5" cy="11" r="2" />
        <path d="M5.5 16c.6-1.4 1.7-2 3-2s2.4.6 3 2" strokeLinecap="round" />
        <path d="M14 9.5h4M14 12.5h4M14 15.5h2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Blood Donor Network",
    blurb:
      "Opt in as a donor with your blood group, be found in seconds when someone needs help urgently.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={ICON_CLASS}>
        <path
          d="M12 3c3.5 4.4 6.5 7.9 6.5 12a6.5 6.5 0 1 1-13 0C5.5 10.9 8.5 7.4 12 3Z"
          strokeLinejoin="round"
        />
        <path d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Location Search",
    blurb:
      "Search by district to see which alumni live near you, perfect for meetups in a new city.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={ICON_CLASS}>
        <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="2.6" />
      </svg>
    ),
  },
  {
    title: "Events & Reunions",
    blurb:
      "Never miss a get-together, browse upcoming events, RSVP, and relive them in the gallery.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={ICON_CLASS}>
        <rect x="4" y="6" width="16" height="14" rx="2.5" />
        <path d="M4 10.5h16M8.5 3.5v3M15.5 3.5v3" strokeLinecap="round" />
        <circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: "Career Connections",
    blurb:
      "See where seniors work and reach out for guidance, your network is your net worth.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={ICON_CLASS}>
        <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
        <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" strokeLinecap="round" />
      </svg>
    ),
  },
];

/** Six-card feature grid, the portal's signature capabilities. */
export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mb-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
            What the portal gives you
          </p>
          <h2 className="font-display mt-4 text-4xl font-bold text-ivory sm:text-5xl">
            One home for the <span className="text-gold-gradient">whole community</span>
          </h2>
          <div className="gold-rule mx-auto mt-6 w-56" />
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.12}>
              <article className="card-lift group relative h-full overflow-hidden rounded-3xl border border-gold/15 bg-ink-2/80 p-8 transition-all duration-500 hover:border-gold/50 hover:shadow-[0_20px_60px_rgba(212,169,78,0.18)]">
                {/* corner seal glow on hover */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/0 blur-2xl transition-all duration-500 group-hover:bg-gold/20" />
                <div className="seal-ring mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-ink transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                  {f.icon}
                </div>
                <h3 className="font-display text-2xl font-bold text-ivory transition-colors group-hover:text-gold-2">
                  {f.title}
                </h3>
                <p className="mt-3 leading-relaxed text-muted">{f.blurb}</p>
                <span className="mt-6 block h-px w-12 bg-gold/40 transition-all duration-500 group-hover:w-full group-hover:bg-gold/70" />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
