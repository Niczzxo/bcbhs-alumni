import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentorship",
  description: "Find a mentor among BCBHS Alumni — senior graduates of Bogura Cantonment Board High School guiding juniors on careers and studies.",
  alternates: { canonical: "/mentorship" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
