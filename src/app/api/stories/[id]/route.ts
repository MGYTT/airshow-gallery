import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  // GET — anon client, RLS pozwala czytać opublikowane
  const supabase = await createClient();

  const { data, error } = await supabase
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
    .eq("id", id)
    .order("sort_order", { ascending: true, referencedTable: "story_frames" })
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const isAdmin = req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // PATCH — service role
  const { data, error } = await supabaseAdmin
    .from("stories")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const isAdmin = req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // DELETE — service role
  const { error } = await supabaseAdmin
    .from("stories")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}