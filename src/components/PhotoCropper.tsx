"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  PhotoCropper — profile photo crop, owner's call 2026-10-25.        */
/*                                                                     */
/*  When a member changes their photo they now CHOOSE the area: the    */
/*  image is dragged under a fixed square cutout and zoomed with a     */
/*  slider, and only that square is kept as the photo. The dashed      */
/*  circle inside the square is the avatar-safe area (avatars show     */
/*  the photo as a circle), and the live circle preview shows          */
/*  exactly how the avatar will look.                                  */
/*                                                                     */
/*  Fixed-cutout model (not a movable box): the square never moves,    */
/*  the image moves under it. This keeps the crop math exact and       */
/*  the gesture simple on touch — one finger drags, the slider         */
/*  zooms, and the image is always clamped so the square stays         */
/*  fully covered (no empty gaps can ever enter the crop).             */
/*  Pointer events unify mouse + touch; touch-action: none stops      */
/*  the page from scrolling mid-drag.                                  */
/* ------------------------------------------------------------------ */

type Props = {
  /** Object URL or data URL of the image the member just picked. */
  src: string;
  /** Called with the cropped square JPEG (1024px) — the caller runs it
      through the usual compression pipeline before storing it. */
  onCrop: (file: File) => void;
  onCancel: () => void;
  /** Member picked another file while the cropper was open. */
  onNewFile: (file: File) => void;
};

const OUTPUT_SIZE = 1024;
const MAX_ZOOM = 4; // slider 100 = 4x the cover scale

export default function PhotoCropper({ src, onCrop, onCancel, onNewFile }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const [size, setSize] = useState(0);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(0); // slider 0..100
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Cover scale: the smaller side of the image exactly fills the square.
  const scaleMin = natural && size > 0 ? size / Math.min(natural.w, natural.h) : 1;
  const scale = scaleMin * (1 + (zoom / 100) * (MAX_ZOOM - 1));

  // Fresh-state mirror: the wheel listener is attached once, so it must
  // never read a stale closure for position / scale / image size.
  const liveRef = useRef({ pos, scale, scaleMin, natural, size, zoom });
  liveRef.current = { pos, scale, scaleMin, natural, size, zoom };

  const clampPos = (
    x: number,
    y: number,
    s: number,
    nat: { w: number; h: number } | null,
    sz: number,
  ) => {
    if (!nat || sz <= 0) return { x: 0, y: 0 };
    const dw = nat.w * s;
    const dh = nat.h * s;
    return {
      x: dw <= sz ? (sz - dw) / 2 : Math.min(0, Math.max(sz - dw, x)),
      y: dh <= sz ? (sz - dh) / 2 : Math.min(0, Math.max(sz - dh, y)),
    };
  };

  const clamp = useCallback(
    (x: number, y: number, s: number) => clampPos(x, y, s, natural, size),
    [natural, size],
  );

  // Keep the viewport center fixed when the zoom changes. Reads the
  // live mirror so both the slider and the wheel handler stay exact.
  const zoomTo = useCallback((next: number) => {
    const cur = liveRef.current;
    if (!cur.natural || cur.size <= 0) {
      setZoom(next);
      return;
    }
    const newScale = cur.scaleMin * (1 + (next / 100) * (MAX_ZOOM - 1));
    const c = cur.size / 2;
    setPos(
      clampPos(
        c - (c - cur.pos.x) * (newScale / cur.scale),
        c - (c - cur.pos.y) * (newScale / cur.scale),
        newScale,
        cur.natural,
        cur.size,
      ),
    );
    setZoom(next);
  }, []);

  // Measure the square viewport (it is min(80vw, 320px) by CSS).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setSize(el.getBoundingClientRect().width);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Reset position whenever a new image loads.
  useEffect(() => {
    setNatural(null);
    setZoom(0);
    setPos({ x: 0, y: 0 });
    setError("");
  }, [src]);

  // Center the image once its size and the viewport are known.
  useEffect(() => {
    if (natural && size > 0) {
      const s = size / Math.min(natural.w, natural.h);
      setPos(clamp((size - natural.w * s) / 2, (size - natural.h * s) / 2, s));
    }
  }, [natural, size, clamp]);

  // Wheel zoom (desktop): non-passive so the page behind does not scroll.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cur = liveRef.current;
      zoomTo(Math.min(100, Math.max(0, cur.zoom - Math.sign(e.deltaY) * 10)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomTo]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    setPos((p) => clamp(p.x + dx, p.y + dy, scale));
  };
  const endDrag = (e: React.PointerEvent) => {
    if (dragRef.current?.id === e.pointerId) dragRef.current = null;
  };

  async function usePhoto() {
    if (!natural || size <= 0) return;
    setBusy(true);
    setError("");
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not read that image."));
        img.src = src;
      });
      // Source rect: the square cutout mapped back onto the original.
      const sx = -pos.x / scale;
      const sy = -pos.y / scale;
      const s = size / scale;
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      // JPEG has no alpha — same light backdrop as the photo pipeline.
      ctx.fillStyle = "#f5efe0";
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      ctx.drawImage(img, sx, sy, s, s, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("Could not crop that image.");
      onCrop(new File([blob], "profile-photo.jpg", { type: "image/jpeg" }));
    } catch {
      setError("Could not crop that image. Try another photo.");
    }
    setBusy(false);
  }

  function pickAnother(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    onNewFile(file);
  }

  const previewK = size > 0 ? 64 / size : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Crop your photo"
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-ivory/10 bg-ink-2 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-lg font-bold text-ivory">Crop your photo</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Drag the photo to position it, use the slider to zoom. Only the square area will be kept as your photo.
        </p>

        {/* Square cutout: the image moves under it. */}
        <div
          ref={viewportRef}
          className="relative mx-auto mt-4 touch-none overflow-hidden rounded-2xl bg-black select-none"
          style={{ width: "min(80vw, 320px)", height: "min(80vw, 320px)", cursor: "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {size > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const im = e.currentTarget;
                setNatural({ w: im.naturalWidth, h: im.naturalHeight });
              }}
              className="absolute top-0 left-0 max-w-none"
              style={{
                width: natural ? natural.w * scale : undefined,
                height: natural ? natural.h * scale : undefined,
                transform: `translate(${pos.x}px, ${pos.y}px)`,
              }}
            />
          )}
          {/* Avatar-safe circle: avatars display the photo as a circle. */}
          <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-dashed border-gold/70" />
          {!natural && <p className="absolute inset-0 flex items-center justify-center text-xs text-muted">Loading…</p>}
        </div>

        {/* Live avatar preview: exactly what the circle avatar will show. */}
        {natural && size > 0 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-full ring-1 ring-gold/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                draggable={false}
                className="absolute top-0 left-0 max-w-none"
                style={{
                  width: natural.w * scale * previewK,
                  height: natural.h * scale * previewK,
                  transform: `translate(${pos.x * previewK}px, ${pos.y * previewK}px)`,
                }}
              />
            </div>
            <p className="text-xs text-muted">Avatar preview —<br />this is how it will look.</p>
          </div>
        )}

        <div className="mt-4">
          <label className="text-xs font-bold uppercase tracking-widest text-muted" htmlFor="photo-crop-zoom">
            Zoom
          </label>
          <input
            id="photo-crop-zoom"
            type="range"
            min={0}
            max={100}
            value={zoom}
            onChange={(e) => zoomTo(Number(e.target.value))}
            className="mt-2 w-full accent-[#d4a94e]"
          />
        </div>

        {error && <p className="mt-3 text-xs text-red-300">{error}</p>}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickAnother} />
        <button
          type="button"
          onClick={usePhoto}
          disabled={busy || !natural}
          className="mt-4 w-full rounded-full bg-gold py-3 text-sm font-bold text-ink disabled:opacity-60"
        >
          {busy ? "Processing…" : "Use this photo"}
        </button>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-full border border-ivory/20 py-2.5 text-xs font-bold text-ivory"
          >
            Choose another
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-ivory/20 py-2.5 text-xs font-bold text-ivory"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
