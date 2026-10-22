"use client";

/* ------------------------------------------------------------------ */
/*  DottedQr, the approved BCBHS card-back QR (web port of the       */
/*  print pipeline in ~/workspace/bcbhs-qr): a genuine level-H QR     */
/*  whose data field is tangent dots coloured from the alumni logo's  */
/*  own palette, every dot deepened so it reads unambiguously dark.  */
/*  The centre carries the ORIGINAL logo, solid and full-colour, as   */
/*  a gold-ringed badge; level-H error correction restores the        */
/*  modules it covers. Finders are solid navy · white · red with a    */
/*  fine dot texture. Decode-verified with ZXing from the live card.  */
/* ------------------------------------------------------------------ */

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

const NAVY: [number, number, number] = [16, 31, 66];
const RED: [number, number, number] = [224, 26, 34];
const GOLD = "#d4a94e";
const BADGE_R = 9.4; // centre badge radius, in modules
const QUIET = 2; // quiet-zone modules inside the plate
const S = 920; // canvas resolution, the card displays it at ~190px

const lum = (r: number, g: number, b: number) =>
  (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/** Deepen a colour to a target luminance, hue preserved. */
function deepen(
  [r, g, b]: [number, number, number],
  target: number,
): [number, number, number] {
  const l = lum(r, g, b);
  if (l <= target || l < 0.02) return [r, g, b];
  const k = target / l;
  return [Math.round(r * k), Math.round(g * k), Math.round(b * k)];
}

const rgb = ([r, g, b]: [number, number, number]) => `rgb(${r},${g},${b})`;

export default function DottedQr({
  url,
  logoSrc = "/images/logo.jpg",
}: {
  url: string;
  logoSrc?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !url) return;
    let alive = true;

    const draw = (logo: HTMLImageElement | null) => {
      if (!alive) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
      const n = qr.modules.size;
      const data = qr.modules.data;
      const dark = (x: number, y: number) => data[y * n + x] === 1;

      /* Logo palette sampler, downscaling to 300×300 IS the area
         averaging; saturation is then boosted ×1.3, exactly like the
         print pipeline. */
      let sample: (u: number, v: number) => [number, number, number] = () => NAVY;
      if (logo) {
        const off = document.createElement("canvas");
        off.width = off.height = 300;
        const octx = off.getContext("2d", { willReadFrequently: true });
        if (octx) {
          octx.drawImage(logo, 0, 0, 300, 300);
          const px = octx.getImageData(0, 0, 300, 300).data;
          for (let i = 0; i < px.length; i += 4) {
            const gray = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
            for (let c = 0; c < 3; c++) {
              px[i + c] = Math.max(0, Math.min(255, gray + (px[i + c] - gray) * 1.3));
            }
          }
          sample = (u: number, v: number) => {
            const x = Math.min(299, Math.max(0, Math.floor(u * 300)));
            const y = Math.min(299, Math.max(0, Math.floor(v * 300)));
            const i = (y * 300 + x) * 4;
            return [px[i], px[i + 1], px[i + 2]];
          };
        }
      }

      /* Plate + geometry, same ratios as the print generator. */
      ctx.clearRect(0, 0, S, S);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, S, S);
      const area = S * 0.9;
      const ox = (S - area) / 2;
      const cell = area / (n + QUIET * 2);
      const mc = (m: number) => ox + (m + QUIET + 0.5) * cell;
      const centre = n / 2;
      const inFinder = (x: number, y: number) =>
        (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
      const inBadge = (x: number, y: number) =>
        Math.hypot(x + 0.5 - centre, y + 0.5 - centre) < BADGE_R;
      const dot = (cx: number, cy: number, r: number, fill: string) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      };

      /* Data field, one tangent dot per dark module, coloured from
         the logo palette mapped across the whole field. */
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          if (!dark(x, y) || inFinder(x, y) || inBadge(x, y)) continue;
          const s = sample((x + 0.5) / n, (y + 0.5) / n);
          dot(mc(x), mc(y), cell * 0.5, rgb(lum(...s) > 0.9 ? NAVY : deepen(s, 0.3)));
        }
      }

      /* Centre badge, the original logo itself, solid and
         full-colour, on a white base with a gold ring. */
      const bcx = mc(centre - 0.5);
      const bcy = mc(centre - 0.5);
      const br = BADGE_R * cell;
      dot(bcx, bcy, br + cell * 0.42, GOLD);
      dot(bcx, bcy, br + cell * 0.16, "#ffffff");
      if (logo) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(bcx, bcy, br, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, bcx - br, bcy - br, br * 2, br * 2);
        ctx.restore();
      } else {
        dot(bcx, bcy, br, rgb(NAVY));
      }

      /* Finders, solid navy · white · red with a fine dot texture. */
      const navyShades = ["rgb(26,44,82)", "rgb(11,23,48)", "rgb(42,51,80)"];
      const redShades = ["rgb(232,58,64)", "rgb(196,15,24)", "rgb(236,74,66)"];
      const finder = (fx: number, fy: number) => {
        const cx = mc(fx);
        const cy = mc(fy);
        dot(cx, cy, cell * 3.5, rgb(NAVY));
        dot(cx, cy, cell * 2.5, "#ffffff");
        dot(cx, cy, cell * 1.5, rgb(RED));
        const tex = cell * 0.16;
        const step = tex * 2.05;
        let row = 0;
        for (let yy = cy - cell * 3.5; yy <= cy + cell * 3.5; yy += step, row++) {
          for (
            let xx = cx - cell * 3.5 + (row % 2 ? step / 2 : 0);
            xx <= cx + cell * 3.5;
            xx += step
          ) {
            const dist = Math.hypot(xx - cx, yy - cy) / cell;
            if (dist > 3.42 && dist <= 3.5) continue;
            const pick = Math.abs(Math.round(xx * 7 + yy * 13)) % 3;
            if (dist > 2.52 && dist <= 3.5) dot(xx, yy, tex, navyShades[pick]);
            else if (dist <= 1.48) dot(xx, yy, tex, redShades[pick]);
          }
        }
      };
      finder(3, 3);
      finder(n - 4, 3);
      finder(3, n - 4);
    };

    const img = new Image();
    img.onload = () => draw(img);
    img.onerror = () => draw(null);
    img.src = logoSrc;
    return () => {
      alive = false;
    };
  }, [url, logoSrc]);

  return (
    <canvas
      ref={ref}
      width={S}
      height={S}
      className="block h-auto w-full"
      role="img"
      aria-label={`Verification QR code for ${url}`}
    />
  );
}
