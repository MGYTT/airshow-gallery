import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get("file")     as File | null;
  const showId   = formData.get("showId")   as string;
  const alt      = formData.get("alt")      as string ?? "";
  const aircraft = formData.get("aircraft") as string ?? "";
  const tagsRaw  = formData.get("tags")     as string ?? "";
  const tags     = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];
  const featured = formData.get("featured") === "true";
  // ✅ NOWE: pobierz rzeczywiste wymiary przesłane z klienta
  const width    = parseInt(formData.get("width")  as string ?? "0", 10) || 0;
  const height   = parseInt(formData.get("height") as string ?? "0", 10) || 0;

  if (!file) return NextResponse.json({ error: "Brak pliku" }, { status: 400 });

  const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!ACCEPTED.includes(file.type))
    return NextResponse.json({ error: "Nieobsługiwany format" }, { status: 400 });

  if (file.size > 20 * 1024 * 1024)
    return NextResponse.json({ error: "Plik za duży (max 20MB)" }, { status: 400 });

  const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${showId}/${crypto.randomUUID()}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  const { error: storageError } = await supabaseAdmin.storage
    .from("photos")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
      // ✅ Brak transformacji = oryginał trafia do Storage bez utraty jakości
    });

  if (storageError)
    return NextResponse.json({ error: storageError.message }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from("photos")
    .getPublicUrl(fileName);
  // ✅ getPublicUrl BEZ opcji transform — serwuje oryginał

  const { data: photo, error: dbError } = await supabaseAdmin
    .from("photos")
    .insert({
      show_id:  showId,
      src:      publicUrl,
      alt,
      aircraft,
      tags,
      featured,
      width,   // ✅ rzeczywiste wymiary z klienta
      height,  // ✅ rzeczywiste wymiary z klienta
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ success: true, photo }, { status: 201 });
}