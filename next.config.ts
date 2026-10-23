import type { NextConfig } from "next";

/* Security headers applied to every response — defence in depth on top
 * of Firestore security rules (clickjacking, MIME sniffing, referrer
 * leakage, and unwanted browser feature access). */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  /* Next 16 only serves allowlisted image qualities; 90 is the hero /
   * campus photo quality (owner wants it high on desktop AND mobile),
   * 75 stays the default for everything else. */
  images: { qualities: [75, 90] },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
