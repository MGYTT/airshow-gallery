import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "true";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const showId = searchParams.get("show_id");
  const all    = searchParams.get("all") === "true";
  const admin  = isAdmin(req);

  const supabase = await createClient();

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

  if (!admin || !all) query = query.eq("published", true);
  if (showId) query = query.eq("show_id", showId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("stories")
    .insert({
      show_id:      body.show_id,
      title:        body.title,
      subtitle:     body.subtitle     ?? null,
      cover_image:  body.cover_image  ?? null,
      accent_color: body.accent_color ?? "#cc1f1f",
      published:    body.published    ?? false,
      sort_order:   body.sort_order   ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}