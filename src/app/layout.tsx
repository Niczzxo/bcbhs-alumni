import type { Metadata } from "next";
import { Playfair_Display, Inter, Allura } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const signature = Allura({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: ["400"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BCBHS Alumni — Bogura Cantonment Board High School",
  description:
    "The official alumni portal of Bogura Cantonment Board High School. Connect, celebrate, and grow — once a BCBHSian, always a BCBHSian.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${signature.variable} bg-ink text-ivory antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
