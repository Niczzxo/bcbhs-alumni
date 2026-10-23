"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useContent } from "@/lib/content-context";
import type { GalleryPhoto } from "@/lib/types";

interface Album {
  name: string;
  photos: GalleryPhoto[];
}

/**
 * Photo gallery organized as ALBUMS (owner's rule, 2026-10-23):
 * photos are grouped by their shared caption (one upload batch = one
 * caption = one album) instead of lying scattered in one flat grid.
 * The gallery opens on album covers; clicking an album shows only
 * its photos, and clicking a photo opens it full-screen.
 */
export default function GalleryPage() {
  const { gallery, loading: allLoading, ready } = useContent();
  const loading = allLoading && !ready.has("gallery");
  const [albumName, setAlbumName] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const albums = useMemo<Album[]>(() => {
    const map = new Map<string, GalleryPhoto[]>();
    for (const p of gallery) {
      const key = (p.caption ?? "").trim() || "BCBHS Moments";
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return [...map.entries()].map(([name, photos]) => ({ name, photos }));
  }, [gallery]);

  const album = albums.find((a) => a.name === albumName) ?? null;

  /* Opening an album starts from the top, with no photo left open. */
  const openAlbum = (name: string | null) => {
    setLightbox(null);
    setAlbumName(name);
    if (name) window.scrollTo({ top: 0 });
  };

  /* Lightbox keyboard controls. */
  useEffect(() => {
    if (lightbox === null || !album) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % album.photos.length));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? null : (i - 1 + album.photos.length) % album.photos.length));
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, album]);

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Moments in gold"
          title={<>Photo <span className="text-gold-gradient">Gallery</span></>}
          subtitle={
            album
              ? `${album.photos.length} photos in this album. Tap any photo to view it full-screen.`
              : "Every event, its own album. Pick an album to step inside."
          }
        />
        <div className="mx-auto w-full px-5 py-12 sm:px-10 lg:px-[3vw]">
          {gallery.length === 0 ? (
            <p className="rounded-3xl border border-ivory/10 bg-ink-2 p-10 text-center text-sm text-muted">
              {loading ? "Loading the gallery…" : "No photos yet, check back soon."}
            </p>
          ) : !album ? (
            /* ------------------------- album covers ------------------------ */
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((a, i) => (
                <Reveal key={a.name} delay={Math.min(i, 5) * 0.06}>
                  <button
                    type="button"
                    onClick={() => openAlbum(a.name)}
                    aria-label={`Open album ${a.name}, ${a.photos.length} photos`}
                    className="group relative block h-64 w-full overflow-hidden rounded-3xl border border-ivory/10 text-left transition-all duration-300 hover:border-gold/40"
                  >
                    <Image
                      src={a.photos[0].src}
                      alt={a.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized={a.photos[0].src.startsWith("data:")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
                    <span className="absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold-2 backdrop-blur">
                      {a.photos.length} photo{a.photos.length === 1 ? "" : "s"}
                    </span>
                    <span className="absolute inset-x-0 bottom-0 p-5">
                      <span className="font-display block text-lg font-bold leading-snug text-ivory">
                        {a.name}
                      </span>
                      <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.2em] text-gold-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        Open album →
                      </span>
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>
          ) : (
            /* ------------------------- inside an album ------------------------ */
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-ivory">{album.name}</h2>
                  <div className="gold-rule mt-3 w-28" />
                </div>
                <button
                  type="button"
                  onClick={() => openAlbum(null)}
                  className="rounded-full border border-gold/40 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-gold-2 transition-colors hover:bg-gold/10"
                >
                  ← All albums
                </button>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {album.photos.map((t, i) => (
                  <Reveal key={t.id} delay={Math.min(i, 5) * 0.06}>
                    <button
                      type="button"
                      onClick={() => setLightbox(i)}
                      aria-label={`View photo ${i + 1} of ${album.name} full-screen`}
                      className="group relative block h-64 w-full overflow-hidden rounded-3xl border border-ivory/10 text-left transition-all duration-300 hover:border-gold/40"
                    >
                      <Image
                        src={t.src}
                        alt={t.caption}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        unoptimized={t.src.startsWith("data:")}
                      />
                    </button>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------ lightbox ------------------------------ */}
        {album && lightbox !== null && album.photos[lightbox] && (
          <div className="animate-fade-in fixed inset-0 z-[80] flex flex-col bg-black/92 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${album.name} photo viewer`}>
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <p className="min-w-0 truncate text-sm font-semibold text-ivory">{album.name}</p>
              <p className="shrink-0 text-xs font-bold uppercase tracking-widest text-muted">
                {lightbox + 1} / {album.photos.length}
              </p>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="Close viewer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white transition-colors hover:bg-red-600"
              >
                ×
              </button>
            </div>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden px-3 pb-6 sm:px-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={lightbox}
                src={album.photos[lightbox].src}
                alt={album.photos[lightbox].caption}
                className="animate-pop-in max-h-full max-w-full rounded-xl object-contain"
              />
              {album.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() => setLightbox((lightbox - 1 + album.photos.length) % album.photos.length)}
                    className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-gold hover:text-ink"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() => setLightbox((lightbox + 1) % album.photos.length)}
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-gold hover:text-ink"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
