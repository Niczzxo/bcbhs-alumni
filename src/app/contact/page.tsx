"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/Footer";
import { useAuth } from "@/lib/auth-context";
import { SITE_FACEBOOK, SITE_INSTAGRAM, SITE_WHATSAPP, SITE_EMAIL } from "@/lib/site";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 shrink-0" aria-hidden="true">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6 shrink-0" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6 shrink-0" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

/** Contact the BCBHS Alumni Association, official channels. */
export default function ContactPage() {
  const { user } = useAuth();
  // WhatsApp community link is for verified (approved) members only: hidden from guests and pending accounts.
  const isVerified = user?.status === "approved";
  const channels = [
    {
      icon: <MailIcon />,
      title: "Email us",
      detail: SITE_EMAIL,
      href: `mailto:${SITE_EMAIL}`,
      blurb: "For membership queries, verifications, and official correspondence.",
    },
    {
      icon: <FacebookIcon />,
      title: "Facebook",
      detail: "BCBHS Alumni, official page",
      href: SITE_FACEBOOK,
      blurb: "Announcements, event photos, and community updates.",
    },
    {
      icon: <InstagramIcon />,
      title: "Instagram",
      detail: "@bcbhsalumni",
      href: SITE_INSTAGRAM,
      blurb: "Moments in gold, follow the visual story of the community.",
    },
    // WhatsApp community link is verified-members-only: hidden from logged-out guests and pending accounts.
    ...(isVerified
      ? [
          {
            icon: <WhatsAppIcon />,
            title: "WhatsApp community",
            detail: "Members-only group",
            href: SITE_WHATSAPP,
            blurb: "Daily adda, urgent notices, and blood requests, for verified members.",
          },
        ]
      : []),
  ];

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Get in touch"
          title={<>Contact <span className="text-gold-gradient">the association</span></>}
          subtitle="Questions about membership, events, or verification, reach us on any official channel."
        />
        <div className="mx-auto w-full px-5 py-14 sm:px-10 lg:px-[3vw]">
          <div className={`grid gap-6 sm:grid-cols-2 ${isVerified ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {channels.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.08} className="h-full">
                <a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noreferrer" : undefined}
                  className="group flex h-full flex-col rounded-3xl border border-ivory/10 bg-ink-2 p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-[0_18px_50px_rgba(212,169,78,0.12)]"
                >
                  <span className="seal-ring mb-5 flex h-14 w-14 items-center justify-center rounded-full text-gold-2">
                    {c.icon}
                  </span>
                  <p className="font-display text-xl font-bold text-ivory group-hover:text-gold-2">
                    {c.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gold">{c.detail}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{c.blurb}</p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
