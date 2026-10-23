"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { GalleryPhoto } from "@/lib/types";

/** Card pitch in px (card size + margin), one seamless unit. */
const PITCH_X = 308; // w-72 (288) + mr-5 (20)
const PITCH_Y = 244; // h-56 (224) + mb-5 (20)

export type MarqueeDirection = "left" | "right" | "up" | "down";

interface MemoriesMarqueeProps {
  photos: GalleryPhoto[];
  /** Slide direction. */
  direction?: MarqueeDirection;
  /** Seconds per full loop. */
  duration?: number;
}

const ANIM_CLASS: Record<MarqueeDirection, string> = {
  left: "animate-marquee-left",
  right: "animate-marquee-right",
  up: "animate-marquee-up",
  down: "animate-marquee-down",
};

/** Infinite auto-sliding photo strip, horizontal or vertical, pauses while hovered. */
export default function MemoriesMarquee({
  photos,
  direction = "left",
  duration,
}: MemoriesMarqueeProps) {
  /* Smooth-scroll guard (owner's report, 2026-10-23): an endlessly
     animating photo strip taxes the phone even while it is off
     screen, so pause the animation whenever the strip is out of
     view and resume it when it comes back. */
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => el.classList.toggle("marquee-offscreen", !entry.isIntersecting),
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Never show the same picture twice in one strip: if the source
  // list itself repeats an uploaded photo (identical data URL, e.g.
  // the same file uploaded twice), keep only its first occurrence
  // so a duplicate can never sit beside itself. Path/URL photos are
  // left untouched (shared placeholders are a content choice).
  const seenData = new Set<string>();
  const unique = photos.filter((p) => {
    if (!p.src.startsWith("data:")) return true;
    if (seenData.has(p.src)) return false;
    seenData.add(p.src);
    return true;
  });
  if (unique.length === 0) return null;
  photos = unique;

  const vertical = direction === "up" || direction === "down";
  const pitch = vertical ? PITCH_Y : PITCH_X;
  const minHalf = vertical ? 1100 : 1700;

  // Repeat the set until one half is wide/tall enough, then duplicate for a seamless loop.
  const reps = Math.max(1, Math.ceil(minHalf / (photos.length * pitch)));
  const half: GalleryPhoto[] = [];
  for (let i = 0; i < reps; i++) half.push(...photos);
  const track = [...half, ...half];

  return (
    <div
      ref={rootRef}
      className={`marquee relative overflow-hidden ${
        vertical ? "marquee-mask-y h-[560px]" : "marquee-mask"
      }`}
    >
      <div
        className={`flex w-max ${vertical ? "mx-auto h-max flex-col" : ""} ${ANIM_CLASS[direction]}`}
        style={{ animationDuration: `${duration ?? (vertical ? 40 : 45)}s` }}
      >
        {track.map((photo, i) => (
          <figure
            key={`${photo.id}-${i}`}
            className={`group/card relative h-56 w-72 shrink-0 overflow-hidden rounded-3xl border border-ivory/10 ${
              vertical ? "mb-5" : "mr-5"
            }`}
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
