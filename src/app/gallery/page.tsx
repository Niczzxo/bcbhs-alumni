"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useContent } from "@/lib/content-context";

/** Photo gallery — school memories, managed by staff. */
export default function GalleryPage() {
  const { gallery } = useContent();

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
          {gallery.length === 0 ? (
            <p className="rounded-3xl border border-ivory/10 bg-ink-2 p-10 text-center text-sm text-muted">
              No photos yet — check back soon.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((t, i) => (
                <Reveal key={t.id} delay={Math.min(i, 5) * 0.06}>
                  <figure className="group relative h-64 overflow-hidden rounded-3xl border border-ivory/10">
                    <Image
                      src={t.src}
                      alt={t.caption}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized={t.src.startsWith("data:")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                    <figcaption className="absolute bottom-0 p-5 text-sm font-medium text-ivory">
                      {t.caption}
                    </figcaption>
                  </figure>
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
