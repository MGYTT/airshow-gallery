import type { Metadata } from "next";
import type { ReactNode } from "react";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airshow-gallery.vercel.app"
).replace(/\/$/, "");

const TITLE = "Moja historia – MGYT Spotting | AirShow Gallery";
const DESCRIPTION =
  "Historia MGYT Spotting — od pierwszych pikników lotniczych w Nowym Targu, przez fascynację F-16 i pierwsze zdjęcia, aż po własną galerię fotografii lotniczej.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/timeline`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/timeline`,
    siteName: "MGYT AirShow Gallery",
    locale: "pl_PL",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "MGYT Spotting — moja historia fotografii lotniczej",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function TimelineLayout({ children }: { children: ReactNode }) {
  return children;
}
