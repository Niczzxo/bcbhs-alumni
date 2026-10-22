"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import MemoriesMarquee from "@/components/MemoriesMarquee";
import { useContent } from "@/lib/content-context";
import { useAuth } from "@/lib/auth-context";

/** Guests preview the first few memories, log in to unlock the full wall. */
const PREVIEW_COUNT = 6;

/** Memories & Souvenirs, the full memory wall. */
export default function MemoriesPage() {
  const { gallery } = useContent();
  const { user } = useAuth();
  const router = useRouter();
  const isGuest = !user;
  const photos = isGuest ? gallery.slice(0, PREVIEW_COUNT) : gallery;
  // Deal photos across four marquees: left, right, up, down.
  // (A marquee with no photos renders nothing, so fall back to the full set.)
  const groups: typeof photos[] = [[], [], [], []];
  photos.forEach((p, i) => groups[i % 4].push(p));
  const filled = groups.map((g) => (g.length > 0 ? g : photos));

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Moments in gold"
          title={<>Memories <span className="text-gold-gradient">&amp; Souvenirs</span></>}
          subtitle={
            isGuest
              ? "A glimpse of the BCBHS story, log in to unlock the full memory wall."
              : "Classrooms, playgrounds, reunions, the visual memory of BCBHS, kept alive by the community."
          }
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          {photos.length === 0 ? (
            <p className="rounded-3xl border border-ivory/10 bg-ink-2 p-10 text-center text-sm text-muted">
              No memories yet, check back soon.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="-mx-5 sm:-mx-8">
                <Reveal>
                  <MemoriesMarquee photos={filled[0]} direction="left" duration={50} />
                </Reveal>
              </div>
              <div className="-mx-5 sm:-mx-8">
                <Reveal>
                  <MemoriesMarquee photos={filled[1]} direction="right" duration={60} />
                </Reveal>
              </div>
              <div className="mx-auto grid max-w-3xl gap-5 pt-5 sm:grid-cols-2">
                <Reveal>
                  <MemoriesMarquee photos={filled[2]} direction="up" duration={45} />
                </Reveal>
                <Reveal>
                  <MemoriesMarquee photos={filled[3]} direction="down" duration={55} />
                </Reveal>
              </div>
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
