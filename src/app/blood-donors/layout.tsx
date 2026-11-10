import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blood Donors",
  description: "Find BCBHS Alumni blood donors by blood group in Bogura and beyond — and raise an urgent blood request when someone needs help.",
  alternates: { canonical: "/blood-donors" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
