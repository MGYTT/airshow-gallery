// src/app/api/photos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "true";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON w treści żądania" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.featured  !== undefined) update.featured  = body.featured;
  if (body.alt       !== undefined) update.alt       = body.alt;
  if (body.aircraft  !== undefined) update.aircraft  = body.aircraft;
  if (body.tags      !== undefined) update.tags      = body.tags;

  const { data, error } = await supabaseAdmin
    .from("photos")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("PATCH /api/photos/[id] — błąd Supabase:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: photo, error: fetchErr } = await supabaseAdmin
    .from("photos").select("src").eq("id", id).single();

  if (fetchErr && fetchErr.code !== "PGRST116")
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  if (photo?.src?.includes("supabase")) {
    const parts    = photo.src.split("/object/public/photos/");
    const filePath = parts[1] ? decodeURIComponent(parts[1].split("?")[0]) : null;
    if (filePath) {
      const { error: storageErr } = await supabaseAdmin.storage.from("photos").remove([filePath]);
      if (storageErr) console.error("Storage delete:", storageErr.message);
    }
  }

  const { error } = await supabaseAdmin.from("photos").delete().eq("id", id);
  if (error) {
    console.error("DELETE /api/photos/[id] — błąd Supabase:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}