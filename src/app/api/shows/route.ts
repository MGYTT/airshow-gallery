import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapShow } from "@/lib/supabase/types";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "true";
}

function slugify(name: string) {
  return name.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e")
    .replace(/ł/g,"l").replace(/ń/g,"n").replace(/ó/g,"o")
    .replace(/ś/g,"s").replace(/ź|ż/g,"z")
    .replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"").slice(0,40);
}

// Znajduje pierwszy wolny slug: "radom-2026", "radom-2026-2", "radom-2026-3"...
async function findAvailableId(baseSlug: string): Promise<string> {
  const base = baseSlug || `show-${Date.now()}`;
  const { data: existing, error } = await supabaseAdmin
    .from("air_shows")
    .select("id")
    .like("id", `${base}%`);

  if (error) {
    // Jeśli sprawdzenie się nie uda — wracamy do bezpiecznego unikalnego ID
    return `${base}-${Date.now()}`;
  }

  const taken = new Set((existing ?? []).map(r => r.id as string));
  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  if (all && !isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabaseAdmin
    .from("air_shows")
    .select("*")
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  if (!all) query = query.eq("published", true);

  const { data, error } = await query;
  if (error) {
    console.error("GET /api/shows — błąd Supabase:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data?.map(mapShow) ?? []);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON w treści żądania" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const year = Number(body.year);

  if (!name) {
    return NextResponse.json({ error: "Pole 'name' jest wymagane" }, { status: 400 });
  }
  if (!location) {
    return NextResponse.json({ error: "Pole 'location' jest wymagane" }, { status: 400 });
  }
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    return NextResponse.json({ error: "Pole 'year' musi być poprawnym rokiem" }, { status: 400 });
  }

  const dateValue = typeof body.date === "string" && body.date.trim() !== "" ? body.date.trim() : null;

  // Bazowy slug: ignorujemy ewentualne "id" z frontendu i budujemy go od zera
  // z nazwy + roku, żeby dwa pokazy o tej samej nazwie w różnych latach
  // nie kolidowały (np. "radom-air-show-2025" vs "radom-air-show-2026").
  const baseSlug = slugify(`${name}-${year}`) || slugify(name) || `show-${Date.now()}`;

  const insertPayload = {
    name,
    location,
    date:        dateValue,
    year,
    description: typeof body.description === "string" ? body.description : "",
    cover_image: typeof body.coverImage === "string" ? body.coverImage : "",
    tags:        Array.isArray(body.tags) ? body.tags : [],
    featured:    Boolean(body.featured),
    published:   body.published !== false,
  };

  // Do 3 prób: znajdź wolny slug → wstaw. Jeśli mimo to zderzymy się z race
  // condition (23505 = unique_violation), próbujemy ponownie z nowym sufiksem.
  const MAX_ATTEMPTS = 3;
  let lastError: { message: string; code?: string } | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const id = await findAvailableId(baseSlug);

    const { data, error } = await supabaseAdmin
      .from("air_shows")
      .insert({ id, ...insertPayload })
      .select()
      .single();

    if (!error) {
      return NextResponse.json(mapShow(data), { status: 201 });
    }

    lastError = error;

    // 23505 = duplicate key — inny request zdążył wziąć ten slug w tej samej milisekundzie.
    // Spróbuj jeszcze raz z nowym sprawdzeniem dostępności.
    if (error.code !== "23505") {
      console.error("POST /api/shows — błąd Supabase:", error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }
  }

  console.error("POST /api/shows — wyczerpano próby unikalnego ID:", lastError);
  return NextResponse.json(
    { error: "Nie udało się wygenerować unikalnego identyfikatora pokazu. Spróbuj ponownie." },
    { status: 409 }
  );
}