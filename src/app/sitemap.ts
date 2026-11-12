import type { MetadataRoute } from "next";

/* Canonical host is www (owner, 2026-11-12): the apex 308-redirects
   to www, so the sitemap must list the final URLs or Google reports
   "Page with redirect" for every entry. */
const BASE = "https://www.bcbhsalumni.org";

// Public, guest-visible pages only. Member-only and staff pages are
// excluded (and disallowed in robots.txt) so search engines never
// index member data.
const PAGES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/directory", changeFrequency: "weekly", priority: 0.9 },
  { path: "/events", changeFrequency: "weekly", priority: 0.9 },
  { path: "/gallery", changeFrequency: "weekly", priority: 0.8 },
  { path: "/memories", changeFrequency: "weekly", priority: 0.8 },
  { path: "/committee", changeFrequency: "monthly", priority: 0.8 },
  { path: "/blood-donors", changeFrequency: "weekly", priority: 0.8 },
  { path: "/fund", changeFrequency: "monthly", priority: 0.7 },
  { path: "/jobs", changeFrequency: "weekly", priority: 0.8 },
  { path: "/mentorship", changeFrequency: "monthly", priority: 0.7 },
  { path: "/batches", changeFrequency: "monthly", priority: 0.7 },
  { path: "/search", changeFrequency: "monthly", priority: 0.6 },
  { path: "/register", changeFrequency: "monthly", priority: 0.9 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
