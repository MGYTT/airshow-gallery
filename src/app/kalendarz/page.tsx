import { Metadata } from "next";
import KalendarzClient from "./KalendarzClient";

const SITE_URL = "https://airshow-gallery.vercel.app/"; // podmień na swoją domenę produkcyjną

export const metadata: Metadata = {
  title: "Kalendarz Pokazów Lotniczych 2026 — Terminy Airshow w Polsce | AirShow Gallery",
  description:
    "Pełny kalendarz pokazów lotniczych 2026 w Polsce i za granicą. Sprawdź daty, lokalizacje i odliczanie do najbliższych airshow — Radom, Świdnik, Leszno, Suwałki i więcej.",
  keywords: [
    "kalendarz pokazów lotniczych 2026",
    "pokazy lotnicze polska",
    "airshow 2026",
    "terminy pokazów lotniczych",
    "pikniki lotnicze 2026",
    "air show kalendarz",
    "pokazy samolotów polska",
  ],
  alternates: {
    canonical: `${SITE_URL}/kalendarz`,
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: `${SITE_URL}/kalendarz`,
    siteName: "AirShow Gallery",
    title: "Kalendarz Pokazów Lotniczych 2026 — AirShow Gallery",
    description:
      "Wszystkie pokazy lotnicze w Polsce i wybrane imprezy zagraniczne w jednym miejscu. Sprawdź daty i odliczanie do najbliższego airshow.",
    images: [
      {
        url: `${SITE_URL}/og-kalendarz.jpg`,
        width: 1200,
        height: 630,
        alt: "Kalendarz pokazów lotniczych 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalendarz Pokazów Lotniczych 2026 — AirShow Gallery",
    description:
      "Wszystkie pokazy lotnicze w Polsce i wybrane imprezy zagraniczne w jednym miejscu.",
    images: [`${SITE_URL}/og-kalendarz.jpg`],
  },
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
};

// ── JSON-LD: lista wydarzeń dla Google Rich Results ──────────
// Uwaga: te dane muszą być zsynchronizowane z EVENTS_RAW w KalendarzClient.tsx
const eventsJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Kalendarz Pokazów Lotniczych 2026",
  itemListElement: [
    {
      "@type": "Event",
      position: 1,
      name: "Odlotowe Suwałki Air Show",
      startDate: "2026-06-27",
      location: {
        "@type": "Place",
        name: "Suwałki",
        address: { "@type": "PostalAddress", addressLocality: "Suwałki", addressCountry: "PL" },
      },
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    },
    {
      "@type": "Event",
      position: 2,
      name: "Fly Fest",
      startDate: "2026-07-04",
      endDate: "2026-07-05",
      location: {
        "@type": "Place",
        name: "Piotrków Trybunalski",
        address: { "@type": "PostalAddress", addressLocality: "Piotrków Trybunalski", addressCountry: "PL" },
      },
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    },
    {
      "@type": "Event",
      position: 3,
      name: "NATO Days 2026",
      startDate: "2026-09-19",
      endDate: "2026-09-20",
      location: {
        "@type": "Place",
        name: "Ostrawa",
        address: { "@type": "PostalAddress", addressLocality: "Ostrawa", addressCountry: "CZ" },
      },
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    },
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Strona główna", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Kalendarz pokazów lotniczych", item: `${SITE_URL}/kalendarz` },
  ],
};

export default function KalendarzPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <KalendarzClient />
    </>
  );
}