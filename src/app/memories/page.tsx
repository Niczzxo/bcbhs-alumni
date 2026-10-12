"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import MemoriesMarquee from "@/components/MemoriesMarquee";
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
  // Split across two counter-sliding rows for a living wall effect.
  const rowA = photos.filter((_, i) => i % 2 === 0);
  const rowB = photos.filter((_, i) => i % 2 === 1);

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
            <div className="-mx-5 space-y-5 sm:-mx-8">
              <Reveal>
                <MemoriesMarquee photos={rowA} duration={50} />
              </Reveal>
              {rowB.length > 0 && (
                <Reveal>
                  <MemoriesMarquee photos={rowB} reverse duration={60} />
                </Reveal>
              )}
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
