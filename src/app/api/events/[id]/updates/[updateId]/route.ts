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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  if (!isAdmin(req)) {
    return jsonError("Unauthorized", 401);
  }

  const { id, updateId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("Nieprawidłowy JSON w treści żądania.", 400);
  }

  const update: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = sanitizeText(body.title, 180);
    if (!title) return jsonError("Tytuł aktualizacji nie może być pusty.", 400);
    update.title = title;
  }

  if (body.content !== undefined) {
    update.content = sanitizeText(body.content, 5000);
  }

  if (body.publishedAt !== undefined) {
    const publishedAt = parseDate(body.publishedAt);
    if (!publishedAt) return jsonError("Data aktualizacji jest nieprawidłowa.", 400);
    update.published_at = publishedAt;
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
    .from("airshow_event_updates")
    .update(update)
    .eq("id", updateId)
    .eq("event_id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("PATCH /api/events/[id]/updates/[updateId]:", error);
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Nie znaleziono aktualizacji.", 404);
  }

  return NextResponse.json(
    mapAirshowEventUpdate(data as DbAirshowEventUpdate)
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  if (!isAdmin(req)) {
    return jsonError("Unauthorized", 401);
  }

  const { id, updateId } = await params;

  const { error } = await supabaseAdmin
    .from("airshow_event_updates")
    .delete()
    .eq("id", updateId)
    .eq("event_id", id);

  if (error) {
    console.error("DELETE /api/events/[id]/updates/[updateId]:", error);
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ success: true });
}