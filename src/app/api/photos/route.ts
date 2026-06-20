import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapPhoto } from "@/lib/supabase/types";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const showId = searchParams.get("showId");

  let query = supabaseAdmin
    .from("photos").select("*").order("created_at", { ascending: false });
  if (showId) query = query.eq("show_id", showId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data?.map(mapPhoto) ?? []);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("photos")
    .insert({
      show_id:  body.showId,
      src:      body.src,
      alt:      body.alt      ?? "",
      aircraft: body.aircraft ?? "",
      width:    body.width    ?? 1200,
      height:   body.height   ?? 800,
      tags:     body.tags     ?? [],
      featured: body.featured ?? false,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapPhoto(data), { status: 201 });
}