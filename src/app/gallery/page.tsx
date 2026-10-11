"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";

/** Photo gallery — school memories. TODO: Firestore `gallery` + Storage. */
const TILES = [
  { src: "/images/school.jpg", caption: "The campus — home of a thousand memories", span: true },
  { src: null, caption: "Reunion 2024 — grand gathering", span: false },
  { src: null, caption: "Iftar Mahfil — an evening of togetherness", span: false },
  { src: null, caption: "Blood donation drive — 87 bags in a day", span: false },
  { src: null, caption: "Career workshop — seniors guiding juniors", span: false },
  { src: null, caption: "Sports day — glory on the field", span: true },
];

export default function GalleryPage() {
  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Moments in gold"
          title={<>Photo <span className="text-gold-gradient">Gallery</span></>}
          subtitle="Classrooms, playgrounds, reunions — the visual memory of BCBHS."
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TILES.map((t, i) => (
              <Reveal key={i} delay={Math.min(i, 5) * 0.06} className={t.span ? "sm:col-span-2 lg:col-span-1" : ""}>
                <figure className="group relative h-64 overflow-hidden rounded-3xl border border-ivory/10">
                  {t.src ? (
                    <Image src={t.src} alt={t.caption} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-3 via-ink-2 to-ink">
                      <div className="sunburst absolute inset-0 opacity-60" />
                      <span className="seal-ring flex h-20 w-20 items-center justify-center rounded-full">
                        <span className="font-display text-2xl font-bold text-gold-2">✦</span>
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                  <figcaption className="absolute bottom-0 p-5 text-sm font-medium text-ivory">
                    {t.caption}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
          <p className="mt-10 text-center text-xs text-muted/70">
            Gallery uploads open to admins at launch — connected to Firebase Storage.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
