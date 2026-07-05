import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapShow } from "@/lib/supabase/types";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "true";
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

  const insertPayload: Record<string, unknown> = {
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

  if (typeof body.id === "string" && body.id.trim() !== "") {
    insertPayload.id = body.id.trim();
  }

  const { data, error } = await supabaseAdmin
    .from("air_shows")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("POST /api/shows — błąd Supabase:", error);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json(mapShow(data), { status: 201 });
}