"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Calendar, MapPin, CheckCircle2, Clock, Globe,
  ChevronRight, ArrowLeft, Plane, Star,
} from "lucide-react";

// ── Typy ─────────────────────────────────────────────────────

type EventStatus = "done" | "soon" | "upcoming";
type EventTab    = "polska" | "zagranica";

interface AirEventRaw {
  name:        string;
  location:    string;
  date:        string;
  /** Data rozpoczęcia w formacie YYYY-MM-DD */
  dateStart:   string;
  /** Data zakończenia w formacie YYYY-MM-DD — dla wydarzeń jednodniowych taka sama jak dateStart */
  dateEnd:     string;
  tab:         EventTab;
  note?:       string;
}

interface AirEvent extends AirEventRaw {
  status: EventStatus;
}

// ── Dane źródłowe (bez ręcznego statusu — liczony automatycznie) ──

const EVENTS_RAW: AirEventRaw[] = [
  // ── Polska ──
  { name: "Pokazy Lotnicze JEDLIŃSKY 2026",        location: "Piastów",               date: "25 kwietnia 2026",     dateStart: "2026-04-25", dateEnd: "2026-04-25", tab: "polska" },
  { name: "Pokazy Lotnicze Air SKY",               location: "Lotnisko Piastów k. Radomia", date: "25 kwietnia 2026", dateStart: "2026-04-25", dateEnd: "2026-04-25", tab: "polska" },
  { name: "Aerosploty",                            location: "Lotnisko Aleksandrowice, Bielsko-Biała", date: "2 maja 2026", dateStart: "2026-05-02", dateEnd: "2026-05-02", tab: "polska" },
  { name: "Świdnik Air Festival",                  location: "Świdnik",               date: "13–14 czerwca 2026",   dateStart: "2026-06-13", dateEnd: "2026-06-14", tab: "polska" },
  { name: "ANTIDOTUM Airshow Leszno",              location: "Leszno",                date: "19–20 czerwca 2026",   dateStart: "2026-06-19", dateEnd: "2026-06-20", tab: "polska" },
  { name: "Odlotowe Suwałki Air Show",             location: "Suwałki",               date: "27 czerwca 2026",      dateStart: "2026-06-27", dateEnd: "2026-06-27", tab: "polska" },
  { name: "Fly Fest",                              location: "Piotrków Trybunalski",  date: "4–5 lipca 2026",       dateStart: "2026-07-04", dateEnd: "2026-07-05", tab: "polska" },
  { name: "Nowotarski Piknik Lotniczy",            location: "Lotnisko Nowy Targ",    date: "4–5 lipca 2026",       dateStart: "2026-07-04", dateEnd: "2026-07-05", tab: "polska" },
  { name: "RANWERS Dolnośląskie Pokazy Lotnicze",  location: "Świebodzice",           date: "25–26 lipca 2026",     dateStart: "2026-07-25", dateEnd: "2026-07-26", tab: "polska" },
  { name: "AirShow Rudniki",                       location: "Rudniki",               date: "1 sierpnia 2026",      dateStart: "2026-08-01", dateEnd: "2026-08-01", tab: "polska" },
  { name: "Mazury AirShow",                        location: "Kętrzyn",               date: "1–2 sierpnia 2026",    dateStart: "2026-08-01", dateEnd: "2026-08-02", tab: "polska" },
  { name: "Płocki Piknik Lotniczy",                location: "Płock",                 date: "7–8 sierpnia 2026",    dateStart: "2026-08-07", dateEnd: "2026-08-08", tab: "polska", note: "Nie potwierdzony" },
  { name: "Aeropiknik Baloniada Ogrodzieniec",     location: "Ogrodzieniec",          date: "8–9 sierpnia 2026",    dateStart: "2026-08-08", dateEnd: "2026-08-09", tab: "polska" },
  { name: "Piknik Lotniczy w Łososinie Dolnej",    location: "Łososina Dolna",        date: "15–16 sierpnia 2026",  dateStart: "2026-08-15", dateEnd: "2026-08-16", tab: "polska" },
  { name: "Giżycko Airshow",                       location: "Giżycko",               date: "22 sierpnia 2026",     dateStart: "2026-08-22", dateEnd: "2026-08-22", tab: "polska" },
  { name: "Leszczyńska Noc Balonowa",              location: "Leszno",                date: "28–30 sierpnia 2026",  dateStart: "2026-08-28", dateEnd: "2026-08-30", tab: "polska" },
  { name: "Festiwal Wiatru Unisław",                location: "Unisław",               date: "29 sierpnia 2026",     dateStart: "2026-08-29", dateEnd: "2026-08-29", tab: "polska" },
  { name: "Festiwal Wiatru Toruń",                  location: "Toruń",                 date: "30 sierpnia 2026",     dateStart: "2026-08-30", dateEnd: "2026-08-30", tab: "polska" },
  { name: "Skrzydła nad Kazimierzem",              location: "Kazimierz",             date: "11–13 września 2026",  dateStart: "2026-09-11", dateEnd: "2026-09-13", tab: "polska" },
  { name: "VII Zlot Zabytkowych Szybowców",        location: "Góra Litwinka",         date: "12–13 września 2026",  dateStart: "2026-09-12", dateEnd: "2026-09-13", tab: "polska" },

  // ── Zagranica ──
  { name: "International Sanicole Airshow",        location: "Hechtel-Eksel, Belgia", date: "12–13 września 2026",  dateStart: "2026-09-12", dateEnd: "2026-09-13", tab: "zagranica", note: "Warte uwagi" },
  { name: "NATO Days 2026",                        location: "Ostrawa, Czechy",       date: "19–20 września 2026",  dateStart: "2026-09-19", dateEnd: "2026-09-20", tab: "zagranica", note: "Blisko Polski" },
];

// ── Ile dni przed startem wydarzenie liczy się jako "wkrótce" ──
const SOON_THRESHOLD_DAYS = 14;

// ── Helpers ───────────────────────────────────────────────────

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** Liczy status wydarzenia w oparciu o aktualną datę */
function computeStatus(ev: AirEventRaw, now: Date): EventStatus {
  const end = new Date(ev.dateEnd);
  end.setHours(23, 59, 59, 999);

  if (end.getTime() < now.getTime()) return "done";

  const start   = new Date(ev.dateStart);
  const daysOut = daysBetween(now, start);

  if (daysOut <= SOON_THRESHOLD_DAYS) return "soon";
  return "upcoming";
}

function withStatus(events: AirEventRaw[], now: Date): AirEvent[] {
  return events.map(e => ({ ...e, status: computeStatus(e, now) }));
}

function getDaysUntil(dateStart: string, now: Date): number {
  const target = new Date(dateStart);
  target.setHours(0, 0, 0, 0);
  return daysBetween(now, target);
}

function getMonthAbbr(dateStart: string): { day: string; month: string } {
  const d = new Date(dateStart);
  return {
    day:   d.getDate().toString(),
    month: d.toLocaleString("pl-PL", { month: "short" }).replace(".", "").toUpperCase(),
  };
}

// ── Karta eventu ─────────────────────────────────────────────

function EventCard({ event, isNext, index, now }: { event: AirEvent; isNext?: boolean; index?: number; now: Date }) {
  const [hovered, setHovered] = useState(false);
  const days   = getDaysUntil(event.dateStart, now);
  const mabbr  = getMonthAbbr(event.dateStart);
  const isDone = event.status === "done";

  return (
    <div
      className="kl-card"
      data-done={isDone}
      data-next={isNext}
      data-hovered={hovered && !isDone}
      style={{ animationDelay: `${(index ?? 0) * 0.04}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Lewa linia akcentu */}
      {!isDone && (
        <div className={`kl-card-stripe ${isNext ? "kl-card-stripe--next" : event.status === "soon" ? "kl-card-stripe--soon" : "kl-card-stripe--upcoming"}`}/>
      )}

      {/* Blok daty */}
      <div className={`kl-date-block ${isDone ? "kl-date-block--done" : isNext ? "kl-date-block--next" : ""}`}>
        <span className="kl-date-day">{mabbr.day}</span>
        <span className="kl-date-month">{mabbr.month}</span>
      </div>

      {/* Treść */}
      <div className="kl-card-body">
        <div className="kl-card-top">
          <h3 className={`kl-card-title ${isDone ? "kl-card-title--done" : ""}`}>
            {event.name}
          </h3>
          <div className="kl-card-badges">
            {isNext && <span className="kl-badge kl-badge--next">Następny ✦</span>}
            {isDone && <span className="kl-badge kl-badge--done"><CheckCircle2 size={9}/> Odbyty</span>}
            {event.note === "Blisko Polski"    && <span className="kl-badge kl-badge--geo">📍 {event.note}</span>}
            {event.note === "Warte uwagi"      && <span className="kl-badge kl-badge--star"><Star size={9} fill="currentColor"/> {event.note}</span>}
            {event.note === "Nie potwierdzony" && <span className="kl-badge kl-badge--warn">⚠ {event.note}</span>}
          </div>
        </div>

        <div className="kl-card-meta">
          <span className="kl-meta-item">
            <Calendar size={11}/> {event.date}
          </span>
          <span className="kl-meta-dot"/>
          <span className="kl-meta-item">
            <MapPin size={11}/> {event.location}
          </span>
        </div>
      </div>

      {/* Prawa strona — status + odliczanie */}
      <div className="kl-card-right">
        {!isDone && days >= 0 && (
          <div className={`kl-countdown ${isNext ? "kl-countdown--next" : ""}`}>
            <span className="kl-countdown-num">{days === 0 ? "dziś" : days === 1 ? "jutro" : `${days}`}</span>
            {days > 1 && <span className="kl-countdown-label">dni</span>}
          </div>
        )}
        {!isDone && days < 0 && (
          <div className="kl-countdown">
            <span className="kl-countdown-num" style={{ fontSize: "var(--text-xs)" }}>trwa</span>
          </div>
        )}
        <div className={`kl-status-dot ${isDone ? "kl-status-dot--done" : event.status === "soon" ? "kl-status-dot--soon" : "kl-status-dot--upcoming"}`}/>
      </div>
    </div>
  );
}

// ── Pasek postępu sezonu ──────────────────────────────────────

function SeasonProgress({ events }: { events: AirEvent[] }) {
  const total = events.length;
  const done  = events.filter(e => e.status === "done").length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="kl-progress-wrap">
      <div className="kl-progress-head">
        <span className="kl-progress-label">Postęp sezonu 2026</span>
        <span className="kl-progress-pct">{pct}%</span>
      </div>
      <div className="kl-progress-track">
        <div className="kl-progress-fill" style={{ width: `${pct}%` }}/>
      </div>
      <div className="kl-progress-legend">
        <span><CheckCircle2 size={10}/> {done} odbyte</span>
        <span><Clock size={10}/> {total - done} przed nami</span>
      </div>
    </div>
  );
}

// ── PAGE ─────────────────────────────────────────────────────

export default function KalendarzClient() {
  const [tab, setTab]         = useState<EventTab>("polska");
  const [mounted, setMounted] = useState(false);
  const listRef                = useRef<HTMLDivElement>(null);

  // "now" jest liczone raz przy montowaniu — wystarczy dla kalendarza dziennego,
  // a odświeżenie strony automatycznie przeliczy statusy na nowo.
  const now = useMemo(() => todayMidnight(), []);

  useEffect(() => { setMounted(true); }, []);

  // Wszystkie wydarzenia z automatycznie policzonym statusem
  const allEvents = useMemo(() => withStatus(EVENTS_RAW, now), [now]);

  const events = useMemo(
    () => allEvents.filter(e => e.tab === tab).sort((a, b) => a.dateStart.localeCompare(b.dateStart)),
    [allEvents, tab]
  );

  // Następne wydarzenie = pierwsze, które jeszcze się nie zakończyło
  const nextEvt = useMemo(
    () => events.filter(e => e.status !== "done")[0],
    [events]
  );

  const doneEvents   = events.filter(e => e.status === "done");
  const upcomingEvts = events.filter(e => e.status !== "done" && (!nextEvt || e.name !== nextEvt.name || e.dateStart !== nextEvt.dateStart));

  const polandEvents = useMemo(() => allEvents.filter(e => e.tab === "polska"), [allEvents]);

  const handleTabChange = (t: EventTab) => {
    setTab(t);
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  };

  return (
    <>
      <style>{`
        /* ── Animacje ── */
        @keyframes kl-up   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes kl-in   { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes kl-pulse{ 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes kl-prog { from{width:0} to{width:var(--target-w)} }

        /* ── Layout ── */
        .kl-wrap   { padding-top:80px; min-height:100dvh; padding-bottom:var(--space-24); }
        .kl-hero   { background:var(--color-surface); border-bottom:1px solid var(--color-divider); padding:clamp(var(--space-12),6vw,var(--space-20)) 0 0; position:relative; overflow:hidden; }
        .kl-deco   { position:absolute; right:-2%; bottom:-15%; font-family:var(--font-display); font-weight:900; font-size:clamp(8rem,22vw,20rem); line-height:1; color:var(--color-text); opacity:.022; user-select:none; pointer-events:none; letter-spacing:-0.06em; }
        .kl-back   { display:inline-flex; align-items:center; gap:var(--space-2); font-size:var(--text-xs); font-weight:700; color:var(--color-text-faint); text-transform:uppercase; letter-spacing:.08em; margin-bottom:var(--space-6); transition:color .15s, gap .15s; text-decoration:none; }
        .kl-back:hover { color:var(--color-accent); gap:var(--space-1); }

        /* ── H1 ── */
        .kl-h1     { font-family:var(--font-display); font-weight:900; font-size:var(--text-2xl); letter-spacing:-0.04em; line-height:1.05; margin-bottom:var(--space-5); animation:kl-up .5s cubic-bezier(.16,1,.3,1) both; }
        .kl-h1 em  { font-style:normal; color:var(--color-accent); }
        .kl-sub    { font-size:var(--text-base); color:var(--color-text-muted); max-width:52ch; line-height:1.7; margin-bottom:var(--space-8); animation:kl-up .5s .05s cubic-bezier(.16,1,.3,1) both; }

        /* ── Statystyki ── */
        .kl-stats  { display:flex; gap:var(--space-8); flex-wrap:wrap; padding-bottom:var(--space-8); border-bottom:1px solid var(--color-divider); animation:kl-up .5s .1s cubic-bezier(.16,1,.3,1) both; }
        .kl-stat   { display:flex; flex-direction:column; gap:2px; }
        .kl-stat-v { font-family:var(--font-display); font-weight:900; font-size:var(--text-xl); letter-spacing:-0.04em; line-height:1; font-variant-numeric:tabular-nums; }
        .kl-stat-l { font-size:var(--text-xs); color:var(--color-text-faint); font-weight:600; text-transform:uppercase; letter-spacing:.07em; }

        /* ── Tabs ── */
        .kl-tabs-wrap { display:flex; gap:3px; padding:3px; background:var(--color-surface-2); border-radius:var(--radius-xl); width:fit-content; margin-top:var(--space-7); margin-bottom:-1px; animation:kl-up .5s .15s cubic-bezier(.16,1,.3,1) both; }
        .kl-tab { padding:var(--space-2) var(--space-5); border-radius:calc(var(--radius-lg) - 2px); font-size:var(--text-sm); font-weight:700; cursor:pointer; border:none; background:none; color:var(--color-text-muted); transition:background .15s,color .15s,box-shadow .15s; display:inline-flex; align-items:center; gap:var(--space-2); white-space:nowrap; }
        .kl-tab:hover:not(.on) { color:var(--color-text); background:var(--color-surface-offset); }
        .kl-tab.on  { background:var(--color-bg); color:var(--color-text); box-shadow:var(--shadow-sm); }
        .kl-tab.on svg { color:var(--color-accent); }
        .kl-tab-count { font-size:10px; font-weight:800; background:var(--color-surface-offset); padding:1px 7px; border-radius:99px; margin-left:2px; transition:color .15s; }

        /* ── Progress bar ── */
        .kl-progress-wrap  { background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-xl); padding:var(--space-4) var(--space-5); margin-bottom:var(--space-6); animation:kl-up .4s cubic-bezier(.16,1,.3,1) both; }
        .kl-progress-head  { display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-3); }
        .kl-progress-label { font-size:var(--text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--color-text-muted); }
        .kl-progress-pct   { font-family:var(--font-display); font-weight:900; font-size:var(--text-lg); color:var(--color-accent); letter-spacing:-0.03em; }
        .kl-progress-track { height:6px; background:var(--color-surface-offset); border-radius:var(--radius-full); overflow:hidden; margin-bottom:var(--space-3); }
        .kl-progress-fill  { height:100%; background:linear-gradient(90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 60%, var(--color-gold))); border-radius:var(--radius-full); transition:width 1s cubic-bezier(.16,1,.3,1); }
        .kl-progress-legend{ display:flex; gap:var(--space-5); font-size:var(--text-xs); color:var(--color-text-faint); font-weight:600; }
        .kl-progress-legend span { display:inline-flex; align-items:center; gap:4px; }

        /* ── Separatory ── */
        .kl-sep { display:flex; align-items:center; gap:var(--space-4); margin:var(--space-6) 0 var(--space-3); }
        .kl-sep-line  { flex:1; height:1px; background:var(--color-divider); }
        .kl-sep-label { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.12em; color:var(--color-text-faint); white-space:nowrap; display:inline-flex; align-items:center; gap:5px; }

        /* ── Next event hero ── */
        .kl-next-label { font-size:var(--text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--color-text-faint); margin-bottom:var(--space-3); display:flex; align-items:center; gap:var(--space-2); }
        .kl-next-pulse { width:7px; height:7px; border-radius:50%; background:var(--color-accent); animation:kl-pulse 1.8s ease-in-out infinite; flex-shrink:0; }

        /* ── Karty ── */
        .kl-list  { display:flex; flex-direction:column; gap:var(--space-2); }
        .kl-card  { position:relative; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:var(--space-4); padding:var(--space-4) var(--space-5); border-radius:var(--radius-xl); background:var(--color-surface); border:1px solid var(--color-border); overflow:hidden; cursor:default; animation:kl-in .35s cubic-bezier(.16,1,.3,1) both; transition:transform .2s cubic-bezier(.16,1,.3,1), box-shadow .2s cubic-bezier(.16,1,.3,1), border-color .2s, background .2s; }
        .kl-card[data-done="true"] { opacity:.5; }
        .kl-card[data-next="true"] { background:var(--color-accent-subtle); border-color:color-mix(in srgb, var(--color-accent) 40%, transparent); }
        .kl-card[data-hovered="true"]:not([data-done="true"]) { transform:translateY(-2px); box-shadow:var(--shadow-md); border-color:color-mix(in srgb, var(--color-accent) 35%, transparent); }

        /* Linia stripe ── */
        .kl-card-stripe { position:absolute; left:0; top:12%; bottom:12%; width:3px; border-radius:0 var(--radius-full) var(--radius-full) 0; }
        .kl-card-stripe--next     { background:var(--color-accent); }
        .kl-card-stripe--soon     { background:var(--color-accent); opacity:.7; }
        .kl-card-stripe--upcoming { background:var(--color-gold); opacity:.6; }

        /* Blok daty ── */
        .kl-date-block { width:44px; height:48px; border-radius:var(--radius-lg); background:var(--color-surface-offset); display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; gap:0; }
        .kl-date-block--done { opacity:.5; }
        .kl-date-block--next { background:var(--color-accent); }
        .kl-date-block--next .kl-date-day   { color:#fff; }
        .kl-date-block--next .kl-date-month { color:rgba(255,255,255,.75); }
        .kl-date-day   { font-family:var(--font-display); font-weight:900; font-size:var(--text-base); line-height:1; letter-spacing:-0.02em; color:var(--color-text); }
        .kl-date-month { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--color-text-faint); margin-top:1px; }

        /* Treść ── */
        .kl-card-body   { min-width:0; display:flex; flex-direction:column; gap:var(--space-2); }
        .kl-card-top    { display:flex; align-items:center; gap:var(--space-2); flex-wrap:wrap; }
        .kl-card-title  { font-family:var(--font-display); font-weight:800; font-size:var(--text-base); letter-spacing:-0.02em; color:var(--color-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.2; }
        .kl-card-title--done { color:var(--color-text-muted); }
        .kl-card-meta   { display:flex; align-items:center; gap:var(--space-2); flex-wrap:wrap; }
        .kl-meta-item   { display:inline-flex; align-items:center; gap:4px; font-size:var(--text-xs); color:var(--color-text-muted); font-weight:500; }
        .kl-meta-dot    { width:3px; height:3px; border-radius:50%; background:var(--color-text-faint); flex-shrink:0; }

        /* Badges ── */
        .kl-card-badges { display:flex; gap:4px; flex-wrap:wrap; }
        .kl-badge       { display:inline-flex; align-items:center; gap:3px; padding:2px 8px; border-radius:99px; font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; flex-shrink:0; white-space:nowrap; }
        .kl-badge--next { background:var(--color-accent); color:#fff; }
        .kl-badge--done { background:var(--color-surface-offset); color:var(--color-text-faint); }
        .kl-badge--geo  { background:color-mix(in srgb, var(--color-primary,#01696f) 12%, transparent); color:var(--color-primary,#01696f); border:1px solid color-mix(in srgb, var(--color-primary,#01696f) 25%, transparent); }
        .kl-badge--star { background:var(--color-gold-subtle); color:var(--color-gold); border:1px solid color-mix(in srgb, var(--color-gold) 25%, transparent); }
        .kl-badge--warn { background:color-mix(in srgb, var(--color-gold) 10%, transparent); color:var(--color-gold); border:1px solid color-mix(in srgb, var(--color-gold) 25%, transparent); opacity:.85; }

        /* Prawa strona — odliczanie ── */
        .kl-card-right    { display:flex; flex-direction:column; align-items:flex-end; gap:var(--space-2); flex-shrink:0; }
        .kl-countdown     { display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:44px; padding:var(--space-2) var(--space-2); border-radius:var(--radius-lg); background:var(--color-surface-offset); border:1px solid var(--color-border); }
        .kl-countdown--next { background:var(--color-accent-subtle); border-color:color-mix(in srgb, var(--color-accent) 30%, transparent); }
        .kl-countdown--next .kl-countdown-num { color:var(--color-accent); }
        .kl-countdown-num { font-family:var(--font-display); font-weight:900; font-size:var(--text-base); line-height:1; letter-spacing:-0.03em; font-variant-numeric:tabular-nums; color:var(--color-text); }
        .kl-countdown-label { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--color-text-faint); margin-top:1px; }
        .kl-status-dot    { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .kl-status-dot--done     { background:var(--color-text-faint); }
        .kl-status-dot--soon     { background:var(--color-accent); animation:kl-pulse 1.5s ease-in-out infinite; }
        .kl-status-dot--upcoming { background:var(--color-gold); }

        /* ── CTA banner ── */
        .kl-cta { margin-top:var(--space-12); padding:var(--space-8); border-radius:var(--radius-2xl); background:var(--color-accent-subtle); border:1px solid color-mix(in srgb, var(--color-accent) 35%, transparent); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-5); position:relative; overflow:hidden; }
        .kl-cta-deco { position:absolute; right:-2%; bottom:-20%; font-family:var(--font-display); font-weight:900; font-size:clamp(5rem,14vw,12rem); line-height:1; color:var(--color-accent); opacity:.06; user-select:none; pointer-events:none; letter-spacing:-0.05em; }
        .kl-cta-btn { display:inline-flex; align-items:center; gap:var(--space-2); padding:var(--space-3) var(--space-6); border-radius:var(--radius-md); background:var(--color-accent); color:#fff; font-weight:700; font-size:var(--text-sm); text-decoration:none; white-space:nowrap; flex-shrink:0; transition:background .18s, transform .15s, box-shadow .18s; box-shadow:0 2px 12px color-mix(in srgb, var(--color-accent) 35%, transparent); }
        .kl-cta-btn:hover { background:var(--color-accent-hover); transform:translateY(-1px); box-shadow:0 6px 20px color-mix(in srgb, var(--color-accent) 45%, transparent); }
        .kl-cta-btn:active { transform:scale(.97); }

        /* ── Empty state ── */
        .kl-empty { text-align:center; padding:var(--space-12) var(--space-6); color:var(--color-text-faint); }

        /* ── Responsive ── */
        @media(max-width:600px) {
          .kl-card { grid-template-columns:auto 1fr; }
          .kl-card-right { display:none; }
          .kl-stats { gap:var(--space-5); }
          .kl-cta { flex-direction:column; align-items:flex-start; }
        }
      `}</style>

      <div className="kl-wrap">

        {/* ── Hero ── */}
        <div className="kl-hero">
          <div aria-hidden className="kl-deco">2026</div>

          <div className="container--narrow" style={{ position:"relative", zIndex:1 }}>
            <Link href="/" className="kl-back">
              <ArrowLeft size={12}/> Strona główna
            </Link>

            <div style={{ marginBottom:"var(--space-3)" }}>
              <span className="badge"><Plane size={11}/> Sezon 2026</span>
            </div>

            <h1 className="kl-h1">
              Kalendarz pokazów<br/>
              <em>lotniczych 2026</em>
            </h1>

            <p className="kl-sub">
              Wszystkie pokazy lotnicze w Polsce oraz wybrane imprezy zagraniczne warte uwagi — status aktualizuje się automatycznie w oparciu o dzisiejszą datę.
            </p>

            {/* Statystyki */}
            <div className="kl-stats">
              {[
                { value: polandEvents.length,                                    label: "Pokazów w Polsce",   color: "var(--color-text)" },
                { value: allEvents.filter(e => e.status === "done").length,       label: "Już odbyło się",     color: "var(--color-text-muted)" },
                { value: allEvents.filter(e => e.status !== "done").length,       label: "Jeszcze przed nami", color: "var(--color-accent)" },
              ].map(({ value, label, color }) => (
                <div className="kl-stat" key={label}>
                  <span className="kl-stat-v" style={{ color }}>{value}</span>
                  <span className="kl-stat-l">{label}</span>
                </div>
              ))}
            </div>

            {/* Zakładki */}
            <div className="kl-tabs-wrap">
              {(["polska", "zagranica"] as EventTab[]).map(t => (
                <button
                  key={t}
                  className={`kl-tab ${tab === t ? "on" : ""}`}
                  onClick={() => handleTabChange(t)}
                >
                  {t === "polska" ? <Plane size={13}/> : <Globe size={13}/>}
                  {t === "polska" ? "Polska" : "Zagranica"}
                  <span className="kl-tab-count" style={{ color: tab === t ? "var(--color-accent)" : "var(--color-text-faint)" }}>
                    {allEvents.filter(e => e.tab === t).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Treść ── */}
        <div className="container--narrow" style={{ paddingTop:"var(--space-8)" }} ref={listRef}>

          {tab === "polska" && mounted && <SeasonProgress events={polandEvents}/>}

          {nextEvt && (
            <div style={{ marginBottom:"var(--space-6)" }}>
              <p className="kl-next-label">
                <span className="kl-next-pulse"/>
                Następne wydarzenie
              </p>
              <EventCard event={nextEvt} isNext index={0} now={now}/>
            </div>
          )}

          <div className="kl-list">

            {upcomingEvts.length > 0 && (
              <>
                <div className="kl-sep">
                  <div className="kl-sep-line"/>
                  <span className="kl-sep-label" style={{ color:"var(--color-gold)" }}>
                    <Clock size={10}/> Nadchodzące — {upcomingEvts.length}
                  </span>
                  <div className="kl-sep-line"/>
                </div>
                {upcomingEvts.map((e, i) => <EventCard key={e.name + e.dateStart} event={e} index={i + 1} now={now}/>)}
              </>
            )}

            {doneEvents.length > 0 && (
              <>
                <div className="kl-sep">
                  <div className="kl-sep-line"/>
                  <span className="kl-sep-label">
                    <CheckCircle2 size={10}/> Odbyte — {doneEvents.length}
                  </span>
                  <div className="kl-sep-line"/>
                </div>
                {doneEvents.map((e, i) => <EventCard key={e.name + e.dateStart} event={e} index={i} now={now}/>)}
              </>
            )}

            {events.length === 0 && (
              <div className="kl-empty">
                <p>Brak wydarzeń w tej kategorii.</p>
              </div>
            )}

          </div>

          {/* CTA */}
          <div className="kl-cta">
            <div aria-hidden className="kl-cta-deco">✈</div>
            <div style={{ position:"relative", zIndex:1 }}>
              <p style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"var(--text-lg)", letterSpacing:"-0.02em", marginBottom:"var(--space-1)" }}>
                Byłeś na jednym z tych pokazów?
              </p>
              <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)", lineHeight:1.6 }}>
                Zobacz zdjęcia z poprzednich edycji w galerii.
              </p>
            </div>
            <Link href="/gallery" className="kl-cta-btn" style={{ position:"relative", zIndex:1 }}>
              Przeglądaj galerię <ChevronRight size={15}/>
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}