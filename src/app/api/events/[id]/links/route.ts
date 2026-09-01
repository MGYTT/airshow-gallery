import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  mapAirshowEventShowLink,
  type DbAirshowEventShowLink,
} from "@/lib/supabase/types";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "true";
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function sanitizeText(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
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
      console.error("GET /api/events/[id]/links — event check:", eventError);
      return jsonError(eventError.message, 500);
    }

    if (!event) {
      return jsonError("Nie znaleziono wydarzenia.", 404);
    }
  }

  const { data, error } = await supabaseAdmin
    .from("airshow_event_show_links")
    .select("*")
    .eq("event_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("GET /api/events/[id]/links:", error);
    return jsonError(error.message, 500);
  }

  return NextResponse.json((data ?? []).map(item =>
    mapAirshowEventShowLink(item as DbAirshowEventShowLink)
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

  const showId = sanitizeText(body.showId, 120);
  if (!showId) {
    return jsonError("Wybierz galerię do powiązania.", 400);
  }

  const { data: show, error: showError } = await supabaseAdmin
    .from("air_shows")
    .select("id")
    .eq("id", showId)
    .maybeSingle();

  if (showError) {
    console.error("POST /api/events/[id]/links — gallery check:", showError);
    return jsonError(showError.message, 500);
  }

  if (!show) {
    return jsonError("Wybrana galeria nie istnieje.", 404);
  }

  const { data, error } = await supabaseAdmin
    .from("airshow_event_show_links")
    .insert({
      event_id: id,
      show_id: showId,
      label: sanitizeText(body.label, 180),
      sort_order: Number.isInteger(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonError("Ta galeria jest już powiązana z wydarzeniem.", 409);
    }

    console.error("POST /api/events/[id]/links:", error);
    return jsonError(error.message, 500);
  }

  return NextResponse.json(mapAirshowEventShowLink(data as DbAirshowEventShowLink), { status: 201 });
}