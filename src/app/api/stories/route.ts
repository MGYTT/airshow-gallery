import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const showId   = searchParams.get("show_id");
  const all      = searchParams.get("all") === "true";
  const isAdmin  = req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;

  let query = supabase
    .from("stories")
    .select(`
      id, show_id, title, subtitle, cover_image,
      accent_color, published, sort_order, views, created_at,
      story_frames (
        id, story_id, type, image_src, image_alt,
        caption, subcaption, aircraft, timestamp_label,
        stat_value, stat_label, fact_text,
        sort_order, duration
      )
    `)
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "story_frames" });

  // Publiczny dostęp — tylko opublikowane
  if (!isAdmin || !all) query = query.eq("published", true);
  if (showId) query = query.eq("show_id", showId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const isAdmin = req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("stories")
    .insert({
      show_id:      body.show_id,
      title:        body.title,
      subtitle:     body.subtitle     ?? null,
      cover_image:  body.cover_image  ?? null,
      accent_color: body.accent_color ?? "#01696f",
      published:    body.published    ?? false,
      sort_order:   body.sort_order   ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}