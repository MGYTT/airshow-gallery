import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airshow-gallery.vercel.app"
).replace(/\/$/, "");

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const revalidate = 300;

interface SitemapShow {
  id: string;
  updated_at: string | null;
  created_at: string | null;
}

interface SitemapEvent {
  slug: string;
  updated_at: string | null;
  published_at: string | null;
}

interface SitemapPost {
  slug: string;
  updated_at: string | null;
  published_at: string | null;
  created_at: string | null;
}

function getSupabaseHeaders(): HeadersInit | null {
  if (!BASE || !API_KEY) {
    console.error(
      "Sitemap: brak NEXT_PUBLIC_SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );

    return null;
  }

  return {
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
  };
}

function toValidDate(value: string | null | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isValidSlug(value: string | null | undefined) {
  return Boolean(value && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value));
}

function isValidId(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

async function fetchSupabaseRows<T>(path: string): Promise<T[]> {
  const headers = getSupabaseHeaders();

  if (!BASE || !headers) {
    return [];
  }

  try {
    const response = await fetch(`${BASE}/rest/v1/${path}`, {
      headers,
      next: { revalidate },
    });

    if (!response.ok) {
      console.error(
        `Sitemap: Supabase zwrócił HTTP ${response.status} dla ${path}.`
      );

      return [];
    }

    return (await response.json()) as T[];
  } catch (error) {
    console.error(`Sitemap: błąd pobierania ${path}:`, error);
    return [];
  }
}

async function getPublishedShows() {
  const shows = await fetchSupabaseRows<SitemapShow>(
    "air_shows?select=id,updated_at,created_at&published=eq.true&order=updated_at.desc"
  );

  const seen = new Set<string>();

  return shows.filter((show) => {
    const id = show.id?.trim();

    if (!isValidId(id) || seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

async function getPublishedEvents() {
  const events = await fetchSupabaseRows<SitemapEvent>(
    "airshow_events?select=slug,updated_at,published_at&published=eq.true&order=updated_at.desc"
  );

  const seen = new Set<string>();

  return events.filter((event) => {
    const slug = event.slug?.trim();

    if (!isValidSlug(slug) || seen.has(slug)) {
      return false;
    }

    seen.add(slug);
    return true;
  });
}

async function getPublishedBlogPosts() {
  const posts = await fetchSupabaseRows<SitemapPost>(
    "blog_posts?select=slug,updated_at,published_at,created_at&published=eq.true&order=published_at.desc.nullslast,updated_at.desc"
  );

  const seen = new Set<string>();

  return posts.filter((post) => {
    const slug = post.slug?.trim();

    if (!isValidSlug(slug) || seen.has(slug)) {
      return false;
    }

    seen.add(slug);
    return true;
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [shows, events, blogPosts] = await Promise.all([
    getPublishedShows(),
    getPublishedEvents(),
    getPublishedBlogPosts(),
  ]);

  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/gallery`,
      lastModified: toValidDate(shows[0]?.updated_at),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/kalendarz`,
      lastModified: toValidDate(events[0]?.updated_at),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified:
        toValidDate(blogPosts[0]?.updated_at) ??
        toValidDate(blogPosts[0]?.published_at) ??
        toValidDate(blogPosts[0]?.created_at),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  for (const show of shows) {
    sitemapEntries.push({
      url: `${SITE_URL}/pokaz/${encodeURIComponent(show.id)}`,
      lastModified:
        toValidDate(show.updated_at) ??
        toValidDate(show.created_at),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const event of events) {
    sitemapEntries.push({
      url: `${SITE_URL}/airshow/${event.slug}`,
      lastModified:
        toValidDate(event.updated_at) ??
        toValidDate(event.published_at),
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  for (const post of blogPosts) {
    sitemapEntries.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified:
        toValidDate(post.updated_at) ??
        toValidDate(post.published_at) ??
        toValidDate(post.created_at),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return sitemapEntries;
}