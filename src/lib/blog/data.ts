import { cache } from "react";
import {
  mapBlogPost,
  type BlogPost,
  type DbBlogPost,
} from "@/lib/blog/types";

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const REVALIDATE_SECONDS = 300;

function getSupabaseHeaders(): Record<string, string> | null {
  if (!BASE || !API_KEY) {
    console.error(
      "Blog: brak NEXT_PUBLIC_SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );

    return null;
  }

  return {
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
  };
}

export const getPublishedBlogPosts = cache(
  async (): Promise<BlogPost[]> => {
    const headers = getSupabaseHeaders();

    if (!BASE || !headers) {
      return [];
    }

    try {
      const response = await fetch(
        `${BASE}/rest/v1/blog_posts?select=*&published=eq.true&order=published_at.desc.nullslast,updated_at.desc`,
        {
          headers,
          next: { revalidate: REVALIDATE_SECONDS },
        }
      );

      if (!response.ok) {
        console.error(
          `Blog: nie udało się pobrać wpisów. HTTP ${response.status}.`
        );

        return [];
      }

      const data = (await response.json()) as DbBlogPost[];

      return data.map(mapBlogPost);
    } catch (error) {
      console.error("Blog: błąd pobierania wpisów:", error);
      return [];
    }
  }
);

export const getPublishedBlogPostBySlug = cache(
  async (slug: string): Promise<BlogPost | null> => {
    const headers = getSupabaseHeaders();

    if (!BASE || !headers || !slug) {
      return null;
    }

    try {
      const response = await fetch(
        `${BASE}/rest/v1/blog_posts?select=*&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`,
        {
          headers,
          next: { revalidate: REVALIDATE_SECONDS },
        }
      );

      if (!response.ok) {
        console.error(
          `Blog: nie udało się pobrać wpisu "${slug}". HTTP ${response.status}.`
        );

        return null;
      }

      const data = (await response.json()) as DbBlogPost[];

      return data[0] ? mapBlogPost(data[0]) : null;
    } catch (error) {
      console.error(`Blog: błąd pobierania wpisu "${slug}":`, error);
      return null;
    }
  }
);

export const getPublishedBlogSlugs = cache(async (): Promise<string[]> => {
  const headers = getSupabaseHeaders();

  if (!BASE || !headers) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE}/rest/v1/blog_posts?select=slug&published=eq.true`,
      {
        headers,
        next: { revalidate: REVALIDATE_SECONDS },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as Array<{ slug: string }>;

    return data
      .map((post) => post.slug)
      .filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug));
  } catch (error) {
    console.error("Blog: błąd pobierania slugów:", error);
    return [];
  }
});