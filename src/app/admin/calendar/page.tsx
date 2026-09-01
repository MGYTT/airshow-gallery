"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type {
  AirshowEventStatus,
  MappedAirshowEvent,
} from "@/lib/supabase/types";

type VisibilityFilter = "all" | "published" | "draft";

const STATUS_LABELS: Record<AirshowEventStatus, string> = {
  scheduled: "Zaplanowane",
  rescheduled: "Zmieniony termin",
  postponed: "Przełożone",
  cancelled: "Odwołane",
  completed: "Zakończone",
};

const STATUS_COLORS: Record<AirshowEventStatus, { color: string; background: string; border: string }> = {
  scheduled: {
    color: "var(--color-accent)",
    background: "var(--color-accent-subtle)",
    border: "color-mix(in srgb, var(--color-accent) 30%, transparent)",
  },
  rescheduled: {
    color: "var(--color-gold)",
    background: "var(--color-gold-subtle)",
    border: "color-mix(in srgb, var(--color-gold) 35%, transparent)",
  },
  postponed: {
    color: "#d97706",
    background: "rgba(217,119,6,.10)",
    border: "rgba(217,119,6,.28)",
  },
  cancelled: {
    color: "#dc2626",
    background: "rgba(220,38,38,.10)",
    border: "rgba(220,38,38,.28)",
  },
  completed: {
    color: "#16a34a",
    background: "rgba(22,163,74,.10)",
    border: "rgba(22,163,74,.28)",
  },
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
}

function formatDateRange(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (Number.isNaN(start.getTime())) {
    return "Brak poprawnej daty";
  }

  const formatter = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!end || Number.isNaN(end.getTime())) {
    return formatter.format(start);
  }

  const sameDay = start.toDateString() === end.toDateString();
  return sameDay ? formatter.format(start) : `${formatter.format(start)} – ${formatter.format(end)}`;
}

function toLocalDateTimeInput(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function StatusBadge({ status }: { status: AirshowEventStatus }) {
  const style = STATUS_COLORS[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px var(--space-2)",
        borderRadius: "var(--radius-full)",
        fontSize: "10px",
        fontWeight: 800,
        letterSpacing: ".06em",
        textTransform: "uppercase",
        color: style.color,
        background: style.background,
        border: `1px solid ${style.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<MappedAirshowEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AirshowEventStatus | "all">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<MappedAirshowEvent | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/events?all=true");

      if (response.status === 401) {
        window.location.href = "/admin/login?redirect=/admin/calendar";
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? `Nie udało się pobrać wydarzeń (HTTP ${response.status}).`);
      }

      const data = await response.json();
      setEvents(data as MappedAirshowEvent[]);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const countries = useMemo(() => {
    return [...new Set(events.map((event) => event.country).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pl"));
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesQuery =
        !query ||
        event.name.toLowerCase().includes(query) ||
        event.city.toLowerCase().includes(query) ||
        event.country.toLowerCase().includes(query) ||
        event.slug.toLowerCase().includes(query);

      const matchesCountry = countryFilter === "all" || event.country === countryFilter;
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "published" ? event.published : !event.published);

      return matchesQuery && matchesCountry && matchesStatus && matchesVisibility;
    });
  }, [events, search, countryFilter, statusFilter, visibilityFilter]);

  async function updateEvent(id: string, patch: Record<string, unknown>) {
    const current = events.find((event) => event.id === id);
    if (!current) return;

    setActionId(id);

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? `Nie udało się zapisać zmian (HTTP ${response.status}).`);
      }

      setEvents((previous) =>
        previous.map((event) => event.id === id ? payload as MappedAirshowEvent : event)
      );
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setActionId(null);
    }
  }

  async function removeEvent() {
    if (!deleteTarget) return;

    const id = deleteTarget.id;
    setActionId(id);

    try {
      const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? `Nie udało się usunąć wydarzenia (HTTP ${response.status}).`);
      }

      setEvents((previous) => previous.filter((event) => event.id !== id));
      setDeleteTarget(null);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setActionId(null);
    }
  }

  const publishedCount = events.filter((event) => event.published).length;
  const featuredCount = events.filter((event) => event.featured).length;
  const upcomingCount = events.filter((event) => {
    return new Date(event.endDate ?? event.startDate).getTime() >= Date.now();
  }).length;

  if (loading) {
    return (
      <div style={{ minHeight:"40dvh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"var(--space-4)", color:"var(--color-text-faint)" }}>
        <Loader2 size={28} style={{ animation:"admin-calendar-spin 1s linear infinite" }}/>
        <p style={{ fontSize:"var(--text-sm)" }}>Ładowanie kalendarza…</p>
        <style>{`@keyframes admin-calendar-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes admin-calendar-spin { to { transform:rotate(360deg); } }

        .calendar-admin-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:var(--space-4);margin-bottom:var(--space-8)}
        .calendar-admin-stat{padding:var(--space-5);border:1px solid var(--color-border);border-radius:var(--radius-xl);background:var(--color-surface)}
        .calendar-admin-toolbar{display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-5)}
        .calendar-admin-search{position:relative;flex:1;min-width:220px}
        .calendar-admin-select{min-height:40px;padding:var(--space-2) var(--space-8) var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-strong);background:var(--color-surface);color:var(--color-text);font-size:var(--text-sm);cursor:pointer}
        .calendar-admin-list{display:flex;flex-direction:column;gap:var(--space-3)}
        .calendar-admin-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--space-5);align-items:center;padding:var(--space-5);border:1px solid var(--color-border);border-radius:var(--radius-xl);background:var(--color-surface);transition:border-color var(--transition),box-shadow var(--transition),transform var(--transition)}
        .calendar-admin-row:hover{border-color:var(--color-border-strong);box-shadow:var(--shadow-sm);transform:translateY(-1px)}
        .calendar-admin-meta{display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;margin-top:var(--space-3)}
        .calendar-admin-actions{display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;justify-content:flex-end}
        .calendar-admin-action{min-height:36px;padding:var(--space-2) var(--space-3);border:1px solid var(--color-border);border-radius:var(--radius-md);background:transparent;color:var(--color-text-muted);display:inline-flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);font-weight:700;text-decoration:none;cursor:pointer}
        .calendar-admin-action:hover{background:var(--color-surface-offset);color:var(--color-text)}
        .calendar-admin-action.danger:hover{background:rgba(220,38,38,.10);border-color:rgba(220,38,38,.35);color:#dc2626}
        .calendar-admin-action.publish{background:var(--color-accent);border-color:var(--color-accent);color:#fff}
        .calendar-admin-action.publish:hover{background:var(--color-accent-hover);border-color:var(--color-accent-hover)}
        .calendar-admin-action:disabled{opacity:.55;cursor:not-allowed}
        .calendar-admin-modal-bg{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.62);backdrop-filter:blur(4px);display:grid;place-items:center;padding:var(--space-4)}
        .calendar-admin-modal{width:min(100%,440px);background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-xl);box-shadow:var(--shadow-xl);padding:var(--space-6)}
        @media(max-width:720px){
          .calendar-admin-row{grid-template-columns:1fr;gap:var(--space-4)}
          .calendar-admin-actions{justify-content:flex-start}
          .calendar-admin-toolbar{align-items:stretch}
          .calendar-admin-search{flex-basis:100%}
          .calendar-admin-select{flex:1}
        }
      `}</style>

      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", padding:"var(--space-3) var(--space-4)", background:"rgba(220,38,38,.08)", border:"1px solid rgba(220,38,38,.28)", borderRadius:"var(--radius-lg)", color:"#dc2626", fontSize:"var(--text-sm)", fontWeight:600, marginBottom:"var(--space-5)" }}>
          <AlertCircle size={16}/>
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Zamknij komunikat" style={{ marginLeft:"auto", color:"inherit", display:"flex", padding:"var(--space-1)" }}>
            <X size={15}/>
          </button>
        </div>
      )}

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"var(--space-4)", marginBottom:"var(--space-8)" }}>
        <div>
          <span className="badge" style={{ marginBottom:"var(--space-3)" }}>
            <CalendarDays size={12}/> Centrum SEO
          </span>
          <h1 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)", letterSpacing:"-0.03em", marginBottom:"var(--space-2)" }}>
            Kalendarz pokazów
          </h1>
          <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)", maxWidth:620 }}>
            Zarządzaj wydarzeniami, ich aktualnością, programem i stronami pod ruch z wyszukiwarki.
          </p>
        </div>

        <Link href="/admin/calendar/new" className="btn btn-primary">
          <Plus size={16}/> Dodaj wydarzenie
        </Link>
      </div>

      <div className="calendar-admin-grid">
        {[
          { label: "Wszystkie wydarzenia", value: events.length, icon: CalendarDays, color: "var(--color-accent)", bg: "var(--color-accent-subtle)" },
          { label: "Opublikowane", value: publishedCount, icon: Eye, color: "#16a34a", bg: "rgba(22,163,74,.10)" },
          { label: "Nadchodzące", value: upcomingCount, icon: Clock3, color: "var(--color-gold)", bg: "var(--color-gold-subtle)" },
          { label: "Wyróżnione", value: featuredCount, icon: Star, color: "var(--color-gold)", bg: "var(--color-gold-subtle)" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="calendar-admin-stat">
            <div style={{ width:38, height:38, borderRadius:"var(--radius-lg)", background:bg, color, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"var(--space-4)" }}>
              <Icon size={18}/>
            </div>
            <p style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-2xl)", lineHeight:1, letterSpacing:"-0.04em", fontVariantNumeric:"tabular-nums" }}>
              {value}
            </p>
            <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-muted)", fontWeight:600, marginTop:"var(--space-2)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="calendar-admin-toolbar">
        <div className="calendar-admin-search">
          <Search size={15} style={{ position:"absolute", left:"var(--space-3)", top:"50%", transform:"translateY(-50%)", color:"var(--color-text-faint)", pointerEvents:"none" }}/>
          <input
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Szukaj wydarzenia, miasta lub sluga…"
            style={{ paddingLeft:"var(--space-10)", fontSize:"var(--text-sm)" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Wyczyść wyszukiwanie"
              style={{ position:"absolute", right:"var(--space-3)", top:"50%", transform:"translateY(-50%)", display:"flex", color:"var(--color-text-faint)", padding:"var(--space-1)" }}
            >
              <X size={14}/>
            </button>
          )}
        </div>

        <select className="calendar-admin-select" value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)} aria-label="Filtruj po kraju">
          <option value="all">Wszystkie kraje</option>
          {countries.map((country) => <option key={country} value={country}>{country}</option>)}
        </select>

        <select className="calendar-admin-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AirshowEventStatus | "all")} aria-label="Filtruj po statusie">
          <option value="all">Wszystkie statusy</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>

        <select className="calendar-admin-select" value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)} aria-label="Filtruj po widoczności">
          <option value="all">Szkice i opublikowane</option>
          <option value="published">Opublikowane</option>
          <option value="draft">Tylko szkice</option>
        </select>

        <button
          className="calendar-admin-action"
          onClick={loadEvents}
          aria-label="Odśwież listę wydarzeń"
        >
          <RefreshCw size={14}/> Odśwież
        </button>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="calendar-admin-list">
          {filteredEvents.map((event) => {
            const isBusy = actionId === event.id;
            const isPast = new Date(event.endDate ?? event.startDate).getTime() < Date.now();

            return (
              <article key={event.id} className="calendar-admin-row">
                <div style={{ minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)", flexWrap:"wrap" }}>
                    <StatusBadge status={event.status}/>
                    {!event.published && (
                      <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", fontSize:"10px", fontWeight:800, letterSpacing:".06em", textTransform:"uppercase", color:"var(--color-text-faint)" }}>
                        <EyeOff size={11}/> Szkic
                      </span>
                    )}
                    {event.featured && (
                      <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", fontSize:"10px", fontWeight:800, letterSpacing:".06em", textTransform:"uppercase", color:"var(--color-gold)" }}>
                        <Star size={11} fill="currentColor"/> Wyróżnione
                      </span>
                    )}
                  </div>

                  <h2 style={{ fontFamily:"var(--font-display)", fontSize:"var(--text-lg)", fontWeight:800, letterSpacing:"-0.02em", marginTop:"var(--space-3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {event.name}
                  </h2>

                  <div className="calendar-admin-meta">
                    <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", fontSize:"var(--text-xs)", color:"var(--color-text-muted)" }}>
                      <CalendarDays size={13}/> {formatDateRange(event.startDate, event.endDate)}
                    </span>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", fontSize:"var(--text-xs)", color:"var(--color-text-muted)" }}>
                      <MapPin size={13}/> {event.city}, {event.country}
                    </span>
                    {event.lastVerifiedAt && (
                      <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>
                        <Check size={13}/> Zweryfikowano {toLocalDateTimeInput(event.lastVerifiedAt).slice(0, 10)}
                      </span>
                    )}
                    {isPast && (
                      <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>
                        Termin minął
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginTop:"var(--space-3)", fontFamily:"var(--font-mono)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    /airshow/{event.slug}
                  </p>
                </div>

                <div className="calendar-admin-actions">
                  {event.published && (
                    <Link
                      href={`/airshow/${event.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="calendar-admin-action"
                    >
                      <ExternalLink size={13}/> Podgląd
                    </Link>
                  )}

                  <button
                    className="calendar-admin-action"
                    onClick={() => updateEvent(event.id, { featured: !event.featured })}
                    disabled={isBusy}
                    aria-label={event.featured ? "Usuń wyróżnienie" : "Wyróżnij wydarzenie"}
                    title={event.featured ? "Usuń wyróżnienie" : "Wyróżnij wydarzenie"}
                  >
                    {isBusy ? <Loader2 size={13} style={{ animation:"admin-calendar-spin 1s linear infinite" }}/> : <Star size={13} fill={event.featured ? "currentColor" : "none"}/>}
                    {event.featured ? "Wyróżnione" : "Wyróżnij"}
                  </button>

                  <button
                    className={`calendar-admin-action ${event.published ? "" : "publish"}`}
                    onClick={() => updateEvent(event.id, { published: !event.published })}
                    disabled={isBusy}
                  >
                    {event.published ? <EyeOff size={13}/> : <Eye size={13}/>}
                    {event.published ? "Ukryj" : "Opublikuj"}
                  </button>

                  <Link href={`/admin/calendar/${event.id}`} className="calendar-admin-action">
                    <Pencil size={13}/> Edytuj
                  </Link>

                  <button
                    className="calendar-admin-action danger"
                    onClick={() => setDeleteTarget(event)}
                    disabled={isBusy}
                  >
                    <Trash2 size={13}/> Usuń
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign:"center", padding:"var(--space-20) var(--space-6)", border:"1px dashed var(--color-border-strong)", borderRadius:"var(--radius-xl)", color:"var(--color-text-muted)" }}>
          <CalendarDays size={38} style={{ margin:"0 auto var(--space-4)", color:"var(--color-text-faint)" }}/>
          <p style={{ fontSize:"var(--text-base)", fontWeight:700, marginBottom:"var(--space-2)" }}>
            {events.length === 0 ? "Kalendarz jest jeszcze pusty" : "Brak wydarzeń dla wybranych filtrów"}
          </p>
          <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-faint)", marginBottom:"var(--space-5)" }}>
            {events.length === 0
              ? "Dodaj pierwsze wydarzenie i zacznij budować strony pod ruch z Google."
              : "Zmień filtry albo wyczyść wyszukiwanie."}
          </p>
          {events.length === 0 ? (
            <Link href="/admin/calendar/new" className="btn btn-primary">
              <Plus size={15}/> Dodaj pierwsze wydarzenie
            </Link>
          ) : (
            <button
              className="btn btn-ghost"
              onClick={() => {
                setSearch("");
                setCountryFilter("all");
                setStatusFilter("all");
                setVisibilityFilter("all");
              }}
            >
              Wyczyść filtry
            </button>
          )}
        </div>
      )}

      {deleteTarget && (
        <div className="calendar-admin-modal-bg" role="presentation" onClick={() => setDeleteTarget(null)}>
          <section className="calendar-admin-modal" role="dialog" aria-modal="true" aria-labelledby="calendar-delete-title" onClick={(event) => event.stopPropagation()}>
            <div style={{ width:44, height:44, borderRadius:"var(--radius-xl)", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(220,38,38,.10)", color:"#dc2626", marginBottom:"var(--space-4)" }}>
              <Trash2 size={20}/>
            </div>

            <h2 id="calendar-delete-title" style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-lg)", letterSpacing:"-0.02em", marginBottom:"var(--space-2)" }}>
              Usunąć wydarzenie?
            </h2>

            <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)", lineHeight:1.65, marginBottom:"var(--space-2)" }}>
              <strong style={{ color:"var(--color-text)" }}>{deleteTarget.name}</strong> wraz z programem, aktualizacjami i połączeniami z galeriami zostanie trwale usunięte.
            </p>

            <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginBottom:"var(--space-6)" }}>
              Tej operacji nie można cofnąć.
            </p>

            <div style={{ display:"flex", gap:"var(--space-3)" }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setDeleteTarget(null)} disabled={actionId === deleteTarget.id}>
                Anuluj
              </button>
              <button
                className="btn"
                style={{ flex:1, background:"#dc2626", color:"#fff", borderColor:"#dc2626" }}
                onClick={removeEvent}
                disabled={actionId === deleteTarget.id}
              >
                {actionId === deleteTarget.id ? <Loader2 size={15} style={{ animation:"admin-calendar-spin 1s linear infinite" }}/> : <Trash2 size={15}/>}
                Usuń
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}