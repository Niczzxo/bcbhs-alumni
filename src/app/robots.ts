import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep member-only and staff areas out of search results.
      disallow: [
        "/admin",
        "/api/",
        "/editor",
        "/id-card",
        "/login",
        "/member/",
        "/members",
        "/profile",
        "/settings",
        "/super-admin",
      ],
    },
    sitemap: "https://bcbhsalumni.org/sitemap.xml",
  };
}
