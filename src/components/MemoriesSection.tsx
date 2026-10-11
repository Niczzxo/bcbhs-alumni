"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Reveal from "./Reveal";
import { useContent } from "@/lib/content-context";
import { useAuth } from "@/lib/auth-context";

/** Homepage teaser — first 6 memories. "See more" needs login, then shows the full gallery. */
export default function MemoriesSection() {
  const { gallery } = useContent();
  const { user } = useAuth();
  const router = useRouter();
  const preview = gallery.slice(0, 6);

  const handleSeeMore = () => {
    if (user) {
      router.push("/gallery");
    } else {
      router.push("/login?next=/gallery");
    }
  };

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mb-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
            Moments in gold
          </p>
          <h2 className="font-display mt-4 text-4xl font-bold text-ivory sm:text-5xl">
            Memories <span className="text-gold-gradient">&amp; Souvenirs</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            Classrooms, playgrounds, reunions — the visual memory of BCBHS,
            kept alive by the community.
          </p>
          <div className="gold-rule mx-auto mt-6 w-56" />
        </Reveal>

        {preview.length === 0 ? (
          <p className="rounded-3xl border border-ivory/10 bg-ink-2 p-10 text-center text-sm text-muted">
            No memories yet — check back soon.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {preview.map((photo, i) => (
              <Reveal key={photo.id} delay={Math.min(i, 5) * 0.08}>
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

        <Reveal className="mt-12 text-center">
          <button
            onClick={handleSeeMore}
            className="rounded-full border border-gold/40 px-9 py-4 text-sm font-bold uppercase tracking-widest text-gold-2 transition-all duration-300 hover:scale-105 hover:bg-gold/10 hover:shadow-[0_0_30px_rgba(212,169,78,0.25)]"
          >
            See more memories
          </button>
          {!user && (
            <p className="mt-4 text-xs text-muted">
              Log in to unlock the full memory wall.
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
