"use client";

import { useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

/** Facebook-style fullscreen photo viewer: click a profile picture to
 *  see it large. Closes on backdrop click, the X button, or Escape.
 *  (owner, 2026-10-31)
 *
 *  The viewer is often rendered through a portal from inside a member
 *  card Link - and React events bubble through the React tree, not
 *  the DOM tree, so a click on the backdrop or the X would reach the
 *  card Link and navigate to the profile. Every click handler here
 *  therefore stops the event before closing (2026-11-11). */
export default function PhotoLightbox({
  photoURL,
  name,
  onClose,
}: {
  photoURL: string;
  name: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  /* Close without letting the click bubble up the React tree to a
   * surrounding card Link (see the note above). */
  const close = (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/92 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${name}'s profile picture`}
      onClick={close}
    >
      <button
        type="button"
        onClick={close}
        aria-label="Close photo viewer"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white transition-colors hover:bg-white/25"
      >
        ×
      </button>
      <div
        className="animate-pop-in max-h-[78vh] overflow-hidden rounded-3xl border border-ivory/15 shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoURL}
          alt={name}
          className="max-h-[78vh] w-auto max-w-[92vw] object-contain"
        />
      </div>
      <p className="font-display mt-5 text-lg font-bold text-ivory">{name}</p>
    </div>
  );
}
