import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memories",
  description: "Memories from Bogura Cantonment Board High School — campus moments and alumni stories shared by BCBHS Alumni.",
  alternates: { canonical: "/memories" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
