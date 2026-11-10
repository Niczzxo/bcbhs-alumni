import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming reunions, gatherings and events of BCBHS Alumni — Bogura Cantonment Board High School alumni community. See what is coming and RSVP.",
  alternates: { canonical: "/events" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
