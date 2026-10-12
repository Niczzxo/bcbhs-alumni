"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useContent } from "@/lib/content-context";
import { useAuth } from "@/lib/auth-context";

/** Guests preview the first few memories — log in to unlock the full wall. */
const PREVIEW_COUNT = 6;

/** Memories & Souvenirs — the full memory wall. */
export default function MemoriesPage() {
  const { gallery } = useContent();
  const { user } = useAuth();
  const router = useRouter();
  const isGuest = !user;
  const photos = isGuest ? gallery.slice(0, PREVIEW_COUNT) : gallery;

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Moments in gold"
          title={<>Memories <span className="text-gold-gradient">&amp; Souvenirs</span></>}
          subtitle={
            isGuest
              ? "A glimpse of the BCBHS story — log in to unlock the full memory wall."
              : "Classrooms, playgrounds, reunions — the visual memory of BCBHS, kept alive by the community."
          }
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          {photos.length === 0 ? (
            <p className="rounded-3xl border border-ivory/10 bg-ink-2 p-10 text-center text-sm text-muted">
              No memories yet — check back soon.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo, i) => (
                <Reveal key={photo.id} delay={Math.min(i, 5) * 0.06}>
                  <figure className="group relative h-64 overflow-hidden rounded-3xl border border-ivory/10">
                    <Image
                      src={photo.src}
                      alt={photo.caption}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized={photo.src.startsWith("data:")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                    <figcaption className="absolute bottom-0 p-5 text-sm font-medium text-ivory">
                      {photo.caption}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          )}

          {isGuest && gallery.length > PREVIEW_COUNT && (
            <Reveal className="mt-12 text-center">
              <button
                onClick={() => router.push("/login?next=/memories")}
                className="rounded-full border border-gold/40 px-9 py-4 text-sm font-bold uppercase tracking-widest text-gold-2 transition-all duration-300 hover:scale-105 hover:bg-gold/10 hover:shadow-[0_0_30px_rgba(212,169,78,0.25)]"
              >
                See more memories
              </button>
              <p className="mt-4 text-xs text-muted">
                Log in to unlock the full memory wall.
              </p>
            </Reveal>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
