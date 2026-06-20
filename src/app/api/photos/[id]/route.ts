import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Pobierz src żeby usunąć plik ze Storage
  const { data: photo } = await supabaseAdmin
    .from("photos").select("src").eq("id", id).single();

  if (photo?.src?.includes("supabase")) {
    const path = photo.src.split("/photos/")[1];
    if (path) await supabaseAdmin.storage.from("photos").remove([path]);
  }

  const { error } = await supabaseAdmin.from("photos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}