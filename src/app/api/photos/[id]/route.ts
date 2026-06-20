import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Pobierz src zanim usuniemy rekord
  const { data: photo, error: fetchErr } = await supabaseAdmin
    .from("photos")
    .select("src")
    .eq("id", id)
    .single();

  if (fetchErr && fetchErr.code !== "PGRST116")
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  // Usuń plik ze Storage jeśli hosted na Supabase
  if (photo?.src?.includes("supabase")) {
    const parts = photo.src.split("/object/public/photos/");
    const filePath = parts[1] ? decodeURIComponent(parts[1].split("?")[0]) : null;
    if (filePath) {
      const { error: storageErr } = await supabaseAdmin.storage
        .from("photos")
        .remove([filePath]);
      if (storageErr) console.error("Storage delete:", storageErr.message);
    }
  }

  // Usuń rekord z bazy
  const { error } = await supabaseAdmin.from("photos").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}