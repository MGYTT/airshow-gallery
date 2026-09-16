import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cache } from "react";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://airshow-gallery.vercel.app").replace(/\/$/, "");
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type EventRow = {
  name: string;
  slug: string;
  short_description: string;
  long_description: string;
  start_date: string;
  end_date: string | null;
  timezone: string;
  country: string;
  country_code: string;
  city: string;
  venue_name: string;
  address: string;
  cover_image: string;
  image_alt: string;
  official_url: string;
  admission_type: string;
  status: string;
  event_type: string;
};

const getEvent = cache(async (slug: string): Promise<EventRow | null> => {
  if (!BASE || !API_KEY) return null;
  const response = await fetch(
    `${BASE}/rest/v1/airshow_events?slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`,
    { headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }, next: { revalidate: 300 } }
  );
  if (!response.ok) return null;
  const rows = (await response.json()) as EventRow[];
  return rows[0] ?? null;
});

function description(event: EventRow) {
  return event.short_description || event.long_description || `${event.name} — termin, program, bilety, dojazd i informacje dla odwiedzających.`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  const canonical = `${SITE_URL}/airshow/${slug}`;

  if (!event) {
    return { title: "Pokaz lotniczy | MGYT AirShow Gallery", robots: { index: false, follow: true } };
  }

  const title = `${event.name} — program, termin, bilety i informacje`;
  const image = event.cover_image || `${SITE_URL}/og-image.png`;

  return {
    title,
    description: description(event),
    keywords: [
      event.name,
      "pokaz lotniczy",
      "airshow",
      "pokazy lotnicze",
      "kalendarz pokazów lotniczych",
      "program pokazu lotniczego",
      "samoloty",
      event.city,
      event.country,
      "MGYT AirShow Gallery",
    ].filter(Boolean),
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "MGYT AirShow Gallery",
      locale: "pl_PL",
      title,
      description: description(event),
      images: [{ url: image, alt: event.image_alt || event.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description(event),
      images: [image],
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
}: Readonly<{ children: ReactNode; params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const event = await getEvent(slug);
  const pageUrl = `${SITE_URL}/airshow/${slug}`;

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: event?.name || "Pokaz lotniczy",
    description: event ? description(event) : undefined,
    inLanguage: "pl-PL",
    isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}#website`, url: SITE_URL, name: "MGYT AirShow Gallery" },
    primaryImageOfPage: event?.cover_image ? { "@type": "ImageObject", url: event.cover_image } : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd).replace(/</g, "\\u003c") }} />
      {eventJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd).replace(/</g, "\\u003c") }} />}
      {children}
    </>
  );
}
