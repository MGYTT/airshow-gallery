import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airshow-gallery.vercel.app"
).replace(/\/$/, "");

interface SitemapEvent {
  slug: string;
  updated_at: string;
  published_at: string | null;
}

interface SitemapShow {
  id: string;
  updated_at: string;
}

function getSupabaseHeaders(): Record<string, string> | null {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    console.error(
      "Sitemap: brak NEXT_PUBLIC_SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );

    return null;
  }

  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}

function safeDate(value: string | null | undefined, fallback: Date) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

async function getPublishedEvents(): Promise<SitemapEvent[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const headers = getSupabaseHeaders();

  if (!baseUrl || !headers) {
    return [];
  }

  try {
    const response = await fetch(
      `${baseUrl}/rest/v1/airshow_events?select=slug,updated_at,published_at&published=eq.true&order=updated_at.desc`,
      {
        headers,
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      console.error(
        `Sitemap: nie udało się pobrać wydarzeń. HTTP ${response.status}.`
      );

      return [];
    }

    const data = (await response.json()) as SitemapEvent[];

    return data.filter(
      (event) =>
        typeof event.slug === "string" &&
        event.slug.length > 0 &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.slug)
    );
  } catch (error) {
    console.error("Sitemap: błąd pobierania wydarzeń:", error);
    return [];
  }
}

async function getPublishedShows(): Promise<SitemapShow[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const headers = getSupabaseHeaders();

  if (!baseUrl || !headers) {
    return [];
  }

  try {
    const response = await fetch(
      `${baseUrl}/rest/v1/air_shows?select=id,updated_at&published=eq.true&order=updated_at.desc`,
      {
        headers,
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      console.error(
        `Sitemap: nie udało się pobrać galerii pokazów. HTTP ${response.status}.`
      );

      return [];
    }

    const data = (await response.json()) as SitemapShow[];

    return data.filter(
      (show) =>
        typeof show.id === "string" &&
        show.id.length > 0
    );
  } catch (error) {
    console.error("Sitemap: błąd pobierania galerii pokazów:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date();

  const [events, shows] = await Promise.all([
    getPublishedEvents(),
    getPublishedShows(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/kalendarz`,
      lastModified: events.length > 0
        ? safeDate(events[0].updated_at, generatedAt)
        : generatedAt,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/gallery`,
      lastModified: shows.length > 0
        ? safeDate(shows[0].updated_at, generatedAt)
        : generatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/relacje`,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${SITE_URL}/airshow/${event.slug}`,
    lastModified: safeDate(
      event.updated_at || event.published_at,
      generatedAt
    ),
    changeFrequency: "daily",
    priority: 0.95,
  }));

  const showRoutes: MetadataRoute.Sitemap = shows.map((show) => ({
    url: `${SITE_URL}/pokaz/${encodeURIComponent(show.id)}`,
    lastModified: safeDate(show.updated_at, generatedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...eventRoutes,
    ...showRoutes,
  ];
}