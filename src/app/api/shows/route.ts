import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapShow } from "@/lib/supabase/types";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

// GET /api/shows — publiczne
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true"; // admin może pobrać ukryte

  let query = supabaseAdmin
    .from("air_shows")
    .select("*")
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  if (!all) query = query.eq("published", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data?.map(mapShow) ?? []);
}

// POST /api/shows — tylko admin
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("air_shows")
    .insert({
      id:          body.id,
      name:        body.name,
      location:    body.location,
      date:        body.date,
      year:        body.year,
      description: body.description ?? "",
      cover_image: body.coverImage ?? "",
      tags:        body.tags ?? [],
      featured:    body.featured ?? false,
      published:   body.published ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapShow(data), { status: 201 });
}