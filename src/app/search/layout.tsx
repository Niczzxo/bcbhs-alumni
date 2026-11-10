import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Alumni by District",
  description: "Find BCBHS Alumni by district — search Bogura Cantonment Board High School graduates by where they live across Bangladesh.",
  alternates: { canonical: "/search" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
