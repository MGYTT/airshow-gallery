import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "true";
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get("file")     as File | null;
  const showId   = (formData.get("showId")   as string) || "misc";
  const alt      = (formData.get("alt")      as string) ?? "";
  const aircraft = (formData.get("aircraft") as string) ?? "";
  const tagsRaw  = (formData.get("tags")     as string) ?? "";
  const tags     = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];
  const featured = formData.get("featured") === "true";
  const width    = parseInt((formData.get("width")  as string) ?? "0", 10) || 0;
  const height   = parseInt((formData.get("height") as string) ?? "0", 10) || 0;

  if (!file) return NextResponse.json({ error: "Brak pliku" }, { status: 400 });

  const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm", "video/quicktime"];
  if (!ACCEPTED.includes(file.type))
    return NextResponse.json({ error: "Nieobsługiwany format" }, { status: 400 });

  if (file.size > 100 * 1024 * 1024)
    return NextResponse.json({ error: "Plik za duży (max 100MB)" }, { status: 400 });

  const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${showId}/${crypto.randomUUID()}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  const { error: storageError } = await supabaseAdmin.storage
    .from("photos")
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (storageError)
    return NextResponse.json({ error: storageError.message }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from("photos")
    .getPublicUrl(fileName);

  const isImage = file.type.startsWith("image/");

  // Wstawiamy do bazy tylko zdjęcia (nie filmy)
  if (isImage) {
    const { error: dbError } = await supabaseAdmin
      .from("photos")
      .insert({ show_id: showId, src: publicUrl, alt, aircraft, tags, featured, width, height });
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, url: publicUrl }, { status: 201 });
}