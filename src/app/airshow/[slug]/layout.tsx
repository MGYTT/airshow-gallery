import type { Metadata } from "next";
import type { ReactNode } from "react";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airshow-gallery.vercel.app"
).replace(/\/$/, "");

const DEFAULT_KEYWORDS = [
  "pokazy lotnicze",
  "airshow",
  "kalendarz pokazów lotniczych",
  "wydarzenia lotnicze",
  "fotografia lotnicza",
  "spotting",
  "samoloty",
  "MGYT Spotting",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `${SITE_URL}/airshow/${slug}`;

  return {
    keywords: DEFAULT_KEYWORDS,
    category: "event",
    applicationName: "MGYT AirShow Gallery",
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function AirshowEventLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const pageUrl = `${SITE_URL}/airshow/${slug}`;

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    inLanguage: "pl-PL",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: "MGYT AirShow Gallery",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {children}
    </>
  );
}
