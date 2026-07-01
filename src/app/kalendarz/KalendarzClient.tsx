"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Calendar, MapPin, CheckCircle2, Clock, Globe,
  ChevronRight, ArrowLeft, Plane, Star, Sparkles,
} from "lucide-react";

// ── Typy ─────────────────────────────────────────────────────

type EventStatus = "done" | "soon" | "upcoming";
type EventTab    = "polska" | "zagranica";

interface AirEventRaw {
  name:        string;
  location:    string;
  date:        string;
  dateStart:   string;
  dateEnd:     string;
  tab:         EventTab;
  note?:       string;
}

interface AirEvent extends AirEventRaw {
  status: EventStatus;
}

// ── Dane źródłowe ─────────────────────────────────────────────

const EVENTS_RAW: AirEventRaw[] = [
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
  { name: "International Sanicole Airshow",        location: "Hechtel-Eksel, Belgia", date: "12–13 września 2026",  dateStart: "2026-09-12", dateEnd: "2026-09-13", tab: "zagranica", note: "Warte uwagi" },
  { name: "NATO Days 2026",                        location: "Ostrawa, Czechy",       date: "19–20 września 2026",  dateStart: "2026-09-19", dateEnd: "2026-09-20", tab: "zagranica", note: "Blisko Polski" },
];

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

// ── Hook: scroll reveal (IntersectionObserver) ────────────────

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}

// ── Karta eventu ─────────────────────────────────────────────

function EventCard({ event, isNext, index, now }: { event: AirEvent; isNext?: boolean; index?: number; now: Date }) {
  const [hovered, setHovered] = useState(false);
  const { ref, visible } = useReveal<HTMLDivElement>();
  const days   = getDaysUntil(event.dateStart, now);
  const mabbr  = getMonthAbbr(event.dateStart);
  const isDone = event.status === "done";

  return (
    <div
      ref={ref}
      className="kl-card"
      data-done={isDone}
      data-next={isNext}
      data-hovered={hovered && !isDone}
      data-visible={visible}
      style={{ transitionDelay: visible ? `${Math.min((index ?? 0) * 0.05, 0.4)}s` : "0s" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isDone && (
        <div className={`kl-card-stripe ${isNext ? "kl-card-stripe--next" : event.status === "soon" ? "kl-card-stripe--soon" : "kl-card-stripe--upcoming"}`}/>
      )}

      <div className={`kl-date-block ${isDone ? "kl-date-block--done" : isNext ? "kl-date-block--next" : ""}`}>
        <span className="kl-date-day">{mabbr.day}</span>
        <span className="kl-date-month">{mabbr.month}</span>
      </div>

      <div className="kl-card-body">
        <div className="kl-card-top">
          <h3 className={`kl-card-title ${isDone ? "kl-card-title--done" : ""}`}>
            {event.name}
          </h3>
          <div className="kl-card-badges">
            {isNext && <span className="kl-badge kl-badge--next"><Sparkles size={9}/> Następny</span>}
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

        {/* Countdown widoczny tylko na mobile — pod meta danymi */}
        {!isDone && (
          <div className="kl-countdown-mobile">
            <span className={`kl-status-dot ${event.status === "soon" ? "kl-status-dot--soon" : "kl-status-dot--upcoming"}`}/>
            {days === 0 ? "Dziś!" : days === 1 ? "Jutro" : days > 1 ? `Za ${days} dni` : "Trwa teraz"}
          </div>
        )}
      </div>

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
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className="kl-progress-wrap" data-visible={visible}>
      <div className="kl-progress-head">
        <span className="kl-progress-label">Postęp sezonu 2026</span>
        <span className="kl-progress-pct">{pct}%</span>
      </div>
      <div className="kl-progress-track">
        <div className="kl-progress-fill" style={{ width: visible ? `${pct}%` : "0%" }}/>
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
  const [scrolled, setScrolled] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const now = useMemo(() => todayMidnight(), []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const allEvents = useMemo(() => withStatus(EVENTS_RAW, now), [now]);

  const events = useMemo(
    () => allEvents.filter(e => e.tab === tab).sort((a, b) => a.dateStart.localeCompare(b.dateStart)),
    [allEvents, tab]
  );

  const nextEvt = useMemo(
    () => events.filter(e => e.status !== "done")[0],
    [events]
  );

  const doneEvents   = events.filter(e => e.status === "done");
  const upcomingEvts = events.filter(e => e.status !== "done" && (!nextEvt || e.name !== nextEvt.name || e.dateStart !== nextEvt.dateStart));

  const polandEvents = useMemo(() => allEvents.filter(e => e.tab === "polska"), [allEvents]);

  const handleTabChange = useCallback((t: EventTab) => {
    setTab(t);
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, []);

  return (
    <>
      <style>{`
        /* ══════════════ Animacje ══════════════ */
        @keyframes kl-up      { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes kl-fade    { from{opacity:0} to{opacity:1} }
        @keyframes kl-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(.85)} }
        @keyframes kl-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes kl-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes kl-tick    { 0%{transform:translateY(6px);opacity:0} 100%{transform:translateY(0);opacity:1} }

        @media (prefers-reduced-motion: reduce) {
          .kl-wrap *, .kl-wrap *::before, .kl-wrap *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; }
        }

        /* ══════════════ Layout ══════════════ */
        .kl-wrap   { padding-top:76px; min-height:100dvh; padding-bottom:var(--space-24); overflow-x:hidden; }
        .kl-hero   { background:var(--color-surface); border-bottom:1px solid var(--color-divider); padding:clamp(var(--space-10),7vw,var(--space-20)) 0 0; position:relative; overflow:hidden; }
        .kl-hero::before {
          content:""; position:absolute; inset:0;
          background:
            radial-gradient(ellipse 60% 50% at 85% -10%, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 70%),
            radial-gradient(ellipse 40% 40% at 5% 110%, color-mix(in srgb, var(--color-gold) 6%, transparent), transparent 70%);
          pointer-events:none;
        }
        .kl-deco   { position:absolute; right:-2%; bottom:-15%; font-family:var(--font-display); font-weight:900; font-size:clamp(6rem,22vw,20rem); line-height:1; color:var(--color-text); opacity:.02; user-select:none; pointer-events:none; letter-spacing:-0.06em; animation:kl-float 8s ease-in-out infinite; }
        .kl-plane-deco { position:absolute; top:18%; left:2%; color:var(--color-accent); opacity:.08; pointer-events:none; animation:kl-float 6s ease-in-out infinite; }
        .kl-back   { display:inline-flex; align-items:center; gap:var(--space-2); font-size:var(--text-xs); font-weight:700; color:var(--color-text-faint); text-transform:uppercase; letter-spacing:.08em; margin-bottom:var(--space-6); transition:color .2s, gap .2s, transform .2s; text-decoration:none; }
        .kl-back:hover { color:var(--color-accent); gap:var(--space-2); }
        .kl-back:active { transform:scale(.96); }

        /* ══════════════ H1 ══════════════ */
        .kl-h1     { font-family:var(--font-display); font-weight:900; font-size:var(--text-2xl); letter-spacing:-0.04em; line-height:1.05; margin-bottom:var(--space-5); opacity:0; animation:kl-up .6s cubic-bezier(.16,1,.3,1) .05s forwards; }
        .kl-h1 em  { font-style:normal; background:linear-gradient(90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 55%, var(--color-gold))); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .kl-sub    { font-size:var(--text-base); color:var(--color-text-muted); max-width:52ch; line-height:1.7; margin-bottom:var(--space-8); opacity:0; animation:kl-up .6s cubic-bezier(.16,1,.3,1) .12s forwards; }

        /* ══════════════ Statystyki ══════════════ */
        .kl-stats  { display:flex; gap:var(--space-8); flex-wrap:wrap; padding-bottom:var(--space-8); border-bottom:1px solid var(--color-divider); opacity:0; animation:kl-up .6s cubic-bezier(.16,1,.3,1) .18s forwards; }
        .kl-stat   { display:flex; flex-direction:column; gap:2px; }
        .kl-stat-v { font-family:var(--font-display); font-weight:900; font-size:var(--text-xl); letter-spacing:-0.04em; line-height:1; font-variant-numeric:tabular-nums; transition:transform .2s; }
        .kl-stat:hover .kl-stat-v { transform:translateY(-2px); }
        .kl-stat-l { font-size:var(--text-xs); color:var(--color-text-faint); font-weight:600; text-transform:uppercase; letter-spacing:.07em; }

        /* ══════════════ Tabs ══════════════ */
        .kl-tabs-wrap { display:flex; gap:3px; padding:3px; background:var(--color-surface-2); border-radius:var(--radius-xl); width:fit-content; margin-top:var(--space-7); margin-bottom:-1px; opacity:0; animation:kl-up .6s cubic-bezier(.16,1,.3,1) .24s forwards; box-shadow:var(--shadow-sm); }
        .kl-tab { padding:var(--space-2) var(--space-5); border-radius:calc(var(--radius-lg) - 2px); font-size:var(--text-sm); font-weight:700; cursor:pointer; border:none; background:none; color:var(--color-text-muted); transition:background .2s cubic-bezier(.16,1,.3,1),color .2s,box-shadow .2s,transform .15s; display:inline-flex; align-items:center; gap:var(--space-2); white-space:nowrap; }
        .kl-tab:hover:not(.on) { color:var(--color-text); background:var(--color-surface-offset); }
        .kl-tab:active { transform:scale(.96); }
        .kl-tab.on  { background:var(--color-bg); color:var(--color-text); box-shadow:var(--shadow-sm); }
        .kl-tab.on svg { color:var(--color-accent); }
        .kl-tab-count { font-size:10px; font-weight:800; background:var(--color-surface-offset); padding:1px 7px; border-radius:99px; margin-left:2px; transition:color .15s,background .15s; }
        .kl-tab.on .kl-tab-count { background:color-mix(in srgb, var(--color-accent) 14%, transparent); }

        /* Sticky mini-tabs pod headerem (mobile) */
        .kl-sticky-tabs { position:sticky; top:0; z-index:20; display:none; padding:var(--space-2) var(--space-4); background:color-mix(in srgb, var(--color-bg) 92%, transparent); backdrop-filter:blur(12px); border-bottom:1px solid var(--color-divider); transition:transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s; }
        .kl-sticky-tabs[data-show="true"] { transform:translateY(0); box-shadow:var(--shadow-sm); }
        .kl-sticky-tabs[data-show="false"] { transform:translateY(-100%); }
        .kl-sticky-tabs .kl-tabs-wrap { margin:0; animation:none; opacity:1; width:100%; }
        .kl-sticky-tabs .kl-tab { flex:1; justify-content:center; }

        /* ══════════════ Progress bar ══════════════ */
        .kl-progress-wrap  { background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-xl); padding:var(--space-4) var(--space-5); margin-bottom:var(--space-6); opacity:0; transform:translateY(14px); transition:opacity .5s cubic-bezier(.16,1,.3,1), transform .5s cubic-bezier(.16,1,.3,1); }
        .kl-progress-wrap[data-visible="true"] { opacity:1; transform:translateY(0); }
        .kl-progress-head  { display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-3); }
        .kl-progress-label { font-size:var(--text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--color-text-muted); }
        .kl-progress-pct   { font-family:var(--font-display); font-weight:900; font-size:var(--text-lg); color:var(--color-accent); letter-spacing:-0.03em; font-variant-numeric:tabular-nums; }
        .kl-progress-track { height:7px; background:var(--color-surface-offset); border-radius:var(--radius-full); overflow:hidden; margin-bottom:var(--space-3); position:relative; }
        .kl-progress-fill  { height:100%; background:linear-gradient(90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 60%, var(--color-gold))); border-radius:var(--radius-full); transition:width 1.1s cubic-bezier(.16,1,.3,1) .1s; position:relative; }
        .kl-progress-fill::after { content:""; position:absolute; inset:0; background:linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent); background-size:200% 100%; animation:kl-shimmer 2.2s ease-in-out infinite; }
        .kl-progress-legend{ display:flex; gap:var(--space-5); font-size:var(--text-xs); color:var(--color-text-faint); font-weight:600; }
        .kl-progress-legend span { display:inline-flex; align-items:center; gap:4px; }

        /* ══════════════ Separatory ══════════════ */
        .kl-sep { display:flex; align-items:center; gap:var(--space-4); margin:var(--space-6) 0 var(--space-3); }
        .kl-sep-line  { flex:1; height:1px; background:var(--color-divider); }
        .kl-sep-label { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.12em; color:var(--color-text-faint); white-space:nowrap; display:inline-flex; align-items:center; gap:5px; }

        /* ══════════════ Next event hero ══════════════ */
        .kl-next-label { font-size:var(--text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--color-text-faint); margin-bottom:var(--space-3); display:flex; align-items:center; gap:var(--space-2); animation:kl-fade .5s ease both; }
        .kl-next-pulse { width:7px; height:7px; border-radius:50%; background:var(--color-accent); animation:kl-pulse 1.8s ease-in-out infinite; flex-shrink:0; box-shadow:0 0 0 4px color-mix(in srgb, var(--color-accent) 15%, transparent); }

        /* ══════════════ Karty ══════════════ */
        .kl-list  { display:flex; flex-direction:column; gap:var(--space-2); }
        .kl-card  {
          position:relative; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:var(--space-4);
          padding:var(--space-4) var(--space-5); border-radius:var(--radius-xl); background:var(--color-surface); border:1px solid var(--color-border);
          overflow:hidden; cursor:default;
          opacity:0; transform:translateY(18px);
          transition:opacity .5s cubic-bezier(.16,1,.3,1), transform .5s cubic-bezier(.16,1,.3,1), box-shadow .25s cubic-bezier(.16,1,.3,1), border-color .25s, background .25s;
        }
        .kl-card[data-visible="true"] { opacity:1; transform:translateY(0); }
        .kl-card[data-done="true"] { opacity:.55; }
        .kl-card[data-done="true"][data-visible="true"] { opacity:.55; }
        .kl-card[data-next="true"] { background:var(--color-accent-subtle); border-color:color-mix(in srgb, var(--color-accent) 40%, transparent); }
        .kl-card[data-hovered="true"]:not([data-done="true"]) { transform:translateY(-3px); box-shadow:var(--shadow-md); border-color:color-mix(in srgb, var(--color-accent) 35%, transparent); }

        .kl-card-stripe { position:absolute; left:0; top:12%; bottom:12%; width:3px; border-radius:0 var(--radius-full) var(--radius-full) 0; transition:height .2s; }
        .kl-card-stripe--next     { background:var(--color-accent); }
        .kl-card-stripe--soon     { background:var(--color-accent); opacity:.7; }
        .kl-card-stripe--upcoming { background:var(--color-gold); opacity:.6; }

        .kl-date-block { width:46px; height:50px; border-radius:var(--radius-lg); background:var(--color-surface-offset); display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; gap:0; transition:transform .25s cubic-bezier(.16,1,.3,1), background .25s; }
        .kl-card[data-hovered="true"] .kl-date-block { transform:scale(1.05); }
        .kl-date-block--done { opacity:.6; }
        .kl-date-block--next { background:var(--color-accent); box-shadow:0 4px 14px color-mix(in srgb, var(--color-accent) 35%, transparent); }
        .kl-date-block--next .kl-date-day   { color:#fff; }
        .kl-date-block--next .kl-date-month { color:rgba(255,255,255,.75); }
        .kl-date-day   { font-family:var(--font-display); font-weight:900; font-size:var(--text-base); line-height:1; letter-spacing:-0.02em; color:var(--color-text); font-variant-numeric:tabular-nums; }
        .kl-date-month { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--color-text-faint); margin-top:2px; }

        .kl-card-body   { min-width:0; display:flex; flex-direction:column; gap:var(--space-2); }
        .kl-card-top    { display:flex; align-items:center; gap:var(--space-2); flex-wrap:wrap; }
        .kl-card-title  { font-family:var(--font-display); font-weight:800; font-size:var(--text-base); letter-spacing:-0.02em; color:var(--color-text); overflow:hidden; text-overflow:ellipsis; line-height:1.25; }
        .kl-card-title--done { color:var(--color-text-muted); }
        .kl-card-meta   { display:flex; align-items:center; gap:var(--space-2); flex-wrap:wrap; }
        .kl-meta-item   { display:inline-flex; align-items:center; gap:4px; font-size:var(--text-xs); color:var(--color-text-muted); font-weight:500; }
        .kl-meta-dot    { width:3px; height:3px; border-radius:50%; background:var(--color-text-faint); flex-shrink:0; }

        .kl-card-badges { display:flex; gap:4px; flex-wrap:wrap; }
        .kl-badge       { display:inline-flex; align-items:center; gap:3px; padding:2px 8px; border-radius:99px; font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; flex-shrink:0; white-space:nowrap; }
        .kl-badge--next { background:var(--color-accent); color:#fff; }
        .kl-badge--done { background:var(--color-surface-offset); color:var(--color-text-faint); }
        .kl-badge--geo  { background:color-mix(in srgb, var(--color-primary,#01696f) 12%, transparent); color:var(--color-primary,#01696f); border:1px solid color-mix(in srgb, var(--color-primary,#01696f) 25%, transparent); }
        .kl-badge--star { background:var(--color-gold-subtle); color:var(--color-gold); border:1px solid color-mix(in srgb, var(--color-gold) 25%, transparent); }
        .kl-badge--warn { background:color-mix(in srgb, var(--color-gold) 10%, transparent); color:var(--color-gold); border:1px solid color-mix(in srgb, var(--color-gold) 25%, transparent); opacity:.85; }

        .kl-card-right    { display:flex; flex-direction:column; align-items:flex-end; gap:var(--space-2); flex-shrink:0; }
        .kl-countdown     { display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:46px; padding:var(--space-2) var(--space-2); border-radius:var(--radius-lg); background:var(--color-surface-offset); border:1px solid var(--color-border); animation:kl-tick .3s cubic-bezier(.16,1,.3,1) both; }
        .kl-countdown--next { background:var(--color-accent-subtle); border-color:color-mix(in srgb, var(--color-accent) 30%, transparent); }
        .kl-countdown--next .kl-countdown-num { color:var(--color-accent); }
        .kl-countdown-num { font-family:var(--font-display); font-weight:900; font-size:var(--text-base); line-height:1; letter-spacing:-0.03em; font-variant-numeric:tabular-nums; color:var(--color-text); }
        .kl-countdown-label { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--color-text-faint); margin-top:1px; }
        .kl-status-dot    { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .kl-status-dot--done     { background:var(--color-text-faint); }
        .kl-status-dot--soon     { background:var(--color-accent); animation:kl-pulse 1.5s ease-in-out infinite; }
        .kl-status-dot--upcoming { background:var(--color-gold); }

        /* Countdown mobilny — ukryty na desktopie, widoczny <600px */
        .kl-countdown-mobile { display:none; align-items:center; gap:6px; font-size:11px; font-weight:700; color:var(--color-text-muted); margin-top:2px; }

        /* ══════════════ CTA banner ══════════════ */
        .kl-cta { margin-top:var(--space-12); padding:var(--space-8); border-radius:var(--radius-2xl); background:var(--color-accent-subtle); border:1px solid color-mix(in srgb, var(--color-accent) 35%, transparent); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-5); position:relative; overflow:hidden; }
        .kl-cta-deco { position:absolute; right:-2%; bottom:-20%; font-family:var(--font-display); font-weight:900; font-size:clamp(5rem,14vw,12rem); line-height:1; color:var(--color-accent); opacity:.06; user-select:none; pointer-events:none; letter-spacing:-0.05em; animation:kl-float 7s ease-in-out infinite; }
        .kl-cta-btn { display:inline-flex; align-items:center; gap:var(--space-2); padding:var(--space-3) var(--space-6); border-radius:var(--radius-md); background:var(--color-accent); color:#fff; font-weight:700; font-size:var(--text-sm); text-decoration:none; white-space:nowrap; flex-shrink:0; transition:background .2s, transform .2s cubic-bezier(.16,1,.3,1), box-shadow .2s; box-shadow:0 2px 12px color-mix(in srgb, var(--color-accent) 35%, transparent); }
        .kl-cta-btn:hover { background:var(--color-accent-hover); transform:translateY(-2px); box-shadow:0 8px 22px color-mix(in srgb, var(--color-accent) 45%, transparent); }
        .kl-cta-btn:active { transform:scale(.96) translateY(0); }
        .kl-cta-btn svg { transition:transform .2s; }
        .kl-cta-btn:hover svg { transform:translateX(3px); }

        .kl-empty { text-align:center; padding:var(--space-12) var(--space-6); color:var(--color-text-faint); animation:kl-fade .4s ease both; }

        /* ══════════════ Mobile (≤600px) ══════════════ */
        @media(max-width:600px) {
          .kl-wrap { padding-top:64px; }
          .kl-hero { padding-top:var(--space-8); }
          .kl-h1 { font-size:clamp(1.7rem,8vw,2.2rem); }
          .kl-sub { font-size:var(--text-sm); margin-bottom:var(--space-6); }
          .kl-stats { gap:var(--space-6); padding-bottom:var(--space-6); }
          .kl-stat-v { font-size:var(--text-lg); }
          .kl-tabs-wrap { width:100%; margin-top:var(--space-5); }
          .kl-tab { flex:1; justify-content:center; padding:var(--space-3) var(--space-3); }
          .kl-sticky-tabs { display:block; }

          .kl-card { grid-template-columns:auto 1fr; padding:var(--space-3) var(--space-4); gap:var(--space-3); }
          .kl-card-right { display:none; }
          .kl-countdown-mobile { display:flex; }
          .kl-date-block { width:40px; height:44px; }
          .kl-card-title { font-size:var(--text-sm); white-space:normal; }

          .kl-cta { flex-direction:column; align-items:flex-start; padding:var(--space-6); }
          .kl-cta-btn { width:100%; justify-content:center; }
        }

        @media(max-width:380px) {
          .kl-stats { gap:var(--space-4); }
          .kl-badge { font-size:8px; padding:2px 6px; }
        }
      `}</style>

      <div className="kl-wrap">

        {/* ── Sticky mini tabs (mobile) ── */}
        <div className="kl-sticky-tabs" data-show={scrolled}>
          <div className="kl-tabs-wrap">
            {(["polska", "zagranica"] as EventTab[]).map(t => (
              <button key={t} className={`kl-tab ${tab === t ? "on" : ""}`} onClick={() => handleTabChange(t)}>
                {t === "polska" ? <Plane size={13}/> : <Globe size={13}/>}
                {t === "polska" ? "Polska" : "Zagranica"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="kl-hero">
          <div aria-hidden className="kl-deco">2026</div>
          <Plane aria-hidden size={64} className="kl-plane-deco"/>

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

            <div className="kl-tabs-wrap">
              {(["polska", "zagranica"] as EventTab[]).map(t => (
                <button key={t} className={`kl-tab ${tab === t ? "on" : ""}`} onClick={() => handleTabChange(t)}>
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