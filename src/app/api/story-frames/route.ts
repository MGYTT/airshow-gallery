import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "true";
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const frames = Array.isArray(body) ? body : [body];

  const { data, error } = await supabaseAdmin
    .from("story_frames")
    .insert(
      frames.map((f, i) => ({
        story_id:        f.story_id,
        type:            f.type            ?? "photo",
        image_src:       f.image_src       ?? null,
        image_alt:       f.image_alt       ?? null,
        caption:         f.caption         ?? null,
        subcaption:      f.subcaption      ?? null,
        aircraft:        f.aircraft        ?? null,
        timestamp_label: f.timestamp_label ?? null,
        stat_value:      f.stat_value      ?? null,
        stat_label:      f.stat_label      ?? null,
        fact_text:       f.fact_text       ?? null,
        sort_order:      f.sort_order      ?? i,
        duration:        f.duration        ?? 5,
      }))
    )
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}