import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, Allura } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  /* Canonical host is www (owner, 2026-11-12): the apex 308-redirects
     to www, so sitemap + canonical + OG + JSON-LD must list the final
     www URLs - apex entries made Google report "Page with redirect"
     and skip those URLs from the index. */
  metadataBase: new URL("https://www.bcbhsalumni.org"),
  title: {
    default: "BCBHS Alumni | Bogura Cantonment Board High School",
    template: "%s | BCBHS Alumni",
  },
  description:
    "The official alumni portal of Bogura Cantonment Board High School, Bogura. Find alumni by batch, get your digital ID card, join events, blood donors, jobs, mentorship and the scholarship fund. Once a BCBHSian, always a BCBHSian.",
  keywords: [
    "BCBHS Alumni",
    "Bogura Cantonment Board High School",
    "BCBHS",
    "Bogura Cantonment Board High School alumni",
    "BCBHSian",
    "বগুড়া ক্যান্টনমেন্ট বোর্ড হাই স্কুল",
    "বিসিবিএইচএস অ্যালামনাই",
    "BCBHS alumni portal",
    "Bogura alumni",
    "Bangladesh school alumni",
  ],
  authors: [{ name: "BCBHS Alumni" }],
  creator: "BCBHS Alumni",
  publisher: "BCBHS Alumni",
  category: "Education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "BCBHS Alumni",
    locale: "en_US",
    url: "https://www.bcbhsalumni.org",
    title: "BCBHS Alumni | Bogura Cantonment Board High School",
    description:
      "The official alumni portal of Bogura Cantonment Board High School, Bogura. Find alumni by batch, get your digital ID card, join events, blood donors, jobs, mentorship and the scholarship fund.",
    images: [
      {
        url: "/images/og.jpg",
        width: 1200,
        height: 630,
        alt: "Bogura Cantonment Board High School campus — BCBHS Alumni",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BCBHS Alumni | Bogura Cantonment Board High School",
    description:
      "The official alumni portal of Bogura Cantonment Board High School, Bogura. Once a BCBHSian, always a BCBHSian.",
    images: ["/images/og.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BCBHS Alumni",
  alternateName: "Bogura Cantonment Board High School Alumni",
  url: "https://www.bcbhsalumni.org",
  logo: "https://www.bcbhsalumni.org/images/logo.jpg",
  description:
    "The official alumni portal of Bogura Cantonment Board High School, Bogura — connecting alumni across batches with a searchable directory, digital ID cards, events, blood donors, jobs, mentorship and a scholarship fund.",
  email: "bcbhs.alumni2023@gmail.com",
  sameAs: [
    "https://www.facebook.com/share/1DYzEdVYQV/",
    "https://instagram.com/bcbhsalumni",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${display.variable} ${body.variable} ${signature.variable} bg-ink text-ivory antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
