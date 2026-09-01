import type { Metadata } from "next";
import { cache } from "react";
import KalendarzClient from "./KalendarzClient";
import {
  mapAirshowEvent,
  type DbAirshowEvent,
  type MappedAirshowEvent,
} from "@/lib/supabase/types";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airshow-gallery.vercel.app"
).replace(/\/$/, "");

export const revalidate = 300;

const getCalendarEvents = cache(async (): Promise<MappedAirshowEvent[]> => {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!baseUrl || !apiKey) {
    console.error(
      "Brak NEXT_PUBLIC_SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return [];
  }

  try {
    const response = await fetch(
      `${baseUrl}/rest/v1/airshow_events?published=eq.true&order=start_date.asc`,
      {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
        next: { revalidate },
      }
    );

    if (!response.ok) {
      console.error(
        `Nie udało się pobrać wydarzeń kalendarza. HTTP ${response.status}.`
      );
      return [];
    }

    const data = (await response.json()) as DbAirshowEvent[];
    return data.map(mapAirshowEvent);
  } catch (error) {
    console.error("Błąd pobierania kalendarza:", error);
    return [];
  }
});

function formatCalendarYear(events: MappedAirshowEvent[]) {
  const years = [...new Set(
    events
      .map((event) => new Date(event.startDate).getFullYear())
      .filter((year) => Number.isFinite(year))
  )].sort();

  if (years.length === 0) {
    return new Date().getFullYear();
  }

  if (years.length === 1) {
    return years[0];
  }

  return `${years[0]}–${years[years.length - 1]}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const events = await getCalendarEvents();
  const years = formatCalendarYear(events);
  const title = `Kalendarz pokazów lotniczych ${years} — terminy, program i dojazd`;
  const description = events.length > 0
    ? `Kalendarz pokazów lotniczych ${years}: ${events.length} zweryfikowanych wydarzeń w Polsce, Czechach, Słowacji i blisko Polski. Terminy, program, bilety, parking oraz dojazd.`
    : `Kalendarz pokazów lotniczych ${years} w Polsce, Czechach, Słowacji i blisko Polski. Sprawdzaj terminy, program, bilety, parking oraz dojazd.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/kalendarz`,
    },
    openGraph: {
      type: "website",
      locale: "pl_PL",
      url: `${SITE_URL}/kalendarz`,
      siteName: "MGYT AirShow Gallery",
      title,
      description,
      images: [
        {
          url: `${SITE_URL}/og-kalendarz.jpg`,
          width: 1200,
          height: 630,
          alt: `Kalendarz pokazów lotniczych ${years}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
}

function escapeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function KalendarzPage() {
  const events = await getCalendarEvents();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Kalendarz pokazów lotniczych",
    numberOfItems: events.length,
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        name: event.name,
        url: `${SITE_URL}/airshow/${event.slug}`,
        image: event.coverImage ? [event.coverImage] : undefined,
        description: event.shortDescription || event.longDescription || undefined,
        startDate: event.startDate,
        endDate: event.endDate ?? undefined,
        eventStatus: `https://schema.org/${
          event.status === "cancelled"
            ? "EventCancelled"
            : event.status === "postponed"
              ? "EventPostponed"
              : event.status === "rescheduled"
                ? "EventRescheduled"
                : "EventScheduled"
        }`,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: event.venueName || `${event.city}, ${event.country}`,
          address: {
            "@type": "PostalAddress",
            streetAddress: event.address || undefined,
            addressLocality: event.city,
            addressCountry: event.countryCode,
          },
          geo:
            event.latitude !== null && event.longitude !== null
              ? {
                  "@type": "GeoCoordinates",
                  latitude: event.latitude,
                  longitude: event.longitude,
                }
              : undefined,
        },
        organizer: event.officialUrl
          ? {
              "@type": "Organization",
              name: event.name,
              url: event.officialUrl,
            }
          : undefined,
      },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Strona główna",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Kalendarz pokazów lotniczych",
        item: `${SITE_URL}/kalendarz`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(breadcrumbJsonLd) }}
      />
      <KalendarzClient events={events} />
    </>
  );
}