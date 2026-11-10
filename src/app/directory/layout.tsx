import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alumni Directory",
  description: "Meet the position holders of BCBHS Alumni — the official directory of Bogura Cantonment Board High School alumni leaders, from President to Executive.",
  alternates: { canonical: "/directory" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
