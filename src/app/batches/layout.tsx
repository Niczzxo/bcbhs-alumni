import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Batch Groups",
  description: "Join your BCBHS batch group — every batch of Bogura Cantonment Board High School has its own alumni group on the portal.",
  alternates: { canonical: "/batches" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
