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

type EventInsertPayload = {
  name: string;
  short_description: string;
  long_description: string;
  start_date: string;
  end_date: string | null;
  timezone: string;
  country: string;
  country_code: string;
  city: string;
  venue_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: AirshowEventStatus;
  event_type: AirshowEventType;
  admission_type: AirshowAdmissionType;
  official_url: string;
  tickets_url: string;
  program_url: string;
  parking_url: string;
  directions_url: string;
  cover_image: string;
  image_alt: string;
  practical_info: AirshowPracticalInfo;
  faq: AirshowFaqItem[];
  source_urls: string[];
  last_verified_at: string | null;
  published_at: string | null;
  featured: boolean;
  published: boolean;
};

type BuildPayloadResult =
  | { ok: true; payload: EventInsertPayload }
  | { ok: false; error: string };

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

function normalizeSlug(value: unknown, fallback: string) {
  return slugify(sanitizeText(value, 120)) || slugify(fallback);
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

  return [...new Set(
    value
      .map((item) => normalizeUrl(item))
      .filter(Boolean)
  )].slice(0, 30);
}

function normalizeFaq(value: unknown): AirshowFaqItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
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
    tickets: sanitizeText(raw.tickets, 5000),
    transport: sanitizeText(raw.transport, 5000),
    parking: sanitizeText(raw.parking, 5000),
    photography: sanitizeText(raw.photography, 5000),
    accessibility: sanitizeText(raw.accessibility, 5000),
    notes: sanitizeText(raw.notes, 5000),
  };
}

function parseDate(value: unknown) {
  const date = sanitizeText(value, 80);

  if (!date) return null;

  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function findAvailableSlug(baseSlug: string) {
  const base = baseSlug || `airshow-${Date.now()}`;

  const { data, error } = await supabaseAdmin
    .from("airshow_events")
    .select("slug")
    .like("slug", `${base}%`);

  if (error) {
    return `${base}-${Date.now()}`;
  }

  const used = new Set((data ?? []).map((row) => String(row.slug)));

  if (!used.has(base)) return base;

  let number = 2;

  while (used.has(`${base}-${number}`)) {
    number += 1;
  }

  return `${base}-${number}`;
}

function buildEventPayload(body: Record<string, unknown>): BuildPayloadResult {
  const name = sanitizeText(body.name, 180);
  const country = sanitizeText(body.country, 100);
  const countryCode = sanitizeText(body.countryCode, 2).toUpperCase();
  const city = sanitizeText(body.city, 120);
  const startDate = parseDate(body.startDate);
  const endDateRaw = sanitizeText(body.endDate, 80);
  const endDate = endDateRaw ? parseDate(endDateRaw) : null;

  if (!name) {
    return { ok: false, error: "Nazwa wydarzenia jest wymagana." };
  }

  if (!country) {
    return { ok: false, error: "Kraj jest wymagany." };
  }

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return {
      ok: false,
      error: "Kod kraju musi mieć dwie wielkie litery, np. PL, CZ lub SK.",
    };
  }

  if (!city) {
    return { ok: false, error: "Miasto jest wymagane." };
  }

  if (!startDate) {
    return { ok: false, error: "Podaj poprawną datę rozpoczęcia." };
  }

  if (endDateRaw && !endDate) {
    return { ok: false, error: "Podaj poprawną datę zakończenia." };
  }

  if (endDate && new Date(endDate).getTime() < new Date(startDate).getTime()) {
    return {
      ok: false,
      error: "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.",
    };
  }

  const status = EVENT_STATUSES.includes(body.status as AirshowEventStatus)
    ? body.status as AirshowEventStatus
    : "scheduled";

  const eventType = EVENT_TYPES.includes(body.eventType as AirshowEventType)
    ? body.eventType as AirshowEventType
    : "mixed";

  const admissionType = ADMISSION_TYPES.includes(body.admissionType as AirshowAdmissionType)
    ? body.admissionType as AirshowAdmissionType
    : "unknown";

  const urlFields = [
    ["officialUrl", "oficjalnej strony"],
    ["ticketsUrl", "biletów"],
    ["programUrl", "programu"],
    ["parkingUrl", "parkingu"],
    ["directionsUrl", "dojazdu"],
    ["coverImage", "obrazu okładkowego"],
  ] as const;

  for (const [key, label] of urlFields) {
    const rawValue = sanitizeText(body[key], 2048);

    if (rawValue && !isValidHttpUrl(rawValue)) {
      return {
        ok: false,
        error: `Adres URL dla ${label} jest nieprawidłowy.`,
      };
    }
  }

  const latitude = body.latitude === null || body.latitude === "" || body.latitude === undefined
    ? null
    : Number(body.latitude);

  const longitude = body.longitude === null || body.longitude === "" || body.longitude === undefined
    ? null
    : Number(body.longitude);

  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    return {
      ok: false,
      error: "Szerokość geograficzna musi być liczbą od -90 do 90.",
    };
  }

  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    return {
      ok: false,
      error: "Długość geograficzna musi być liczbą od -180 do 180.",
    };
  }

  const published = Boolean(body.published);
  const publishedAt = published
    ? parseDate(body.publishedAt) ?? new Date().toISOString()
    : null;

  const lastVerifiedRaw = sanitizeText(body.lastVerifiedAt, 80);
  const lastVerifiedAt = lastVerifiedRaw ? parseDate(lastVerifiedRaw) : null;

  if (lastVerifiedRaw && !lastVerifiedAt) {
    return {
      ok: false,
      error: "Data ostatniej weryfikacji jest nieprawidłowa.",
    };
  }

  return {
    ok: true,
    payload: {
      name,
      short_description: sanitizeText(body.shortDescription, 500),
      long_description: sanitizeText(body.longDescription, 15000),

      start_date: startDate,
      end_date: endDate,
      timezone: sanitizeText(body.timezone, 80) || "Europe/Warsaw",

      country,
      country_code: countryCode,
      city,
      venue_name: sanitizeText(body.venueName, 180),
      address: sanitizeText(body.address, 500),
      latitude,
      longitude,

      status,
      event_type: eventType,
      admission_type: admissionType,

      official_url: normalizeUrl(body.officialUrl),
      tickets_url: normalizeUrl(body.ticketsUrl),
      program_url: normalizeUrl(body.programUrl),
      parking_url: normalizeUrl(body.parkingUrl),
      directions_url: normalizeUrl(body.directionsUrl),

      cover_image: normalizeUrl(body.coverImage),
      image_alt: sanitizeText(body.imageAlt, 300),

      practical_info: normalizePracticalInfo(body.practicalInfo),
      faq: normalizeFaq(body.faq),
      source_urls: normalizeUrls(body.sourceUrls),

      last_verified_at: lastVerifiedAt,
      published_at: publishedAt,
      featured: Boolean(body.featured),
      published,
    },
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  if (all && !isAdmin(req)) {
    return jsonError("Unauthorized", 401);
  }

  let query = supabaseAdmin
    .from("airshow_events")
    .select("*")
    .order("start_date", { ascending: true });

  if (!all) {
    query = query.eq("published", true);
  }

  const country = sanitizeText(searchParams.get("country"), 2).toUpperCase();
  const year = Number(searchParams.get("year"));
  const status = searchParams.get("status");

  if (/^[A-Z]{2}$/.test(country)) {
    query = query.eq("country_code", country);
  }

  if (Number.isInteger(year) && year >= 2000 && year <= 2200) {
    query = query
      .gte("start_date", `${year}-01-01T00:00:00.000Z`)
      .lt("start_date", `${year + 1}-01-01T00:00:00.000Z`);
  }

  if (all && EVENT_STATUSES.includes(status as AirshowEventStatus)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("GET /api/events — błąd Supabase:", error);
    return jsonError(error.message, 500);
  }

  return NextResponse.json(
    (data ?? []).map((event) => mapAirshowEvent(event as DbAirshowEvent))
  );
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return jsonError("Unauthorized", 401);
  }

  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return jsonError("Nieprawidłowy JSON w treści żądania.", 400);
  }

  const result = buildEventPayload(body);

  if (!result.ok) {
    return jsonError(result.error, 400);
  }

  const requestedSlug = normalizeSlug(
    body.slug,
    `${result.payload.name}-${result.payload.start_date.slice(0, 4)}`
  );

  const baseSlug = requestedSlug || `airshow-${Date.now()}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = await findAvailableSlug(baseSlug);

    const { data, error } = await supabaseAdmin
      .from("airshow_events")
      .insert({ ...result.payload, slug })
      .select("*")
      .single();

    if (!error && data) {
      return NextResponse.json(
        mapAirshowEvent(data as DbAirshowEvent),
        { status: 201 }
      );
    }

    if (error?.code !== "23505") {
      console.error("POST /api/events — błąd Supabase:", error);
      return jsonError(
        error?.message ?? "Nie udało się dodać wydarzenia.",
        500
      );
    }
  }

  return jsonError(
    "Nie udało się wygenerować unikalnego adresu wydarzenia. Spróbuj ponownie.",
    409
  );
}