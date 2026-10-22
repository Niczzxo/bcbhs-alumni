"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useContent } from "@/lib/content-context";

/** Memory Wall, treasured school-day photos, curated by the super admin. */
export default function MemoryWallPage() {
  const { wallPhotos } = useContent();
  const sorted = [...wallPhotos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Down memory lane"
          title={<>Memory <span className="text-gold-gradient">Wall</span></>}
          subtitle="Old photos, golden days. The classrooms, the field, the friends, the school as we remember it."
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          {sorted.length === 0 ? (
            <p className="text-center text-sm text-muted">The wall is being prepared, old photos will appear here soon.</p>
          ) : (
            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
              {sorted.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i % 6, 5) * 0.05} className="mb-6 break-inside-avoid overflow-hidden rounded-3xl border border-ivory/10 bg-ink-2">
                  <div className="relative w-full">
                    <Image
                      src={p.url}
                      alt={p.caption}
                      width={800}
                      height={600}
                      className="h-auto w-full object-cover"
                      unoptimized={p.url.startsWith("data:")}
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-relaxed text-ivory/90">{p.caption}</p>
                    {p.year && (
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-gold/80">
                        Circa {p.year}
                      </p>
                    )}
                  </div>
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
