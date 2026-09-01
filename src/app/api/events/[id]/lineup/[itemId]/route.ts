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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  if (!isAdmin(req)) {
    return jsonError("Unauthorized", 401);
  }

  const { id, itemId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("Nieprawidłowy JSON w treści żądania.", 400);
  }

  const update: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = sanitizeText(body.title, 180);
    if (!title) return jsonError("Nazwa pozycji programu nie może być pusta.", 400);
    update.title = title;
  }

  if (body.description !== undefined) {
    update.description = sanitizeText(body.description, 3000);
  }

  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category as AirshowLineupCategory)) {
      return jsonError("Nieprawidłowa kategoria programu.", 400);
    }
    update.category = body.category;
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as AirshowLineupStatus)) {
      return jsonError("Nieprawidłowy status pozycji programu.", 400);
    }
    update.status = body.status;
  }

  if (body.country !== undefined) {
    update.country = sanitizeText(body.country, 100);
  }

  if (body.sourceUrl !== undefined) {
    const sourceUrl = sanitizeText(body.sourceUrl, 2048);
    if (sourceUrl && !isValidHttpUrl(sourceUrl)) {
      return jsonError("Adres źródła jest nieprawidłowy.", 400);
    }
    update.source_url = sourceUrl;
  }

  if (body.startTime !== undefined) {
    if (body.startTime === null || body.startTime === "") {
      update.start_time = null;
    } else {
      const startTime = normalizeTime(body.startTime);
      if (!startTime) return jsonError("Godzina rozpoczęcia ma nieprawidłowy format.", 400);
      update.start_time = startTime;
    }
  }

  if (body.endTime !== undefined) {
    if (body.endTime === null || body.endTime === "") {
      update.end_time = null;
    } else {
      const endTime = normalizeTime(body.endTime);
      if (!endTime) return jsonError("Godzina zakończenia ma nieprawidłowy format.", 400);
      update.end_time = endTime;
    }
  }

  if (body.sortOrder !== undefined) {
    const sortOrder = Number(body.sortOrder);
    if (!Number.isInteger(sortOrder)) {
      return jsonError("Kolejność musi być liczbą całkowitą.", 400);
    }
    update.sort_order = sortOrder;
  }

  if (Object.keys(update).length === 0) {
    return jsonError("Nie przesłano żadnych danych do aktualizacji.", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("airshow_event_lineup")
    .update(update)
    .eq("id", itemId)
    .eq("event_id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("PATCH /api/events/[id]/lineup/[itemId]:", error);
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Nie znaleziono pozycji programu.", 404);
  }

  return NextResponse.json(
    mapAirshowEventLineup(data as DbAirshowEventLineup)
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  if (!isAdmin(req)) {
    return jsonError("Unauthorized", 401);
  }

  const { id, itemId } = await params;

  const { error } = await supabaseAdmin
    .from("airshow_event_lineup")
    .delete()
    .eq("id", itemId)
    .eq("event_id", id);

  if (error) {
    console.error("DELETE /api/events/[id]/lineup/[itemId]:", error);
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ success: true });
}