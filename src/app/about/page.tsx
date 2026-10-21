"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useContent } from "@/lib/content-context";
import { SITE_SCHOOL } from "@/lib/site";

/** About the BCBHS Alumni Association — content editable by the super admin. */
export default function AboutPage() {
  const { siteContent: c } = useContent();

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow={c.aboutEyebrow}
          title={<>{c.aboutTitle.split(" ").slice(0, -2).join(" ")} <span className="text-gold-gradient">{c.aboutTitle.split(" ").slice(-2).join(" ")}</span></>}
          subtitle={c.aboutIntro}
        />

        {/* Story */}
        <section className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <Reveal className="relative h-80 overflow-hidden rounded-3xl border border-ivory/10 lg:h-[26rem]">
              <Image src="/images/school.jpg" alt="BCBHS campus" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            </Reveal>
            <div>
              {c.aboutStory.map((p, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <p className="mb-5 text-[15px] leading-relaxed text-ivory/85">{p}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="border-y border-gold/15 bg-ink-2/60">
          <div className="mx-auto max-w-4xl px-5 py-14 text-center sm:px-8">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Our mission</p>
              <p className="font-display mt-5 text-2xl font-bold leading-snug text-ivory sm:text-3xl">
                “{c.aboutMission}”
              </p>
            </Reveal>
          </div>
        </section>

        {/* Values */}
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {c.aboutValues.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <article className="h-full rounded-3xl border border-ivory/10 bg-ink-2 p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold/40">
                  <p className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-2xl text-gold-2">✦</p>
                  <h3 className="font-display mt-5 text-xl font-bold text-ivory">{v.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{v.text}</p>
                </article>
              </Reveal>
            ))}
          </div>

          {/* Affiliation — the whole card links to the school's official site */}
          <Reveal className="mt-14 rounded-3xl border border-ivory/10 bg-ink-2 p-8 transition-colors duration-300 hover:border-gold/40 sm:p-10">
            <a
              href={SITE_SCHOOL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left"
              aria-label="Visit the official website of Bogura Cantonment Board High School"
            >
              <span className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-ivory/10">
                <Image src="/images/school-logo.png" alt="BCBHS school logo" fill className="object-contain bg-white p-1" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Affiliated with</p>
                <h3 className="font-display mt-2 text-2xl font-bold text-ivory transition-colors group-hover:text-gold-2">Bogura Cantonment Board High School</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Our alma mater in Bogura Cantonment — the classrooms and playgrounds where every
                  BCBHSian&apos;s story began. This alumni association is run by former students.
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gold/80 transition-colors group-hover:text-gold">
                  Visit the school website
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                    <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </a>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
