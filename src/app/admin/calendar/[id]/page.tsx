"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronLeft, Loader2 } from "lucide-react";
import EventForm from "@/components/calendar/EventForm";
import type { MappedAirshowEvent } from "@/lib/supabase/types";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Wystąpił nieznany błąd.";
}

export default function EditCalendarEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [eventId, setEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<MappedAirshowEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => setEventId(id));
  }, [params]);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}?all=true`);

      if (response.status === 401) {
        window.location.href = `/admin/login?redirect=/admin/calendar/${eventId}`;
        return;
      }

      const payload = await response.json().catch(() => null);

      if (response.status === 404) {
        setError("Nie znaleziono wydarzenia. Mogło zostać wcześniej usunięte.");
        return;
      }

      if (!response.ok) {
        throw new Error(
          payload?.error ??
            `Nie udało się pobrać wydarzenia (HTTP ${response.status}).`
        );
      }

      setEvent(payload as MappedAirshowEvent);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  if (loading || !eventId) {
    return (
      <div
        style={{
          minHeight: "40dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "var(--space-4)",
          color: "var(--color-text-faint)",
        }}
      >
        <Loader2
          size={28}
          style={{ animation: "calendar-edit-spin 1s linear infinite" }}
        />
        <p style={{ fontSize: "var(--text-sm)" }}>
          Ładowanie wydarzenia…
        </p>
        <style>{`
          @keyframes calendar-edit-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div
        style={{
          maxWidth: 680,
          margin: "var(--space-12) auto",
          textAlign: "center",
          padding: "var(--space-10) var(--space-6)",
          border: "1px dashed var(--color-border-strong)",
          borderRadius: "var(--radius-xl)",
        }}
      >
        <AlertCircle
          size={36}
          style={{
            color: "#dc2626",
            margin: "0 auto var(--space-4)",
          }}
        />

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "var(--text-xl)",
            letterSpacing: "-.03em",
            marginBottom: "var(--space-3)",
          }}
        >
          Nie można otworzyć wydarzenia
        </h1>

        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            margin: "0 auto var(--space-6)",
          }}
        >
          {error ?? "Wydarzenie nie jest dostępne."}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <button className="btn btn-ghost" onClick={loadEvent}>
            Spróbuj ponownie
          </button>

          <Link href="/admin/calendar" className="btn btn-primary">
            <ChevronLeft size={15} />
            Wróć do kalendarza
          </Link>
        </div>
      </div>
    );
  }

  return <EventForm mode="edit" initialEvent={event} />;
}