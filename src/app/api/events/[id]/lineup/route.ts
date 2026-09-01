import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  type AirshowLineupCategory,
  type AirshowLineupStatus,
  mapAirshowEventLineup,
  type DbAirshowEventLineup,
} from "@/lib/supabase/types";

const CATEGORIES: AirshowLineupCategory[] = [
  "flying_display",
  "static_display",
  "team",
  "ground_demo",
  "other",
];

const STATUSES: AirshowLineupStatus[] = [
  "confirmed",
  "expected",
  "unconfirmed",
  "cancelled",
];

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "true";
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function sanitizeText(value: unknown, maxLength = 5000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isValidHttpUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeTime(value: unknown) {
  const time = sanitizeText(value, 8);
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time) ? time : null;
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
      console.error("GET /api/events/[id]/lineup — event check:", eventError);
      return jsonError(eventError.message, 500);
    }

    if (!event) {
      return jsonError("Nie znaleziono wydarzenia.", 404);
    }
  }

  const { data, error } = await supabaseAdmin
    .from("airshow_event_lineup")
    .select("*")
    .eq("event_id", id)
    .order("sort_order", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("GET /api/events/[id]/lineup:", error);
    return jsonError(error.message, 500);
  }

  return NextResponse.json((data ?? []).map(item =>
    mapAirshowEventLineup(item as DbAirshowEventLineup)
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
    return jsonError("Nazwa pozycji programu jest wymagana.", 400);
  }

  const category = CATEGORIES.includes(body.category as AirshowLineupCategory)
    ? body.category as AirshowLineupCategory
    : "flying_display";

  const status = STATUSES.includes(body.status as AirshowLineupStatus)
    ? body.status as AirshowLineupStatus
    : "unconfirmed";

  const sourceUrl = sanitizeText(body.sourceUrl, 2048);
  if (sourceUrl && !isValidHttpUrl(sourceUrl)) {
    return jsonError("Adres źródła jest nieprawidłowy.", 400);
  }

  const startTime = body.startTime === "" || body.startTime === null
    ? null
    : normalizeTime(body.startTime);

  const endTime = body.endTime === "" || body.endTime === null
    ? null
    : normalizeTime(body.endTime);

  if (body.startTime && !startTime) {
    return jsonError("Godzina rozpoczęcia ma nieprawidłowy format.", 400);
  }

  if (body.endTime && !endTime) {
    return jsonError("Godzina zakończenia ma nieprawidłowy format.", 400);
  }

  if (startTime && endTime && endTime < startTime) {
    return jsonError("Godzina zakończenia nie może być wcześniejsza.", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("airshow_event_lineup")
    .insert({
      event_id: id,
      title,
      description: sanitizeText(body.description, 3000),
      category,
      status,
      country: sanitizeText(body.country, 100),
      start_time: startTime,
      end_time: endTime,
      source_url: sourceUrl,
      sort_order: Number.isInteger(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    })
    .select("*")
    .single();

  if (error) {
    console.error("POST /api/events/[id]/lineup:", error);
    return jsonError(error.message, 500);
  }

  return NextResponse.json(mapAirshowEventLineup(data as DbAirshowEventLineup), { status: 201 });
}