import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  mapAirshowEvent,
  type DbAirshowEvent,
} from "@/lib/supabase/types";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 90);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params;
  const slug = sanitizeSlug(rawSlug);

  if (!slug) {
    return jsonError("Nieprawidłowy adres wydarzenia.", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("airshow_events")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("GET /api/events/by-slug/[slug] — błąd Supabase:", error);
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Nie znaleziono wydarzenia.", 404);
  }

  return NextResponse.json(
    mapAirshowEvent(data as DbAirshowEvent)
  );
}