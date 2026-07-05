import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapShow } from "@/lib/supabase/types";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "true";
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("air_shows").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mapShow(data));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON w treści żądania" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.name        !== undefined) update.name        = body.name;
  if (body.location    !== undefined) update.location    = body.location;
  if (body.date        !== undefined) update.date        = typeof body.date === "string" && body.date.trim() !== "" ? body.date.trim() : null;
  if (body.year        !== undefined) update.year        = body.year;
  if (body.description !== undefined) update.description = body.description;
  if (body.coverImage  !== undefined) update.cover_image = body.coverImage;
  if (body.tags        !== undefined) update.tags        = body.tags;
  if (body.featured    !== undefined) update.featured    = body.featured;
  if (body.published   !== undefined) update.published   = body.published;

  const { data, error } = await supabaseAdmin
    .from("air_shows").update(update).eq("id", id).select().single();
  if (error) {
    console.error("PATCH /api/shows/[id] — błąd Supabase:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(mapShow(data));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabaseAdmin.from("air_shows").delete().eq("id", id);
  if (error) {
    console.error("DELETE /api/shows/[id] — błąd Supabase:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}