import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  mapAirshowEvent,
  type DbAirshowEvent,
} from "@/lib/supabase/types";

function isAdmin(request: NextRequest) {
  return request.cookies.get("admin_session")?.value === "true";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";

  if (all && !isAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let query = supabaseAdmin
    .from("airshow_events")
    .select("*")
    .order("start_date", { ascending: true })
    .order("created_at", { ascending: false });

  /*
   * Publicznie zwracamy tylko opublikowane wydarzenia.
   * Panel administratora z ?all=true otrzymuje również szkice.
   */
  if (!all) {
    query = query.eq("published", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("GET /api/airshow-events — błąd Supabase:", error);

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    ((data ?? []) as DbAirshowEvent[]).map(mapAirshowEvent)
  );
}