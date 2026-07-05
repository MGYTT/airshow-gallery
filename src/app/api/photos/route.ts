import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapPhoto } from "@/lib/supabase/types";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "true";
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON w treści żądania" }, { status: 400 });
  }

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

  if (error) {
    console.error("POST /api/photos — błąd Supabase:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(mapPhoto(data), { status: 201 });
}