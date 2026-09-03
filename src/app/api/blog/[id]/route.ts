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

  return [
    ...new Set(
      value
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().replace(/\s+/g, " "))
        .filter(Boolean)
        .slice(0, 12)
    ),
  ];
}

function normalizeCategory(value: unknown): BlogCategory {
  return VALID_CATEGORIES.includes(value as BlogCategory)
    ? (value as BlogCategory)
    : "aktualnosci";
}

function revalidateBlogPages(...slugs: Array<string | null | undefined>) {
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");

  const uniqueSlugs = new Set(
    slugs
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => slug.trim())
      .filter(Boolean)
  );

  for (const slug of uniqueSlugs) {
    revalidatePath(`/blog/${slug}`);
  }
}

async function isSlugTakenByAnotherPost(slug: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .limit(1);

  if (error) {
    throw error;
  }

  return Boolean(data?.[0]);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("GET /api/blog/[id] — błąd Supabase:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(mapBlogPost(data as DbBlogPost));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowy JSON w treści żądania." },
      { status: 400 }
    );
  }

  const { data: currentPost, error: currentPostError } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentPostError) {
    console.error(
      "PATCH /api/blog/[id] — błąd odczytu bieżącego wpisu:",
      currentPostError
    );

    return NextResponse.json(
      { error: currentPostError.message },
      { status: 500 }
    );
  }

  if (!currentPost) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  const oldSlug = currentPost.slug as string;
  const update: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = normalizeString(body.title, 180);

    if (!title) {
      return NextResponse.json(
        { error: "Pole „title” nie może być puste." },
        { status: 400 }
      );
    }

    update.title = title;
  }

  if (body.excerpt !== undefined) {
    const excerpt = normalizeString(body.excerpt, 350);

    if (!excerpt) {
      return NextResponse.json(
        { error: "Pole „excerpt” nie może być puste." },
        { status: 400 }
      );
    }

    update.excerpt = excerpt;
  }

  if (body.content !== undefined) {
    const content = normalizeString(body.content, 50000);

    if (!content) {
      return NextResponse.json(
        { error: "Pole „content” nie może być puste." },
        { status: 400 }
      );
    }

    update.content = content;
  }

  if (body.slug !== undefined) {
    const slug = slugify(normalizeString(body.slug, 120));

    if (!slug) {
      return NextResponse.json(
        { error: "Slug jest nieprawidłowy." },
        { status: 400 }
      );
    }

    try {
      const taken = await isSlugTakenByAnotherPost(slug, id);

      if (taken) {
        return NextResponse.json(
          { error: "Ten slug jest już używany przez inny wpis." },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error(
        "PATCH /api/blog/[id] — błąd sprawdzania unikalności sluga:",
        error
      );

      return NextResponse.json(
        { error: "Nie udało się sprawdzić unikalności sluga." },
        { status: 500 }
      );
    }

    update.slug = slug;
  }

  if (body.coverImage !== undefined) {
    update.cover_image = normalizeString(body.coverImage, 2000);
  }

  if (body.coverImageAlt !== undefined) {
    update.cover_image_alt = normalizeString(body.coverImageAlt, 250);
  }

  if (body.category !== undefined) {
    update.category = normalizeCategory(body.category);
  }

  if (body.tags !== undefined) {
    update.tags = normalizeTags(body.tags);
  }

  if (body.authorName !== undefined) {
    update.author_name =
      normalizeString(body.authorName, 100) || "MGYT";
  }

  if (body.relatedShowId !== undefined) {
    update.related_show_id =
      normalizeString(body.relatedShowId, 120) || null;
  }

  if (body.relatedEventId !== undefined) {
    update.related_event_id =
      normalizeString(body.relatedEventId, 120) || null;
  }

  if (body.published !== undefined) {
    const shouldBePublished = Boolean(body.published);
    const wasPublished = Boolean(currentPost.published);

    update.published = shouldBePublished;

    /*
     * Pierwsza publikacja otrzymuje datę publikacji.
     * Po ukryciu i ponownym opublikowaniu zachowujemy jej pierwotną datę.
     */
    if (shouldBePublished && !wasPublished && !currentPost.published_at) {
      update.published_at = new Date().toISOString();
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Nie przekazano pól do aktualizacji." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("PATCH /api/blog/[id] — błąd Supabase:", error);

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
   * Odświeżamy:
   * - indeks /blog;
   * - nowy adres wpisu;
   * - stary adres, gdy slug został zmieniony;
   * - /sitemap.xml.
   */
  revalidateBlogPages(oldSlug, data.slug);

  return NextResponse.json(mapBlogPost(data as DbBlogPost));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  /*
   * Najpierw odczytujemy slug, aby po usunięciu odświeżyć dokładnie
   * stronę starego artykułu oraz nie pozostawić jej w cache.
   */
  const { data: currentPost, error: currentPostError } = await supabaseAdmin
    .from("blog_posts")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  if (currentPostError) {
    console.error(
      "DELETE /api/blog/[id] — błąd pobierania wpisu:",
      currentPostError
    );

    return NextResponse.json(
      { error: currentPostError.message },
      { status: 500 }
    );
  }

  if (!currentPost) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  const deletedSlug = currentPost.slug as string;

  const { error } = await supabaseAdmin
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("DELETE /api/blog/[id] — błąd Supabase:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  revalidateBlogPages(deletedSlug);

  return NextResponse.json({ success: true });
}