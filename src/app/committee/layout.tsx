import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Committee",
  description: "The BCBHS Alumni committee and leadership — President, Vice President, Secretary and Executive members of Bogura Cantonment Board High School alumni.",
  alternates: { canonical: "/committee" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
