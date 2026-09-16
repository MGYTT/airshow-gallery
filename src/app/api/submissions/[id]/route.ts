import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapContentSubmission, type DbContentSubmission, type ContentSubmissionStatus } from "@/lib/supabase/types";

const STATUSES: ContentSubmissionStatus[] = ["pending", "reviewing", "accepted", "rejected"];

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "true";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const status = body.status as ContentSubmissionStatus;
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Nieprawidłowy status zgłoszenia." }, { status: 400 });
  }

  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 3000) : null;

  const { data, error } = await supabaseAdmin
    .from("content_submissions")
    .update({
      status,
      admin_note: adminNote,
      reviewed_at: status === "pending" ? null : new Date().toISOString(),
      reviewed_by: status === "pending" ? null : "MGYT",
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("PATCH /api/submissions/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) return NextResponse.json({ error: "Nie znaleziono zgłoszenia." }, { status: 404 });

  return NextResponse.json(mapContentSubmission(data as DbContentSubmission));
}
