import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About the BCBHS Alumni portal — the official community of Bogura Cantonment Board High School alumni, connecting graduates across batches since 1976.",
  alternates: { canonical: "/about" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
