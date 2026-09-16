import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapContentSubmission, type DbContentSubmission, type ContentSubmissionType } from "@/lib/supabase/types";

const TYPES: ContentSubmissionType[] = ["event_proposal", "correction"];

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validEmail(value: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "true";
}

function errorResponse(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return errorResponse("Nieprawidłowe dane formularza.");
  }

  // Honeypot: bots wypełniają ukryte pole, prawdziwy użytkownik go nie widzi.
  if (text(body.website, 120)) {
    return NextResponse.json({ ok: true });
  }

  const type = body.type as ContentSubmissionType;
  const title = text(body.title, 180);
  const message = text(body.message, 5000);
  const pageUrl = text(body.pageUrl, 2048);
  const sourceUrl = text(body.sourceUrl, 2048);
  const contactEmail = text(body.contactEmail, 320).toLowerCase() || null;
  const eventId = text(body.eventId, 80) || null;
  const showId = text(body.showId, 180) || null;

  if (!TYPES.includes(type)) return errorResponse("Wybierz rodzaj zgłoszenia.");
  if (message.length < 10) return errorResponse("Opisz zgłoszenie w co najmniej 10 znakach.");
  if (!validUrl(pageUrl) || !validUrl(sourceUrl)) return errorResponse("Jeden z podanych adresów URL jest nieprawidłowy.");
  if (!validEmail(contactEmail ?? "")) return errorResponse("Podany adres e-mail jest nieprawidłowy.");

  if (eventId) {
    const { data } = await supabaseAdmin.from("airshow_events").select("id").eq("id", eventId).maybeSingle();
    if (!data) return errorResponse("Nie znaleziono wskazanego wydarzenia.");
  }

  if (showId) {
    const { data } = await supabaseAdmin.from("air_shows").select("id").eq("id", showId).maybeSingle();
    if (!data) return errorResponse("Nie znaleziono wskazanego pokazu.");
  }

  const { data, error } = await supabaseAdmin
    .from("content_submissions")
    .insert({
      type,
      status: "pending",
      event_id: eventId,
      show_id: showId,
      page_url: pageUrl,
      title,
      message,
      source_url: sourceUrl,
      contact_email: contactEmail,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("POST /api/submissions:", error);
    return errorResponse("Nie udało się wysłać zgłoszenia. Spróbuj ponownie później.", 500);
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return errorResponse("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = supabaseAdmin
    .from("content_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (["pending", "reviewing", "accepted", "rejected"].includes(status ?? "")) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("GET /api/submissions:", error);
    return errorResponse(error.message, 500);
  }

  const submissions = (data ?? []).map((item) => mapContentSubmission(item as DbContentSubmission));
  const eventIds = [...new Set(submissions.map((item) => item.eventId).filter(Boolean))] as string[];
  const showIds = [...new Set(submissions.map((item) => item.showId).filter(Boolean))] as string[];

  const [{ data: events }, { data: shows }] = await Promise.all([
    eventIds.length ? supabaseAdmin.from("airshow_events").select("id,name,slug").in("id", eventIds) : Promise.resolve({ data: [] }),
    showIds.length ? supabaseAdmin.from("air_shows").select("id,name").in("id", showIds) : Promise.resolve({ data: [] }),
  ]);

  const eventMap = new Map((events ?? []).map((event) => [event.id, event]));
  const showMap = new Map((shows ?? []).map((show) => [show.id, show]));

  return NextResponse.json(submissions.map((item) => ({
    ...item,
    event: item.eventId ? eventMap.get(item.eventId) ?? null : null,
    show: item.showId ? showMap.get(item.showId) ?? null : null,
  })));
}
