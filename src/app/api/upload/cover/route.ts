import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isAdmin(req: NextRequest) {
  return (
    req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET ||
    req.cookies.get("admin_session")?.value === "true"
  );
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Brak pliku" }, { status: 400 });

  const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!ACCEPTED.includes(file.type))
    return NextResponse.json({ error: "Tylko JPG, PNG, WebP, AVIF" }, { status: 400 });

  if (file.size > 20 * 1024 * 1024)
    return NextResponse.json({ error: "Plik za duży (max 20 MB)" }, { status: 400 });

  const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `covers/${crypto.randomUUID()}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  const { error: storageError } = await supabaseAdmin.storage
    .from("photos")            // ten sam bucket co zdjęcia
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (storageError)
    return NextResponse.json({ error: storageError.message }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from("photos")
    .getPublicUrl(fileName);

  return NextResponse.json({ success: true, url: publicUrl }, { status: 201 });
}