import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airshow-gallery.vercel.app"
).replace(/\/$/, "");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface SitemapEvent {
  slug: string;
  updated_at: string | null;
  published_at: string | null;
}

interface SitemapShow {
  id: string;
  updated_at: string | null;
  created_at: string | null;
}

function getHeaders(): HeadersInit | null {
  if (!SUPABASE_ANON_KEY) {
    console.error("Sitemap: brak NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    return null;
  }

  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

function asValidDate(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function fetchJson<T>(path: string): Promise<T[]> {
  const headers = getHeaders();

  if (!SUPABASE_URL || !headers) {
    console.error(
      "Sitemap: brak NEXT_PUBLIC_SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return [];
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error(`Sitemap: Supabase zwrócił HTTP ${response.status}.`);
      return [];
    }

    return (await response.json()) as T[];
  } catch (error) {
    console.error("Sitemap: błąd pobierania danych:", error);
    return [];
  }
}

async function getPublishedEvents() {
  const events = await fetchJson<SitemapEvent>(
    "airshow_events?select=slug,updated_at,published_at&published=eq.true&order=updated_at.desc"
  );

  const seen = new Set<string>();

  return events.filter((event) => {
    const slug = event.slug?.trim();

    if (
      !slug ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      seen.has(slug)
    ) {
      return false;
    }

    seen.add(slug);
    return true;
  });
}

async function getPublishedShows() {
  return fetchJson<SitemapShow>(
    "air_shows?select=id,updated_at,created_at&published=eq.true&order=updated_at.desc"
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, shows] = await Promise.all([
    getPublishedEvents(),
    getPublishedShows(),
  ]);

  const routes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/kalendarz`,
      lastModified: asValidDate(events[0]?.updated_at),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  /*
   * Dodaj poniższe adresy wyłącznie wtedy, gdy są faktycznymi publicznymi
   * trasami zwracającymi HTTP 200:
   */
  routes.push(
    {
      url: `${SITE_URL}/gallery`,
      lastModified: asValidDate(shows[0]?.updated_at),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/relacje`,
      changeFrequency: "weekly",
      priority: 0.7,
    }
  );

  for (const event of events) {
    routes.push({
      url: `${SITE_URL}/airshow/${event.slug}`,
      lastModified:
        asValidDate(event.updated_at) ??
        asValidDate(event.published_at),
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  for (const show of shows) {
    if (!show.id) {
      continue;
    }

    routes.push({
      url: `${SITE_URL}/pokaz/${encodeURIComponent(show.id)}`,
      lastModified:
        asValidDate(show.updated_at) ??
        asValidDate(show.created_at),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return routes;
}