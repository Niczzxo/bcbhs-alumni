import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact BCBHS Alumni — reach the alumni team of Bogura Cantonment Board High School by email, Facebook or Instagram.",
  alternates: { canonical: "/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
