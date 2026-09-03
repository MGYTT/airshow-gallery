import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  mapBlogPost,
  type BlogCategory,
  type DbBlogPost,
} from "@/lib/blog/types";

const VALID_CATEGORIES: BlogCategory[] = [
  "aktualnosci",
  "relacje",
  "poradniki-fotograficzne",
  "przewodniki",
  "sprzet",
];

function isAdmin(request: NextRequest) {
  return request.cookies.get("admin_session")?.value === "true";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź|ż/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function normalizeString(value: unknown, maxLength = 5000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const tags = value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .slice(0, 12);

  return [...new Set(tags)];
}

function normalizeCategory(value: unknown): BlogCategory {
  return VALID_CATEGORIES.includes(value as BlogCategory)
    ? (value as BlogCategory)
    : "aktualnosci";
}

function normalizeRelatedShowId(value: unknown) {
  const showId = normalizeString(value, 120);
  return showId || null;
}

function normalizeRelatedEventId(value: unknown) {
  const eventId = normalizeString(value, 120);
  return eventId || null;
}

function revalidateBlogPages(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");

  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}

async function findAvailableSlug(baseSlug: string): Promise<string> {
  const base = baseSlug || `wpis-${Date.now()}`;

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("slug")
    .like("slug", `${base}%`);

  if (error) {
    return `${base}-${Date.now()}`;
  }

  const taken = new Set(
    (data ?? [])
      .map((post) => post.slug as string)
      .filter(Boolean)
  );

  if (!taken.has(base)) {
    return base;
  }

  let suffix = 2;

  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";

  if (all && !isAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let query = supabaseAdmin
    .from("blog_posts")
    .select("*")
    .order("published", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (!all) {
    query = query.eq("published", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("GET /api/blog — błąd Supabase:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    ((data ?? []) as DbBlogPost[]).map(mapBlogPost)
  );
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowy JSON w treści żądania." },
      { status: 400 }
    );
  }

  const title = normalizeString(body.title, 180);
  const excerpt = normalizeString(body.excerpt, 350);
  const content = normalizeString(body.content, 50000);
  const requestedSlug = slugify(normalizeString(body.slug, 120));
  const published = Boolean(body.published);

  if (!title) {
    return NextResponse.json(
      { error: "Pole „title” jest wymagane." },
      { status: 400 }
    );
  }

  if (!excerpt) {
    return NextResponse.json(
      { error: "Pole „excerpt” jest wymagane." },
      { status: 400 }
    );
  }

  if (!content) {
    return NextResponse.json(
      { error: "Pole „content” jest wymagane." },
      { status: 400 }
    );
  }

  const baseSlug = requestedSlug || slugify(title);

  if (!baseSlug) {
    return NextResponse.json(
      { error: "Nie udało się wygenerować poprawnego sluga." },
      { status: 400 }
    );
  }

  const insertPayload = {
    slug: await findAvailableSlug(baseSlug),
    title,
    excerpt,
    content,
    cover_image: normalizeString(body.coverImage, 2000),
    cover_image_alt: normalizeString(body.coverImageAlt, 250),
    category: normalizeCategory(body.category),
    tags: normalizeTags(body.tags),
    author_name: normalizeString(body.authorName, 100) || "MGYT",
    related_show_id: normalizeRelatedShowId(body.relatedShowId),
    related_event_id: normalizeRelatedEventId(body.relatedEventId),
    published,
    published_at: published ? new Date().toISOString() : null,
  };

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    console.error("POST /api/blog — błąd Supabase:", error);

    if (error.code === "23503") {
      return NextResponse.json(
        {
          error:
            "Wybrana galeria lub wydarzenie nie istnieje. Odśwież panel i wybierz poprawne powiązanie.",
        },
        { status: 400 }
      );
    }

    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ten slug jest już używany przez inny wpis." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 500 }
    );
  }

  /*
   * Odświeża indeks bloga, nową stronę artykułu oraz dynamiczną sitemapę.
   * Działa niezależnie od tego, czy wpis zapisano jako szkic, czy opublikowano.
   */
  revalidateBlogPages(data.slug);

  return NextResponse.json(
    mapBlogPost(data as DbBlogPost),
    { status: 201 }
  );
}