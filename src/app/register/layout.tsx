import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Register as a BCBHS alumnus — join the official alumni portal of Bogura Cantonment Board High School and get your digital ID card.",
  alternates: { canonical: "/register" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
