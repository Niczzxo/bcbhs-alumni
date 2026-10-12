"use client";

import Image from "next/image";
import type { GalleryPhoto } from "@/lib/types";

/** Card width (w-72) + right margin, in px — one seamless unit. */
const CARD_PITCH = 308;
/** Minimum px width of one loop half so wide screens never show a gap. */
const MIN_HALF = 1700;

interface MemoriesMarqueeProps {
  photos: GalleryPhoto[];
  /** Slide right-to-left (default) or left-to-right. */
  reverse?: boolean;
  /** Seconds per full loop. */
  duration?: number;
}

/** Infinite auto-sliding photo strip — pauses while hovered. */
export default function MemoriesMarquee({
  photos,
  reverse = false,
  duration = 45,
}: MemoriesMarqueeProps) {
  if (photos.length === 0) return null;

  // Repeat the set until one half is wide enough, then duplicate for a seamless loop.
  const reps = Math.max(1, Math.ceil(MIN_HALF / (photos.length * CARD_PITCH)));
  const half: GalleryPhoto[] = [];
  for (let i = 0; i < reps; i++) half.push(...photos);
  const track = [...half, ...half];

  return (
    <div className="marquee marquee-mask relative overflow-hidden">
      <div
        className={`flex w-max ${reverse ? "animate-marquee-right" : "animate-marquee-left"}`}
        style={{ animationDuration: `${duration}s` }}
      >
        {track.map((photo, i) => (
          <figure
            key={`${photo.id}-${i}`}
            className="group/card relative mr-5 h-56 w-72 shrink-0 overflow-hidden rounded-3xl border border-ivory/10"
          >
            <Image
              src={photo.src}
              alt={photo.caption}
              fill
              className="object-cover transition-transform duration-700 group-hover/card:scale-105"
              unoptimized={photo.src.startsWith("data:")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
            <figcaption className="absolute bottom-0 p-4 text-[13px] font-medium text-ivory">
              {photo.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
