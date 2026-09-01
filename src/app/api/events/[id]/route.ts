import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  type AirshowAdmissionType,
  type AirshowEventStatus,
  type AirshowEventType,
  type AirshowFaqItem,
  type AirshowPracticalInfo,
  mapAirshowEvent,
  type DbAirshowEvent,
} from "@/lib/supabase/types";

const EVENT_STATUSES: AirshowEventStatus[] = [
  "scheduled",
  "rescheduled",
  "postponed",
  "cancelled",
  "completed",
];

const EVENT_TYPES: AirshowEventType[] = [
  "military",
  "civil",
  "aerobatic",
  "mixed",
  "other",
];

const ADMISSION_TYPES: AirshowAdmissionType[] = [
  "free",
  "ticketed",
  "registration_required",
  "unknown",
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "")
    .slice(0, 90);
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

function normalizeUrl(value: unknown) {
  const url = sanitizeText(value, 2048);
  return isValidHttpUrl(url) ? url : "";
}

function normalizeUrls(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map(item => normalizeUrl(item))
    .filter(Boolean))]
    .slice(0, 30);
}

function normalizeFaq(value: unknown): AirshowFaqItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(item => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const question = sanitizeText(raw.question, 300);
      const answer = sanitizeText(raw.answer, 3000);
      return question && answer ? { question, answer } : null;
    })
    .filter((item): item is AirshowFaqItem => item !== null)
    .slice(0, 25);
}

function normalizePracticalInfo(value: unknown): AirshowPracticalInfo {
  const raw = value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};

  return {
    tickets:       sanitizeText(raw.tickets, 5000),
    transport:     sanitizeText(raw.transport, 5000),
    parking:       sanitizeText(raw.parking, 5000),
    photography:   sanitizeText(raw.photography, 5000),
    accessibility: sanitizeText(raw.accessibility, 5000),
    notes:         sanitizeText(raw.notes, 5000),
  };
}

function parseDate(value: unknown) {
  const date = sanitizeText(value, 80);
  if (!date) return null;

  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function slugExists(slug: string, excludeId: string) {
  const { data, error } = await supabaseAdmin
    .from("airshow_events")
    .select("id")
    .eq("slug", slug)
    .neq("id", excludeId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
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

  let query = supabaseAdmin
    .from("airshow_events")
    .select("*")
    .eq("id", id);

  if (!all) {
    query = query.eq("published", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("GET /api/events/[id] — błąd Supabase:", error);
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Nie znaleziono wydarzenia.", 404);
  }

  return NextResponse.json(mapAirshowEvent(data as DbAirshowEvent));
}

export async function PATCH(
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

  const { data: current, error: currentError } = await supabaseAdmin
    .from("airshow_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    console.error("PATCH /api/events/[id] — odczyt bieżącego wpisu:", currentError);
    return jsonError(currentError.message, 500);
  }

  if (!current) {
    return jsonError("Nie znaleziono wydarzenia.", 404);
  }

  const update: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = sanitizeText(body.name, 180);
    if (!name) return jsonError("Nazwa wydarzenia nie może być pusta.", 400);
    update.name = name;
  }

  if (body.slug !== undefined) {
    const slug = slugify(sanitizeText(body.slug, 120));
    if (!slug) return jsonError("Slug może zawierać tylko małe litery, cyfry i myślniki.", 400);

    try {
      if (await slugExists(slug, id)) {
        return jsonError("Taki adres wydarzenia jest już zajęty.", 409);
      }
    } catch (error) {
      console.error("PATCH /api/events/[id] — sprawdzanie sluga:", error);
      return jsonError("Nie udało się sprawdzić dostępności adresu wydarzenia.", 500);
    }

    update.slug = slug;
  }

  if (body.shortDescription !== undefined) update.short_description = sanitizeText(body.shortDescription, 500);
  if (body.longDescription !== undefined) update.long_description = sanitizeText(body.longDescription, 15000);

  if (body.startDate !== undefined) {
    const startDate = parseDate(body.startDate);
    if (!startDate) return jsonError("Podaj poprawną datę rozpoczęcia.", 400);
    update.start_date = startDate;
  }

  if (body.endDate !== undefined) {
    if (body.endDate === null || body.endDate === "") {
      update.end_date = null;
    } else {
      const endDate = parseDate(body.endDate);
      if (!endDate) return jsonError("Podaj poprawną datę zakończenia.", 400);
      update.end_date = endDate;
    }
  }

  const effectiveStart = String(update.start_date ?? current.start_date);
  const effectiveEnd = update.end_date === null
    ? null
    : String(update.end_date ?? current.end_date ?? "");

  if (effectiveEnd && new Date(effectiveEnd).getTime() < new Date(effectiveStart).getTime()) {
    return jsonError("Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.", 400);
  }

  if (body.timezone !== undefined) update.timezone = sanitizeText(body.timezone, 80) || "Europe/Warsaw";

  if (body.country !== undefined) {
    const country = sanitizeText(body.country, 100);
    if (!country) return jsonError("Kraj nie może być pusty.", 400);
    update.country = country;
  }

  if (body.countryCode !== undefined) {
    const countryCode = sanitizeText(body.countryCode, 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return jsonError("Kod kraju musi mieć dwie wielkie litery, np. PL, CZ lub SK.", 400);
    }
    update.country_code = countryCode;
  }

  if (body.city !== undefined) {
    const city = sanitizeText(body.city, 120);
    if (!city) return jsonError("Miasto nie może być puste.", 400);
    update.city = city;
  }

  if (body.venueName !== undefined) update.venue_name = sanitizeText(body.venueName, 180);
  if (body.address !== undefined) update.address = sanitizeText(body.address, 500);

  if (body.latitude !== undefined) {
    const latitude = body.latitude === null || body.latitude === "" ? null : Number(body.latitude);
    if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
      return jsonError("Szerokość geograficzna musi być liczbą od -90 do 90.", 400);
    }
    update.latitude = latitude;
  }

  if (body.longitude !== undefined) {
    const longitude = body.longitude === null || body.longitude === "" ? null : Number(body.longitude);
    if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
      return jsonError("Długość geograficzna musi być liczbą od -180 do 180.", 400);
    }
    update.longitude = longitude;
  }

  if (body.status !== undefined) {
    if (!EVENT_STATUSES.includes(body.status as AirshowEventStatus)) {
      return jsonError("Nieprawidłowy status wydarzenia.", 400);
    }
    update.status = body.status;
  }

  if (body.eventType !== undefined) {
    if (!EVENT_TYPES.includes(body.eventType as AirshowEventType)) {
      return jsonError("Nieprawidłowy typ wydarzenia.", 400);
    }
    update.event_type = body.eventType;
  }

  if (body.admissionType !== undefined) {
    if (!ADMISSION_TYPES.includes(body.admissionType as AirshowAdmissionType)) {
      return jsonError("Nieprawidłowy sposób wejścia.", 400);
    }
    update.admission_type = body.admissionType;
  }

  const urlFields = [
    ["officialUrl", "official_url", "oficjalnej strony"],
    ["ticketsUrl", "tickets_url", "biletów"],
    ["programUrl", "program_url", "programu"],
    ["parkingUrl", "parking_url", "parkingu"],
    ["directionsUrl", "directions_url", "dojazdu"],
    ["coverImage", "cover_image", "obrazu okładkowego"],
  ] as const;

  for (const [bodyKey, dbKey, label] of urlFields) {
    if (body[bodyKey] === undefined) continue;

    const rawValue = sanitizeText(body[bodyKey], 2048);
    if (rawValue && !isValidHttpUrl(rawValue)) {
      return jsonError(`Adres URL dla ${label} jest nieprawidłowy.`, 400);
    }

    update[dbKey] = normalizeUrl(rawValue);
  }

  if (body.imageAlt !== undefined) update.image_alt = sanitizeText(body.imageAlt, 300);
  if (body.practicalInfo !== undefined) update.practical_info = normalizePracticalInfo(body.practicalInfo);
  if (body.faq !== undefined) update.faq = normalizeFaq(body.faq);

  if (body.sourceUrls !== undefined) {
    const rawUrls = Array.isArray(body.sourceUrls) ? body.sourceUrls : [];
    for (const url of rawUrls) {
      const rawUrl = sanitizeText(url, 2048);
      if (rawUrl && !isValidHttpUrl(rawUrl)) {
        return jsonError("Jedno ze źródeł ma nieprawidłowy adres URL.", 400);
      }
    }
    update.source_urls = normalizeUrls(rawUrls);
  }

  if (body.lastVerifiedAt !== undefined) {
    if (body.lastVerifiedAt === null || body.lastVerifiedAt === "") {
      update.last_verified_at = null;
    } else {
      const verifiedAt = parseDate(body.lastVerifiedAt);
      if (!verifiedAt) return jsonError("Data ostatniej weryfikacji jest nieprawidłowa.", 400);
      update.last_verified_at = verifiedAt;
    }
  }

  if (body.featured !== undefined) update.featured = Boolean(body.featured);

  if (body.published !== undefined) {
    const published = Boolean(body.published);
    update.published = published;

    if (published && !current.published) {
      update.published_at = new Date().toISOString();
    }

    if (!published) {
      update.published_at = null;
    }
  }

  if (Object.keys(update).length === 0) {
    return jsonError("Nie przesłano żadnych danych do aktualizacji.", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("airshow_events")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("PATCH /api/events/[id] — błąd Supabase:", error);
    return jsonError(error.message, 500);
  }

  return NextResponse.json(mapAirshowEvent(data as DbAirshowEvent));
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return jsonError("Unauthorized", 401);
  }

  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("airshow_events")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("DELETE /api/events/[id] — błąd Supabase:", error);
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ success: true });
}