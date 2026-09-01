import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  mapAirshowEvent,
  type DbAirshowEvent,
  type MappedAirshowEvent,
} from "@/lib/supabase/types";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airshow-gallery.vercel.app"
).replace(/\/$/, "");

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 90);
}

function formatUtcDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function makeEndDate(event: MappedAirshowEvent) {
  if (event.endDate) {
    return event.endDate;
  }

  const start = new Date(event.startDate);

  if (Number.isNaN(start.getTime())) {
    return event.startDate;
  }

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return end.toISOString();
}

function getLocation(event: MappedAirshowEvent) {
  return [
    event.venueName,
    event.address,
    event.city,
    event.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function getDescription(event: MappedAirshowEvent) {
  const pieces = [
    event.shortDescription || event.longDescription,
    event.officialUrl ? `Oficjalna strona: ${event.officialUrl}` : "",
    event.ticketsUrl ? `Bilety: ${event.ticketsUrl}` : "",
    event.programUrl ? `Program: ${event.programUrl}` : "",
    event.parkingUrl ? `Parking: ${event.parkingUrl}` : "",
    `Więcej informacji: ${SITE_URL}/airshow/${event.slug}`,
  ].filter(Boolean);

  return pieces.join("\n\n");
}

function foldIcsLine(line: string) {
  const maxLength = 75;

  if (line.length <= maxLength) {
    return line;
  }

  const chunks: string[] = [];

  for (let index = 0; index < line.length; index += maxLength) {
    const prefix = index === 0 ? "" : " ";
    chunks.push(prefix + line.slice(index, index + maxLength));
  }

  return chunks.join("\r\n");
}

function buildIcs(event: MappedAirshowEvent) {
  const start = formatUtcDate(event.startDate);
  const end = formatUtcDate(makeEndDate(event));
  const now = formatUtcDate(new Date().toISOString());

  if (!start || !end || !now) {
    return null;
  }

  const location = getLocation(event);
  const description = getDescription(event);
  const uid = `${event.id}@airshow-gallery.vercel.app`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MGYT AirShow Gallery//Kalendarz Pokazów Lotniczych//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(event.name)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `URL:${escapeIcsText(`${SITE_URL}/airshow/${event.slug}`)}`,
    `STATUS:${event.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldIcsLine).join("\r\n");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);

  if (!slug) {
    return new NextResponse("Nieprawidłowy adres wydarzenia.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { data, error } = await supabaseAdmin
    .from("airshow_events")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("GET /airshow/[slug]/calendar.ics — błąd Supabase:", error);

    return new NextResponse("Nie udało się wygenerować pliku kalendarza.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (!data) {
    return new NextResponse("Nie znaleziono wydarzenia.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const event = mapAirshowEvent(data as DbAirshowEvent);
  const ics = buildIcs(event);

  if (!ics) {
    return new NextResponse("Wydarzenie ma nieprawidłową datę.", {
      status: 422,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const filename = `${event.slug}.ics`;

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}