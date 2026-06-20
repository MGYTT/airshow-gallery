import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  const showId   = formData.get("showId") as string;
  const alt      = formData.get("alt")      as string ?? "";
  const aircraft = formData.get("aircraft") as string ?? "";

  if (!file) return NextResponse.json({ error: "Brak pliku" }, { status: 400 });

  const ACCEPTED = ["image/jpeg","image/png","image/webp","image/avif"];
  if (!ACCEPTED.includes(file.type))
    return NextResponse.json({ error: "Nieobsługiwany format" }, { status: 400 });

  if (file.size > 20 * 1024 * 1024)
    return NextResponse.json({ error: "Plik za duży (max 20MB)" }, { status: 400 });

  // Unikalna nazwa pliku
  const ext      = file.name.split(".").pop() ?? "jpg";
  const fileName = `${showId}/${crypto.randomUUID()}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  // Upload do Supabase Storage
  const { error: storageError } = await supabaseAdmin.storage
    .from("photos")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (storageError)
    return NextResponse.json({ error: storageError.message }, { status: 500 });

  // Publiczny URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from("photos")
    .getPublicUrl(fileName);

  // Zapisz rekord w bazie
  const { data: photo, error: dbError } = await supabaseAdmin
    .from("photos")
    .insert({
      show_id:  showId,
      src:      publicUrl,
      alt,
      aircraft,
      width:    1200,
      height:   800,
    })
    .select().single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ success: true, photo }, { status: 201 });
}