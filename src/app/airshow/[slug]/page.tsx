import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Car,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Footprints,
  Home,
  Images,
  Info,
  MapPin,
  ParkingCircle,
  Plane,
  Search,
  Share2,
  Star,
  Ticket,
  TrainFront,
  UsersRound,
  Accessibility,
} from "lucide-react";
import {
  mapAirshowEvent,
  mapAirshowEventLineup,
  mapAirshowEventShowLink,
  mapAirshowEventUpdate,
  mapPhoto,
  mapShow,
  type AirshowAdmissionType,
  type AirshowEventStatus,
  type AirshowEventType,
  type AirshowLineupCategory,
  type AirshowLineupStatus,
  type DbAirShow,
  type DbAirshowEvent,
  type DbAirshowEventLineup,
  type DbAirshowEventShowLink,
  type DbAirshowEventUpdate,
  type DbPhoto,
  type MappedAirshowEvent,
  type MappedAirshowEventLineup,
  type MappedAirshowEventShowLink,
  type MappedAirshowEventUpdate,
  type MappedPhoto,
  type MappedShow,
} from "@/lib/supabase/types";

export const revalidate = 300;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airshow-gallery.vercel.app"
).replace(/\/$/, "");

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const EVENT_STATUS_META: Record<
  AirshowEventStatus,
  {
    label: string;
    schema: string;
    className: string;
  }
> = {
  scheduled: {
    label: "Wydarzenie zaplanowane",
    schema: "EventScheduled",
    className: "event-status--scheduled",
  },
  rescheduled: {
    label: "Termin zmieniony",
    schema: "EventRescheduled",
    className: "event-status--rescheduled",
  },
  postponed: {
    label: "Wydarzenie przełożone",
    schema: "EventPostponed",
    className: "event-status--postponed",
  },
  cancelled: {
    label: "Wydarzenie odwołane",
    schema: "EventCancelled",
    className: "event-status--cancelled",
  },
  completed: {
    label: "Wydarzenie zakończone",
    schema: "EventScheduled",
    className: "event-status--completed",
  },
};

const EVENT_TYPE_LABELS: Record<AirshowEventType, string> = {
  military: "Pokaz wojskowy",
  civil: "Pokaz cywilny",
  aerobatic: "Pokaz akrobacyjny",
  mixed: "Pokaz lotniczo-obronny",
  other: "Wydarzenie lotnicze",
};

const ADMISSION_LABELS: Record<AirshowAdmissionType, string> = {
  free: "Wstęp bezpłatny",
  ticketed: "Wstęp biletowany",
  registration_required: "Wymagana rejestracja",
  unknown: "Sprawdź zasady wejścia",
};

const LINEUP_STATUS_LABELS: Record<AirshowLineupStatus, string> = {
  confirmed: "Potwierdzone",
  expected: "Oczekiwane",
  unconfirmed: "Bez potwierdzenia",
  cancelled: "Odwołane",
};

const LINEUP_CATEGORY_LABELS: Record<AirshowLineupCategory, string> = {
  flying_display: "Pokaz w powietrzu",
  static_display: "Wystawa statyczna",
  team: "Zespół / formacja",
  ground_demo: "Demonstracja naziemna",
  other: "Inne",
};

function getSupabaseHeaders(): Record<string, string> | null {
  if (!BASE || !API_KEY) {
    console.error(
      "Brak NEXT_PUBLIC_SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return null;
  }

  return {
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
  };
}

function escapeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function dateAtStartOfDay(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date(0);
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
}

function getEventEndDate(event: MappedAirshowEvent) {
  return dateAtStartOfDay(event.endDate ?? event.startDate);
}

function isEventPast(event: MappedAirshowEvent) {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0
  );

  return (
    event.status === "completed" ||
    event.status === "cancelled" ||
    getEventEndDate(event) < todayStart
  );
}

function isEventRunning(event: MappedAirshowEvent) {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0
  );

  const start = dateAtStartOfDay(event.startDate);
  const end = getEventEndDate(event);

  return (
    event.status !== "cancelled" &&
    event.status !== "postponed" &&
    start <= todayStart &&
    end >= todayStart
  );
}

function getDaysUntil(event: MappedAirshowEvent) {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );

  return Math.round(
    (dateAtStartOfDay(event.startDate).getTime() - todayStart.getTime()) /
      86_400_000
  );
}

function getCountdownText(event: MappedAirshowEvent) {
  if (event.status === "cancelled") {
    return "Wydarzenie odwołane";
  }

  if (event.status === "postponed") {
    return "Wydarzenie przełożone";
  }

  if (isEventRunning(event)) {
    return "Trwa teraz";
  }

  if (isEventPast(event)) {
    return "Termin minął";
  }

  const days = getDaysUntil(event);

  if (days === 0) {
    return "Dziś";
  }

  if (days === 1) {
    return "Jutro";
  }

  return `Za ${days} dni`;
}

function formatDateRange(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (Number.isNaN(start.getTime())) {
    return "Termin w przygotowaniu";
  }

  const formatter = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (!end || Number.isNaN(end.getTime())) {
    return formatter.format(start);
  }

  const sameDate =
    start.getDate() === end.getDate() &&
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (sameDate) {
    return formatter.format(start);
  }

  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${end.toLocaleDateString(
      "pl-PL",
      {
        month: "long",
        year: "numeric",
      }
    )}`;
  }

  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function formatFullDate(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatUpdateDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Aktualizacja";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function safeText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function getEventDescription(event: MappedAirshowEvent) {
  return (
    event.shortDescription ||
    event.longDescription ||
    `${event.name} — termin, program, bilety, dojazd, parking i informacje dla odwiedzających.`
  );
}

function buildGoogleMapsUrl(event: MappedAirshowEvent) {
  if (event.directionsUrl) {
    return event.directionsUrl;
  }

  if (event.latitude !== null && event.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;
  }

  const query = [
    event.venueName,
    event.address,
    event.city,
    event.country,
  ]
    .filter(Boolean)
    .join(", ");

  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : "";
}

const getEventBySlug = cache(
  async (slug: string): Promise<MappedAirshowEvent | null> => {
    const headers = getSupabaseHeaders();

    if (!headers || !slug) {
      return null;
    }

    try {
      const response = await fetch(
        `${BASE}/rest/v1/airshow_events?slug=eq.${encodeURIComponent(
          slug
        )}&published=eq.true&limit=1`,
        {
          headers,
          next: { revalidate },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as DbAirshowEvent[];

      if (!data[0]) {
        return null;
      }

      return mapAirshowEvent(data[0]);
    } catch (error) {
      console.error("Błąd pobierania wydarzenia po slug:", error);
      return null;
    }
  }
);

async function getLineup(eventId: string): Promise<MappedAirshowEventLineup[]> {
  const headers = getSupabaseHeaders();

  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE}/rest/v1/airshow_event_lineup?event_id=eq.${encodeURIComponent(
        eventId
      )}&order=sort_order.asc,start_time.asc`,
      {
        headers,
        next: { revalidate },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as DbAirshowEventLineup[];
    return data.map(mapAirshowEventLineup);
  } catch (error) {
    console.error("Błąd pobierania programu wydarzenia:", error);
    return [];
  }
}

async function getUpdates(eventId: string): Promise<MappedAirshowEventUpdate[]> {
  const headers = getSupabaseHeaders();

  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE}/rest/v1/airshow_event_updates?event_id=eq.${encodeURIComponent(
        eventId
      )}&order=published_at.desc,sort_order.asc`,
      {
        headers,
        next: { revalidate },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as DbAirshowEventUpdate[];
    return data.map(mapAirshowEventUpdate);
  } catch (error) {
    console.error("Błąd pobierania aktualizacji wydarzenia:", error);
    return [];
  }
}

async function getGalleryLinks(
  eventId: string
): Promise<MappedAirshowEventShowLink[]> {
  const headers = getSupabaseHeaders();

  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE}/rest/v1/airshow_event_show_links?event_id=eq.${encodeURIComponent(
        eventId
      )}&order=sort_order.asc`,
      {
        headers,
        next: { revalidate },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as DbAirshowEventShowLink[];
    return data.map(mapAirshowEventShowLink);
  } catch (error) {
    console.error("Błąd pobierania powiązanych galerii:", error);
    return [];
  }
}

async function getLinkedShows(showIds: string[]): Promise<MappedShow[]> {
  const headers = getSupabaseHeaders();

  if (!headers || showIds.length === 0) {
    return [];
  }

  try {
    const encodedIds = showIds.map((id) => `"${id.replace(/"/g, '\\"')}"`);
    const response = await fetch(
      `${BASE}/rest/v1/air_shows?id=in.(${encodeURIComponent(
        encodedIds.join(",")
      )})&published=eq.true&order=year.desc`,
      {
        headers,
        next: { revalidate },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as DbAirShow[];
    const showMap = new Map(data.map((show) => [show.id, mapShow(show)]));

    return showIds
      .map((id) => showMap.get(id))
      .filter((show): show is MappedShow => Boolean(show));
  } catch (error) {
    console.error("Błąd pobierania galerii powiązanych z wydarzeniem:", error);
    return [];
  }
}

async function getLinkedPhotos(showIds: string[]): Promise<MappedPhoto[]> {
  const headers = getSupabaseHeaders();

  if (!headers || showIds.length === 0) {
    return [];
  }

  try {
    const encodedIds = showIds.map((id) => `"${id.replace(/"/g, '\\"')}"`);
    const response = await fetch(
      `${BASE}/rest/v1/photos?show_id=in.(${encodeURIComponent(
        encodedIds.join(",")
      )})&order=featured.desc,created_at.desc&limit=12`,
      {
        headers,
        next: { revalidate },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as DbPhoto[];

    return data
      .map(mapPhoto)
      .filter((photo) => photo.src)
      .slice(0, 8);
  } catch (error) {
    console.error("Błąd pobierania zdjęć powiązanych z galeriami:", error);
    return [];
  }
}

async function getRelatedEvents(
  event: MappedAirshowEvent
): Promise<MappedAirshowEvent[]> {
  const headers = getSupabaseHeaders();

  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE}/rest/v1/airshow_events?published=eq.true&id=neq.${encodeURIComponent(
        event.id
      )}&country_code=eq.${encodeURIComponent(
        event.countryCode
      )}&order=start_date.asc&limit=3`,
      {
        headers,
        next: { revalidate },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as DbAirshowEvent[];
    return data.map(mapAirshowEvent);
  } catch (error) {
    console.error("Błąd pobierania podobnych wydarzeń:", error);
    return [];
  }
}

export async function generateStaticParams() {
  const headers = getSupabaseHeaders();

  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE}/rest/v1/airshow_events?published=eq.true&select=slug`,
      {
        headers,
        next: { revalidate },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as Array<{ slug: string }>;
    return data
      .filter((event) => event.slug)
      .map((event) => ({ slug: event.slug }));
  } catch (error) {
    console.error("Błąd generateStaticParams dla /airshow/[slug]:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return {
      title: "Wydarzenie nie znalezione",
      description: "To wydarzenie nie istnieje lub nie jest opublikowane.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const pageUrl = `${SITE_URL}/airshow/${event.slug}`;
  const date = formatDateRange(event.startDate, event.endDate);
  const description = safeText(
    event.shortDescription ||
      event.longDescription ||
      `${event.name}: ${date}, ${event.city}, ${event.country}. Program, bilety, dojazd, parking i aktualne informacje.`,
    160
  );

  const image = event.coverImage || `${SITE_URL}/og-kalendarz.jpg`;

  return {
    title: `${event.name} — termin, program, bilety i dojazd`,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "website",
      locale: "pl_PL",
      url: pageUrl,
      siteName: "MGYT AirShow Gallery",
      title: `${event.name} — ${date}`,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: event.imageAlt || event.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${event.name} — ${date}`,
      description,
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
      },
    },
  };
}

export default async function AirshowEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const [lineup, updates, galleryLinks, relatedEvents] = await Promise.all([
    getLineup(event.id),
    getUpdates(event.id),
    getGalleryLinks(event.id),
    getRelatedEvents(event),
  ]);

  const linkedShowIds = galleryLinks.map((link) => link.showId);
  const [linkedShows, linkedPhotos] = await Promise.all([
    getLinkedShows(linkedShowIds),
    getLinkedPhotos(linkedShowIds),
  ]);

  const pageUrl = `${SITE_URL}/airshow/${event.slug}`;
  const mapUrl = buildGoogleMapsUrl(event);
  const statusMeta = EVENT_STATUS_META[event.status];
  const dateLabel = formatDateRange(event.startDate, event.endDate);
  const countdown = getCountdownText(event);
  const confirmedLineup = lineup.filter((item) => item.status === "confirmed");
  const visibleLineup = lineup.filter((item) => item.status !== "cancelled");
  const practicalInfoSections = [
    {
      title: "Bilety i wejście",
      content: event.practicalInfo.tickets,
      icon: Ticket,
      url: event.ticketsUrl,
      linkLabel: "Bilety i wejście",
    },
    {
      title: "Dojazd i transport",
      content: event.practicalInfo.transport,
      icon: TrainFront,
      url: mapUrl,
      linkLabel: "Otwórz trasę",
    },
    {
      title: "Parking",
      content: event.practicalInfo.parking,
      icon: ParkingCircle,
      url: event.parkingUrl,
      linkLabel: "Informacje o parkingu",
    },
    {
      title: "Dla fotografów",
      content: event.practicalInfo.photography,
      icon: Search,
      url: "",
      linkLabel: "",
    },
    {
      title: "Dostępność",
      content: event.practicalInfo.accessibility,
      icon: Accessibility,
      url: "",
      linkLabel: "",
    },
    {
      title: "Ważne informacje",
      content: event.practicalInfo.notes,
      icon: Info,
      url: "",
      linkLabel: "",
    },
  ].filter((item) => item.content || item.url);

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: getEventDescription(event),
    url: pageUrl,
    image: event.coverImage ? [event.coverImage] : undefined,
    startDate: event.startDate,
    endDate: event.endDate ?? undefined,
    eventStatus: `https://schema.org/${statusMeta.schema}`,
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
    offers:
      event.admissionType === "free"
        ? {
            "@type": "Offer",
            url: event.ticketsUrl || event.officialUrl || pageUrl,
            price: "0",
            priceCurrency: event.countryCode === "PL" ? "PLN" : "EUR",
            availability: "https://schema.org/InStock",
          }
        : event.admissionType === "ticketed" && event.ticketsUrl
          ? {
              "@type": "Offer",
              url: event.ticketsUrl,
              availability: "https://schema.org/InStock",
            }
          : undefined,
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
      {
        "@type": "ListItem",
        position: 3,
        name: event.name,
        item: pageUrl,
      },
    ],
  };

  const faqJsonLd =
    event.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: event.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(eventJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(faqJsonLd) }}
        />
      )}

      <style>{`
        .airshow-event-page{min-height:100dvh;padding-top:64px;padding-bottom:clamp(var(--space-16),8vw,var(--space-24))}
        .airshow-event-hero{position:relative;min-height:clamp(380px,52vw,630px);display:flex;align-items:flex-end;overflow:hidden;background:#0a0a0a}
        .airshow-event-hero-image{position:absolute;inset:0}
        .airshow-event-hero-image img{object-fit:cover}
        .airshow-event-hero-placeholder{position:absolute;inset:0;background:linear-gradient(135deg,var(--color-surface-offset),var(--color-surface-dynamic));display:grid;place-items:center;color:var(--color-text-faint)}
        .airshow-event-hero-overlay{position:absolute;inset:0;background:linear-gradient(155deg,rgba(0,0,0,.16),rgba(0,0,0,.55) 56%,rgba(0,0,0,.92))}
        .airshow-event-hero-content{position:relative;z-index:1;width:100%;padding:clamp(var(--space-8),6vw,var(--space-16)) 0}
        .airshow-event-back{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);border-radius:var(--radius-full);background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.16);color:rgba(255,255,255,.84);font-size:var(--text-xs);font-weight:700;margin-bottom:var(--space-8);text-decoration:none}
        .airshow-event-back:hover{color:#fff;background:rgba(255,255,255,.18)}
        .airshow-event-kicker{display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-4)}
        .airshow-event-kicker span{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:var(--radius-full);font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
        .event-status--scheduled{color:#fff;background:var(--color-accent)}
        .event-status--rescheduled,.event-status--postponed{color:#17110a;background:#f5cc53}
        .event-status--cancelled{color:#fff;background:#dc2626}
        .event-status--completed{color:#fff;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.18)}
        .airshow-event-type{color:rgba(255,255,255,.88);background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.14)}
        .airshow-event-title{max-width:18ch;font-family:var(--font-display);font-size:var(--text-3xl);font-weight:900;line-height:1.01;letter-spacing:-.05em;color:#fff;text-shadow:0 3px 26px rgba(0,0,0,.35)}
        .airshow-event-subtitle{max-width:68ch;margin-top:var(--space-5);font-size:var(--text-base);line-height:1.7;color:rgba(255,255,255,.72)}
        .airshow-event-hero-meta{display:flex;gap:var(--space-3);flex-wrap:wrap;margin-top:var(--space-6)}
        .airshow-event-hero-meta-item{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);border:1px solid rgba(255,255,255,.16);border-radius:var(--radius-full);background:rgba(0,0,0,.20);backdrop-filter:blur(8px);color:rgba(255,255,255,.92);font-size:var(--text-xs);font-weight:650}
        .airshow-event-layout{max-width:var(--content-wide);margin:0 auto;padding:var(--space-8) clamp(var(--space-4),4vw,var(--space-8));display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,330px);gap:clamp(var(--space-8),5vw,var(--space-16));align-items:start}
        .airshow-event-main{min-width:0}
        .airshow-event-sidebar{position:sticky;top:calc(64px + var(--space-4));display:flex;flex-direction:column;gap:var(--space-4)}
        .airshow-event-card{padding:var(--space-5);border:1px solid var(--color-border);border-radius:var(--radius-xl);background:var(--color-surface)}
        .airshow-event-sidebar-title{font-family:var(--font-display);font-size:var(--text-base);font-weight:900;letter-spacing:-.02em;margin-bottom:var(--space-4)}
        .airshow-event-actions{display:flex;flex-direction:column;gap:var(--space-2)}
        .airshow-event-action{display:flex;align-items:center;justify-content:flex-start;gap:var(--space-3);width:100%;min-height:44px;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface-offset);color:var(--color-text);font-size:var(--text-sm);font-weight:700;text-decoration:none}
        .airshow-event-action:hover{background:var(--color-surface-dynamic);border-color:var(--color-border-strong)}
        .airshow-event-action--primary{background:var(--color-accent);border-color:var(--color-accent);color:#fff}
        .airshow-event-action--primary:hover{background:var(--color-accent-hover);border-color:var(--color-accent-hover)}
        .airshow-event-action svg:last-child{margin-left:auto;color:currentColor;opacity:.7}
        .airshow-event-countdown{padding:var(--space-5);border-radius:var(--radius-xl);background:var(--color-accent-subtle);border:1px solid color-mix(in srgb,var(--color-accent) 30%,transparent)}
        .airshow-event-countdown-label{font-size:var(--text-xs);font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--color-text-muted)}
        .airshow-event-countdown-value{display:block;margin-top:var(--space-2);font-family:var(--font-display);font-size:var(--text-xl);font-weight:900;line-height:1;letter-spacing:-.04em;color:var(--color-accent)}
        .airshow-event-countdown-copy{margin-top:var(--space-2);font-size:var(--text-xs);color:var(--color-text-muted);line-height:1.55}
        .airshow-event-article{font-size:var(--text-base);color:var(--color-text-muted);line-height:1.8;max-width:72ch}
        .airshow-event-article p + p{margin-top:var(--space-4)}
        .airshow-event-section{margin-top:clamp(var(--space-10),7vw,var(--space-16));padding-top:var(--space-8);border-top:1px solid var(--color-divider)}
        .airshow-event-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:var(--space-4);flex-wrap:wrap;margin-bottom:var(--space-6)}
        .airshow-event-section-title{display:flex;align-items:center;gap:var(--space-3);font-family:var(--font-display);font-size:var(--text-xl);font-weight:900;letter-spacing:-.035em;line-height:1.1}
        .airshow-event-section-title svg{color:var(--color-accent)}
        .airshow-event-section-copy{max-width:64ch;margin-top:var(--space-3);font-size:var(--text-sm);color:var(--color-text-muted);line-height:1.7}
        .airshow-event-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-3);margin-top:var(--space-6)}
        .airshow-event-fact{display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-4);border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface)}
        .airshow-event-fact-icon{width:34px;height:34px;display:grid;place-items:center;flex-shrink:0;border-radius:var(--radius-md);background:var(--color-accent-subtle);color:var(--color-accent)}
        .airshow-event-fact-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--color-text-faint)}
        .airshow-event-fact-value{display:block;margin-top:2px;font-size:var(--text-sm);font-weight:700;color:var(--color-text);line-height:1.35}
        .airshow-event-lineup{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-3)}
        .airshow-event-lineup-item{padding:var(--space-4);border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface)}
        .airshow-event-lineup-top{display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);margin-bottom:var(--space-3)}
        .airshow-event-lineup-status{padding:3px 8px;border-radius:var(--radius-full);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.07em}
        .lineup-status--confirmed{color:#15803d;background:rgba(22,163,74,.10)}
        .lineup-status--expected{color:var(--color-gold);background:var(--color-gold-subtle)}
        .lineup-status--unconfirmed{color:var(--color-text-muted);background:var(--color-surface-offset)}
        .lineup-status--cancelled{color:#dc2626;background:rgba(220,38,38,.10)}
        .airshow-event-lineup-category{font-size:10px;color:var(--color-text-faint);text-align:right}
        .airshow-event-lineup-name{font-family:var(--font-display);font-size:var(--text-base);font-weight:800;letter-spacing:-.02em}
        .airshow-event-lineup-description{margin-top:var(--space-2);font-size:var(--text-xs);line-height:1.65;color:var(--color-text-muted)}
        .airshow-event-lineup-meta{display:flex;gap:var(--space-3);flex-wrap:wrap;margin-top:var(--space-3);font-size:var(--text-xs);color:var(--color-text-faint)}
        .airshow-event-lineup-source{color:var(--color-accent);font-weight:800}
        .airshow-event-practical-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-4)}
        .airshow-event-practical-card{padding:var(--space-5);border:1px solid var(--color-border);border-radius:var(--radius-xl);background:var(--color-surface)}
        .airshow-event-practical-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:var(--radius-lg);background:var(--color-surface-offset);color:var(--color-accent);margin-bottom:var(--space-4)}
        .airshow-event-practical-title{font-family:var(--font-display);font-size:var(--text-base);font-weight:900;letter-spacing:-.02em;margin-bottom:var(--space-2)}
        .airshow-event-practical-copy{font-size:var(--text-sm);line-height:1.7;color:var(--color-text-muted);white-space:pre-line}
        .airshow-event-practical-link{display:inline-flex;align-items:center;gap:var(--space-2);margin-top:var(--space-4);color:var(--color-accent);font-size:var(--text-xs);font-weight:800;text-decoration:none}
        .airshow-event-practical-link:hover{text-decoration:underline}
        .airshow-event-timeline{position:relative;display:flex;flex-direction:column;gap:var(--space-3)}
        .airshow-event-update{display:grid;grid-template-columns:120px minmax(0,1fr);gap:var(--space-5);padding:var(--space-4);border-left:2px solid var(--color-accent);background:var(--color-surface);border-top:1px solid var(--color-border);border-right:1px solid var(--color-border);border-bottom:1px solid var(--color-border);border-radius:0 var(--radius-lg) var(--radius-lg) 0}
        .airshow-event-update-date{font-size:var(--text-xs);font-weight:700;color:var(--color-text-faint);line-height:1.5}
        .airshow-event-update-title{font-size:var(--text-sm);font-weight:800;margin-bottom:var(--space-1)}
        .airshow-event-update-content{font-size:var(--text-xs);line-height:1.65;color:var(--color-text-muted)}
        .airshow-event-faq{display:flex;flex-direction:column;gap:var(--space-3)}
        .airshow-event-faq-item{padding:var(--space-5);border:1px solid var(--color-border);border-radius:var(--radius-xl);background:var(--color-surface)}
        .airshow-event-faq-question{font-family:var(--font-display);font-size:var(--text-base);font-weight:900;letter-spacing:-.02em}
        .airshow-event-faq-answer{margin-top:var(--space-3);font-size:var(--text-sm);line-height:1.75;color:var(--color-text-muted);white-space:pre-line}
        .airshow-event-gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:var(--space-4)}
        .airshow-event-gallery-card{display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--color-border);border-radius:var(--radius-xl);background:var(--color-surface);color:inherit;text-decoration:none;transition:transform var(--transition),box-shadow var(--transition),border-color var(--transition)}
        .airshow-event-gallery-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-md);border-color:color-mix(in srgb,var(--color-accent) 32%,transparent)}
        .airshow-event-gallery-image{position:relative;aspect-ratio:16/9;background:var(--color-surface-offset)}
        .airshow-event-gallery-image img{object-fit:cover}
        .airshow-event-gallery-body{padding:var(--space-4)}
        .airshow-event-gallery-title{font-size:var(--text-sm);font-weight:800;line-height:1.35}
        .airshow-event-gallery-meta{display:flex;align-items:center;gap:var(--space-2);margin-top:var(--space-2);font-size:var(--text-xs);color:var(--color-text-faint)}
        .airshow-event-photo-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--space-3)}
        .airshow-event-photo{position:relative;aspect-ratio:1/1;overflow:hidden;border-radius:var(--radius-lg);background:var(--color-surface-offset);border:1px solid var(--color-border)}
        .airshow-event-photo img{object-fit:cover;transition:transform var(--transition-slow)}
        .airshow-event-photo:hover img{transform:scale(1.05)}
        .airshow-event-sources{display:flex;flex-direction:column;gap:var(--space-2)}
        .airshow-event-source{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text-muted);font-size:var(--text-xs);font-weight:650;text-decoration:none;overflow:hidden}
        .airshow-event-source:hover{color:var(--color-accent);border-color:color-mix(in srgb,var(--color-accent) 32%,transparent)}
        .airshow-event-source span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .airshow-event-related{display:flex;flex-direction:column;gap:var(--space-2)}
        .airshow-event-related-link{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-md);color:var(--color-text-muted);text-decoration:none}
        .airshow-event-related-link:hover{background:var(--color-surface-offset);color:var(--color-text)}
        .airshow-event-related-date{margin-left:auto;color:var(--color-text-faint);font-size:var(--text-xs);white-space:nowrap}
        @media(max-width:900px){
          .airshow-event-layout{grid-template-columns:1fr}
          .airshow-event-sidebar{position:static;display:grid;grid-template-columns:1fr 1fr;align-items:start}
          .airshow-event-sidebar > :first-child{grid-column:1 / -1}
        }
        @media(max-width:640px){
          .airshow-event-page{padding-top:64px}
          .airshow-event-hero{min-height:440px}
          .airshow-event-title{font-size:var(--text-2xl)}
          .airshow-event-subtitle{font-size:var(--text-sm)}
          .airshow-event-hero-meta{gap:var(--space-2)}
          .airshow-event-hero-meta-item{font-size:11px}
          .airshow-event-layout{padding-top:var(--space-6)}
          .airshow-event-sidebar{display:flex}
          .airshow-event-facts,.airshow-event-lineup,.airshow-event-practical-grid{grid-template-columns:1fr}
          .airshow-event-update{grid-template-columns:1fr;gap:var(--space-2)}
          .airshow-event-photo-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        }
      `}</style>

      <main className="airshow-event-page">
        <section className="airshow-event-hero">
          {event.coverImage ? (
            <div className="airshow-event-hero-image">
              <Image
                src={event.coverImage}
                alt={
                  event.imageAlt ||
                  `${event.name} — pokaz lotniczy w ${event.city}, ${event.country}`
                }
                fill
                priority
                sizes="100vw"
                quality={90}
              />
            </div>
          ) : (
            <div className="airshow-event-hero-placeholder" aria-hidden>
              <Plane size={64} />
            </div>
          )}

          <div className="airshow-event-hero-overlay" />

          <div className="airshow-event-hero-content">
            <div className="container--narrow">
              <Link href="/kalendarz" className="airshow-event-back">
                <ArrowLeft size={14} />
                Kalendarz pokazów
              </Link>

              <div className="airshow-event-kicker">
                <span className={statusMeta.className}>
                  {event.status === "cancelled" ? (
                    <CircleAlert size={11} />
                  ) : (
                    <Check size={11} />
                  )}
                  {statusMeta.label}
                </span>

                <span className="airshow-event-type">
                  <Plane size={11} />
                  {EVENT_TYPE_LABELS[event.eventType]}
                </span>
              </div>

              <h1 className="airshow-event-title">{event.name}</h1>

              {(event.shortDescription || event.longDescription) && (
                <p className="airshow-event-subtitle">
                  {event.shortDescription || safeText(event.longDescription, 260)}
                </p>
              )}

              <div className="airshow-event-hero-meta">
                <span className="airshow-event-hero-meta-item">
                  <CalendarDays size={14} />
                  {dateLabel}
                </span>

                <span className="airshow-event-hero-meta-item">
                  <MapPin size={14} />
                  {event.city}, {event.country}
                </span>

                {event.venueName && (
                  <span className="airshow-event-hero-meta-item">
                    <Plane size={14} />
                    {event.venueName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="airshow-event-layout">
          <article className="airshow-event-main">
            <nav
              aria-label="Ścieżka nawigacji"
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "var(--space-2)",
                fontSize: "var(--text-xs)",
                color: "var(--color-text-faint)",
                marginBottom: "var(--space-6)",
              }}
            >
              <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                <Home size={12} />
                Strona główna
              </Link>
              <ChevronRight size={12} aria-hidden />
              <Link href="/kalendarz">Kalendarz</Link>
              <ChevronRight size={12} aria-hidden />
              <span aria-current="page" style={{ color:"var(--color-text-muted)", fontWeight:700 }}>
                {event.name}
              </span>
            </nav>

            <section aria-labelledby="event-overview-heading">
              <h2 id="event-overview-heading" className="sr-only">
                Informacje o wydarzeniu
              </h2>

              {event.longDescription ? (
                <div className="airshow-event-article">
                  {event.longDescription
                    .split(/\n{2,}/)
                    .filter(Boolean)
                    .map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                </div>
              ) : (
                <p className="airshow-event-article">
                  Szczegółowy opis wydarzenia jest aktualizowany na podstawie informacji organizatora.
                </p>
              )}

              <div className="airshow-event-facts">
                <div className="airshow-event-fact">
                  <div className="airshow-event-fact-icon">
                    <CalendarDays size={16} />
                  </div>
                  <div>
                    <span className="airshow-event-fact-label">Termin</span>
                    <span className="airshow-event-fact-value">{dateLabel}</span>
                  </div>
                </div>

                <div className="airshow-event-fact">
                  <div className="airshow-event-fact-icon">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <span className="airshow-event-fact-label">Miejsce</span>
                    <span className="airshow-event-fact-value">
                      {event.venueName || `${event.city}, ${event.country}`}
                    </span>
                  </div>
                </div>

                <div className="airshow-event-fact">
                  <div className="airshow-event-fact-icon">
                    <Ticket size={16} />
                  </div>
                  <div>
                    <span className="airshow-event-fact-label">Wstęp</span>
                    <span className="airshow-event-fact-value">
                      {ADMISSION_LABELS[event.admissionType]}
                    </span>
                  </div>
                </div>

                <div className="airshow-event-fact">
                  <div className="airshow-event-fact-icon">
                    <UsersRound size={16} />
                  </div>
                  <div>
                    <span className="airshow-event-fact-label">Program</span>
                    <span className="airshow-event-fact-value">
                      {confirmedLineup.length > 0
                        ? `${confirmedLineup.length} potwierdzonych pozycji`
                        : "Program w przygotowaniu"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {visibleLineup.length > 0 && (
              <section className="airshow-event-section" aria-labelledby="lineup-heading">
                <div className="airshow-event-section-head">
                  <div>
                    <h2 id="lineup-heading" className="airshow-event-section-title">
                      <Plane size={23} />
                      Co zobaczymy?
                    </h2>
                    <p className="airshow-event-section-copy">
                      Lista jest aktualizowana na podstawie komunikatów organizatora.
                      Status przy każdej pozycji wyjaśnia, czy udział został potwierdzony.
                    </p>
                  </div>

                  {event.programUrl && (
                    <a
                      href={event.programUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                    >
                      Oficjalny program
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>

                <div className="airshow-event-lineup">
                  {visibleLineup.map((item) => (
                    <article key={item.id} className="airshow-event-lineup-item">
                      <div className="airshow-event-lineup-top">
                        <span className={`airshow-event-lineup-status lineup-status--${item.status}`}>
                          {LINEUP_STATUS_LABELS[item.status]}
                        </span>
                        <span className="airshow-event-lineup-category">
                          {LINEUP_CATEGORY_LABELS[item.category]}
                        </span>
                      </div>

                      <h3 className="airshow-event-lineup-name">{item.title}</h3>

                      {item.description && (
                        <p className="airshow-event-lineup-description">{item.description}</p>
                      )}

                      <div className="airshow-event-lineup-meta">
                        {item.country && <span>{item.country}</span>}
                        {item.startTime && (
                          <span>
                            {item.startTime.slice(0, 5)}
                            {item.endTime ? `–${item.endTime.slice(0, 5)}` : ""}
                          </span>
                        )}
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="airshow-event-lineup-source"
                          >
                            Źródło ↗
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {practicalInfoSections.length > 0 && (
              <section className="airshow-event-section" aria-labelledby="practical-heading">
                <div className="airshow-event-section-head">
                  <div>
                    <h2 id="practical-heading" className="airshow-event-section-title">
                      <Car size={23} />
                      Informacje dla odwiedzających
                    </h2>
                    <p className="airshow-event-section-copy">
                      Najważniejsze informacje przed wyjazdem. Przed podróżą sprawdź też aktualne komunikaty organizatora.
                    </p>
                  </div>
                </div>

                <div className="airshow-event-practical-grid">
                  {practicalInfoSections.map((section) => {
                    const Icon = section.icon;

                    return (
                      <article key={section.title} className="airshow-event-practical-card">
                        <div className="airshow-event-practical-icon">
                          <Icon size={19} />
                        </div>
                        <h3 className="airshow-event-practical-title">{section.title}</h3>

                        {section.content && (
                          <p className="airshow-event-practical-copy">{section.content}</p>
                        )}

                        {section.url && (
                          <a
                            href={section.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="airshow-event-practical-link"
                          >
                            {section.linkLabel}
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {updates.length > 0 && (
              <section className="airshow-event-section" aria-labelledby="updates-heading">
                <div className="airshow-event-section-head">
                  <div>
                    <h2 id="updates-heading" className="airshow-event-section-title">
                      <Clock3 size={23} />
                      Aktualizacje
                    </h2>
                    <p className="airshow-event-section-copy">
                      Dziennik zmian i nowych informacji dotyczących wydarzenia.
                    </p>
                  </div>
                </div>

                <div className="airshow-event-timeline">
                  {updates.map((update) => (
                    <article key={update.id} className="airshow-event-update">
                      <time className="airshow-event-update-date" dateTime={update.publishedAt}>
                        {formatUpdateDate(update.publishedAt)}
                      </time>
                      <div>
                        <h3 className="airshow-event-update-title">{update.title}</h3>
                        {update.content && (
                          <p className="airshow-event-update-content">{update.content}</p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {event.faq.length > 0 && (
              <section className="airshow-event-section" aria-labelledby="faq-heading">
                <div className="airshow-event-section-head">
                  <div>
                    <h2 id="faq-heading" className="airshow-event-section-title">
                      <Info size={23} />
                      Najczęstsze pytania
                    </h2>
                    <p className="airshow-event-section-copy">
                      Odpowiedzi oparte na aktualnie dostępnych informacjach i źródłach.
                    </p>
                  </div>
                </div>

                <div className="airshow-event-faq">
                  {event.faq.map((item, index) => (
                    <article
                      key={`${item.question}-${index}`}
                      className="airshow-event-faq-item"
                    >
                      <h3 className="airshow-event-faq-question">{item.question}</h3>
                      <p className="airshow-event-faq-answer">{item.answer}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {linkedShows.length > 0 && (
              <section className="airshow-event-section" aria-labelledby="gallery-heading">
                <div className="airshow-event-section-head">
                  <div>
                    <h2 id="gallery-heading" className="airshow-event-section-title">
                      <Images size={23} />
                      AirShow Gallery z poprzednich edycji
                    </h2>
                    <p className="airshow-event-section-copy">
                      Autorskie zdjęcia i relacje z wcześniejszych pokazów.
                    </p>
                  </div>

                  <Link href="/gallery" className="btn btn-ghost btn-sm">
                    Cała galeria
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="airshow-event-gallery-grid">
                  {linkedShows.map((show) => {
                    const connection = galleryLinks.find(
                      (link) => link.showId === show.id
                    );

                    return (
                      <Link
                        key={show.id}
                        href={`/pokaz/${show.id}`}
                        className="airshow-event-gallery-card"
                      >
                        <div className="airshow-event-gallery-image">
                          {show.coverImage ? (
                            <Image
                              src={show.coverImage}
                              alt={`${show.name} — ${show.location}, ${show.year}`}
                              fill
                              sizes="(max-width:640px) 100vw, (max-width:1000px) 50vw, 320px"
                            />
                          ) : (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                display: "grid",
                                placeItems: "center",
                                color: "var(--color-text-faint)",
                              }}
                            >
                              <Images size={30} />
                            </div>
                          )}
                        </div>

                        <div className="airshow-event-gallery-body">
                          <h3 className="airshow-event-gallery-title">
                            {connection?.label || show.name}
                          </h3>
                          <p className="airshow-event-gallery-meta">
                            <MapPin size={12} />
                            {show.location} · {show.year} · {show.photoCount} zdjęć
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {linkedPhotos.length > 0 && (
                  <div className="airshow-event-photo-grid" style={{ marginTop:"var(--space-4)" }}>
                    {linkedPhotos.map((photo) => (
                      <Link
                        key={photo.id}
                        href={`/pokaz/${photo.showId}`}
                        className="airshow-event-photo"
                        aria-label={`Zobacz galerię: ${photo.alt || photo.aircraft || "zdjęcie z pokazu"}`}
                      >
                        <Image
                          src={photo.src}
                          alt={photo.alt || photo.aircraft || "Zdjęcie z poprzedniej edycji"}
                          fill
                          sizes="(max-width:640px) 50vw, 25vw"
                        />
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {event.sourceUrls.length > 0 && (
              <section className="airshow-event-section" aria-labelledby="sources-heading">
                <div className="airshow-event-section-head">
                  <div>
                    <h2 id="sources-heading" className="airshow-event-section-title">
                      <FileText size={23} />
                      Źródła informacji
                    </h2>
                    <p className="airshow-event-section-copy">
                      Weryfikuj najważniejsze informacje bezpośrednio u organizatora, szczególnie przed wyjazdem.
                    </p>
                  </div>
                </div>

                <div className="airshow-event-sources">
                  {event.sourceUrls.map((source) => (
                    <a
                      key={source}
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="airshow-event-source"
                    >
                      <ExternalLink size={14} />
                      <span>{source}</span>
                    </a>
                  ))}
                </div>

                {event.lastVerifiedAt && (
                  <p style={{ marginTop:"var(--space-4)", fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>
                    Ostatnia weryfikacja informacji: {formatFullDate(event.lastVerifiedAt)}.
                  </p>
                )}
              </section>
            )}
          </article>

          <aside className="airshow-event-sidebar" aria-label="Szybkie informacje">
            <section className="airshow-event-card">
              <h2 className="airshow-event-sidebar-title">Przydatne linki</h2>

              <div className="airshow-event-actions">
                {event.officialUrl && (
                  <a
                    href={event.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="airshow-event-action airshow-event-action--primary"
                  >
                    <GlobeIcon />
                    Oficjalna strona
                    <ExternalLink size={14} />
                  </a>
                )}

                {event.ticketsUrl && (
                  <a
                    href={event.ticketsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="airshow-event-action"
                  >
                    <Ticket size={17} />
                    Bilety
                    <ExternalLink size={14} />
                  </a>
                )}

                {event.programUrl && (
                  <a
                    href={event.programUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="airshow-event-action"
                  >
                    <CalendarDays size={17} />
                    Program
                    <ExternalLink size={14} />
                  </a>
                )}

                {event.parkingUrl && (
                  <a
                    href={event.parkingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="airshow-event-action"
                  >
                    <ParkingCircle size={17} />
                    Parking
                    <ExternalLink size={14} />
                  </a>
                )}

                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="airshow-event-action"
                  >
                    <MapPin size={17} />
                    Otwórz mapę
                    <ExternalLink size={14} />
                  </a>
                )}

                <a
                  href={`/airshow/${event.slug}/calendar.ics`}
                  className="airshow-event-action"
                >
                  <Download size={17} />
                  Dodaj do kalendarza
                  <ArrowRight size={14} />
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    pageUrl
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="airshow-event-action"
                >
                  <Share2 size={17} />
                  Udostępnij
                  <ExternalLink size={14} />
                </a>
              </div>
            </section>

            <section className="airshow-event-countdown">
              <p className="airshow-event-countdown-label">Status terminu</p>
              <strong className="airshow-event-countdown-value">{countdown}</strong>
              <p className="airshow-event-countdown-copy">
                {event.status === "cancelled"
                  ? "Sprawdź oficjalny komunikat organizatora."
                  : event.status === "postponed"
                    ? "Nowy termin sprawdź na oficjalnej stronie wydarzenia."
                    : `${dateLabel} · ${event.city}, ${event.country}`}
              </p>
            </section>

            {relatedEvents.length > 0 && (
              <section className="airshow-event-card">
                <h2 className="airshow-event-sidebar-title">
                  Inne wydarzenia w {event.country}
                </h2>

                <div className="airshow-event-related">
                  {relatedEvents.map((related) => (
                    <Link
                      key={related.id}
                      href={`/airshow/${related.slug}`}
                      className="airshow-event-related-link"
                    >
                      <Plane size={15} color="var(--color-accent)" />
                      <span style={{ minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:"var(--text-xs)", fontWeight:700 }}>
                        {related.name}
                      </span>
                      <span className="airshow-event-related-date">
                        {formatFullDate(related.startDate)}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="airshow-event-card">
              <h2 className="airshow-event-sidebar-title">Przed wyjazdem</h2>
              <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-muted)", lineHeight:1.7 }}>
                Termin, program, bilety i logistyka mogą się zmienić. Przed podróżą sprawdź najnowsze informacje u organizatora.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 0 20" />
      <path d="M12 2a15.3 15.3 0 0 0 0 20" />
    </svg>
  );
}