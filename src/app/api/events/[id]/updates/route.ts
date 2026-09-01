import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  mapAirshowEventUpdate,
  type DbAirshowEventUpdate,
} from "@/lib/supabase/types";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "true";
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function sanitizeText(value: unknown, maxLength = 5000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function parseDate(value: unknown) {
  const raw = sanitizeText(value, 80);
  if (!raw) return null;

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  if (all && !isAdmin(req)) {
    return jsonError("Unauthorized", 401);
  }

  if (!all) {
    const { data: event, error: eventError } = await supabaseAdmin
      .from("airshow_events")
      .select("id")
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();

    if (eventError) {
      console.error("GET /api/events/[id]/updates — event check:", eventError);
      return jsonError(eventError.message, 500);
    }

    if (!event) {
      return jsonError("Nie znaleziono wydarzenia.", 404);
    }
  }

  const { data, error } = await supabaseAdmin
    .from("airshow_event_updates")
    .select("*")
    .eq("event_id", id)
    .order("published_at", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("GET /api/events/[id]/updates:", error);
    return jsonError(error.message, 500);
  }

  return NextResponse.json((data ?? []).map(item =>
    mapAirshowEventUpdate(item as DbAirshowEventUpdate)
  ));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return jsonError("Unauthorized", 401);
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("Nieprawidłowy JSON w treści żądania.", 400);
  }

  const title = sanitizeText(body.title, 180);
  if (!title) {
    return jsonError("Tytuł aktualizacji jest wymagany.", 400);
  }

  const publishedAtRaw = body.publishedAt === undefined
    ? new Date().toISOString()
    : parseDate(body.publishedAt);

  if (!publishedAtRaw) {
    return jsonError("Data aktualizacji jest nieprawidłowa.", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("airshow_event_updates")
    .insert({
      event_id: id,
      title,
      content: sanitizeText(body.content, 5000),
      published_at: publishedAtRaw,
      sort_order: Number.isInteger(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    })
    .select("*")
    .single();

  if (error) {
    console.error("POST /api/events/[id]/updates:", error);
    return jsonError(error.message, 500);
  }

  return NextResponse.json(mapAirshowEventUpdate(data as DbAirshowEventUpdate), { status: 201 });
}