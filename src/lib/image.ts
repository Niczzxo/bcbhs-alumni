/* ------------------------------------------------------------------ */
/*  Client-side image compression.                                     */
/*  Profile photos are downscaled to 1024px + JPEG-compressed in the   */
/*  browser so they fit comfortably inside a Firestore document        */
/*  (< 1 MB) without needing Cloud Storage (which requires the Blaze   */
/*  billing plan). A 1024px JPEG stays well under the limit while      */
/*  looking sharp in the fullscreen photo lightbox.                    */
/* ------------------------------------------------------------------ */

/** Compress an image file to a small JPEG data URL suitable for Firestore. */
export function compressImageToDataURL(
  file: File,
  maxDim = 256,
  quality = 0.72,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        // JPEG has no alpha, paint a light backdrop for transparent PNGs.
        ctx.fillStyle = "#f5efe0";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Image processing failed"));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image file."));
    };
    img.src = url;
  });
}
