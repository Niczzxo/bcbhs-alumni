import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scholarship & Donation Fund",
  description: "The BCBHS Alumni Scholarship & Donation Fund — supporting students of Bogura Cantonment Board High School. See totals and the honour roll.",
  alternates: { canonical: "/fund" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
