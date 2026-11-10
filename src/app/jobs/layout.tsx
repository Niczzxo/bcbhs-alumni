import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Job and career opportunities shared by BCBHS Alumni — openings from Bogura Cantonment Board High School graduates for fellow alumni.",
  alternates: { canonical: "/jobs" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
