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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  if (!isAdmin(req)) {
    return jsonError("Unauthorized", 401);
  }

  const { id, linkId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("Nieprawidłowy JSON w treści żądania.", 400);
  }

  const update: Record<string, unknown> = {};

  if (body.label !== undefined) {
    update.label = sanitizeText(body.label, 180);
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
    .from("airshow_event_show_links")
    .update(update)
    .eq("id", linkId)
    .eq("event_id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("PATCH /api/events/[id]/links/[linkId]:", error);
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Nie znaleziono powiązania galerii.", 404);
  }

  return NextResponse.json(
    mapAirshowEventShowLink(data as DbAirshowEventShowLink)
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  if (!isAdmin(req)) {
    return jsonError("Unauthorized", 401);
  }

  const { id, linkId } = await params;

  const { error } = await supabaseAdmin
    .from("airshow_event_show_links")
    .delete()
    .eq("id", linkId)
    .eq("event_id", id);

  if (error) {
    console.error("DELETE /api/events/[id]/links/[linkId]:", error);
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ success: true });
}