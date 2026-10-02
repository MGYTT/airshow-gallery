"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Globe2,
  MapPin,
  Plane,
  Sparkles,
} from "lucide-react";
import EventCard from "@/components/calendar/EventCard";
import CalendarFilters, {
  type CalendarFilterState,
} from "@/components/calendar/CalendarFilters";
import type {
  AirshowEventStatus,
  MappedAirshowEvent,
} from "@/lib/supabase/types";

interface KalendarzClientProps {
  events: MappedAirshowEvent[];
}

const INITIAL_FILTERS: CalendarFilterState = {
  search: "",
  countryCode: "all",
  month: "all",
  eventType: "all",
  admissionType: "all",
  showPast: false,
};

function dateAtStartOfDay(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date(0);
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
}

function eventIsPast(event: MappedAirshowEvent) {
  if (event.status === "completed" || event.status === "cancelled") {
    return true;
  }

  const endDate = dateAtStartOfDay(event.endDate ?? event.startDate);
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0
  );

  return endDate < startOfToday;
}

function getMonthKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(value: string) {
  const date = new Date(`${value}-01T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pl-PL", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getStatusLabel(status: AirshowEventStatus) {
  const labels: Record<AirshowEventStatus, string> = {
    scheduled: "zaplanowane",
    rescheduled: "ze zmienionym terminem",
    postponed: "przełożone",
    cancelled: "odwołane",
    completed: "zakończone",
  };

  return labels[status];
}

export default function KalendarzClient({ events }: KalendarzClientProps) {
  const [filters, setFilters] = useState<CalendarFilterState>(INITIAL_FILTERS);

  const countries = useMemo(() => {
    const byCode = new Map<string, string>();

    for (const event of events) {
      if (event.countryCode && event.country) {
        byCode.set(event.countryCode, event.country);
      }
    }

    return [...byCode.entries()]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pl"));
  }, [events]);

  const months = useMemo(() => {
    return [...new Set(events.map((event) => getMonthKey(event.startDate)).filter(Boolean))]
      .sort()
      .map((value) => ({
        value,
        label: getMonthLabel(value),
      }));
  }, [events]);

  const filteredEvents = useMemo(() => {
    const search = filters.search.trim().toLocaleLowerCase("pl-PL");

    return events.filter((event) => {
      const text = [
        event.name,
        event.city,
        event.country,
        event.venueName,
        event.shortDescription,
        event.longDescription,
      ]
        .join(" ")
        .toLocaleLowerCase("pl-PL");

      const matchesSearch = !search || text.includes(search);
      const matchesCountry =
        filters.countryCode === "all" ||
        event.countryCode === filters.countryCode;
      const matchesMonth =
        filters.month === "all" ||
        getMonthKey(event.startDate) === filters.month;
      const matchesType =
        filters.eventType === "all" ||
        event.eventType === filters.eventType;
      const matchesAdmission =
        filters.admissionType === "all" ||
        event.admissionType === filters.admissionType;
      const matchesTime = filters.showPast || !eventIsPast(event);

      return (
        matchesSearch &&
        matchesCountry &&
        matchesMonth &&
        matchesType &&
        matchesAdmission &&
        matchesTime
      );
    });
  }, [events, filters]);

  const nextEvent = useMemo(() => {
    return filteredEvents.find((event) => !eventIsPast(event) && event.status !== "cancelled");
  }, [filteredEvents]);

  const upcomingEvents = useMemo(() => {
    return filteredEvents.filter(
      (event) =>
        event.id !== nextEvent?.id &&
        !eventIsPast(event) &&
        event.status !== "cancelled"
    );
  }, [filteredEvents, nextEvent]);

  const pastEvents = useMemo(() => {
    return filteredEvents.filter(
      (event) =>
        event.id !== nextEvent?.id &&
        (eventIsPast(event) || event.status === "cancelled")
    );
  }, [filteredEvents, nextEvent]);

  const totalUpcoming = useMemo(() => {
    return events.filter(
      (event) => !eventIsPast(event) && event.status !== "cancelled"
    ).length;
  }, [events]);

  const totalCompleted = useMemo(() => {
    return events.filter((event) => eventIsPast(event)).length;
  }, [events]);

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const currentYearEvents = useMemo(() => {
    return events.filter(
      (event) => new Date(event.startDate).getFullYear() === currentYear
    );
  }, [events, currentYear]);

  const currentYearUpcoming = useMemo(() => {
    return currentYearEvents.filter(
      (event) => !eventIsPast(event) && event.status !== "cancelled"
    );
  }, [currentYearEvents]);

  const nextYearEvents = useMemo(() => {
    return events.filter(
      (event) => new Date(event.startDate).getFullYear() === nextYear
    );
  }, [events, nextYear]);

  const hasActiveFilters =
    filters.search !== INITIAL_FILTERS.search ||
    filters.countryCode !== INITIAL_FILTERS.countryCode ||
    filters.month !== INITIAL_FILTERS.month ||
    filters.eventType !== INITIAL_FILTERS.eventType ||
    filters.admissionType !== INITIAL_FILTERS.admissionType ||
    filters.showPast !== INITIAL_FILTERS.showPast;

  const seasonFinished =
    currentYearEvents.length > 0 && currentYearUpcoming.length === 0;
  const nextYearIsEmpty = nextYearEvents.length === 0;

  const totalCountries = countries.length;

  return (
    <>
      <style>{`
        .calendar-page{min-height:100dvh;padding-top:64px;padding-bottom:clamp(var(--space-16),8vw,var(--space-24));overflow-x:hidden}
        .calendar-hero{
          position:relative;
          overflow:hidden;
          padding:clamp(var(--space-10),7vw,var(--space-20)) 0 clamp(var(--space-12),8vw,var(--space-24));
          border-bottom:1px solid var(--color-divider);
          background:
            linear-gradient(180deg,color-mix(in srgb,var(--color-surface-offset) 72%,transparent),transparent 72%),
            var(--color-surface);
        }
        .calendar-hero::before{
          content:"";
          position:absolute;
          inset:0;
          pointer-events:none;
          background:
            linear-gradient(90deg,color-mix(in srgb,var(--color-divider) 38%,transparent) 1px,transparent 1px),
            linear-gradient(color-mix(in srgb,var(--color-divider) 28%,transparent) 1px,transparent 1px),
            radial-gradient(ellipse 60% 70% at 100% 0%,color-mix(in srgb,var(--color-accent) 11%,transparent),transparent 70%),
            radial-gradient(ellipse 44% 58% at 0% 100%,color-mix(in srgb,var(--color-gold) 8%,transparent),transparent 74%);
          background-size:48px 48px,48px 48px,auto,auto;
          mask-image:linear-gradient(to bottom,black,transparent 92%);
        }
        .calendar-hero-deco{
          position:absolute;
          right:-1%;
          bottom:-18%;
          font-family:var(--font-display);
          font-size:clamp(7rem,23vw,20rem);
          line-height:1;
          font-weight:900;
          letter-spacing:-.07em;
          color:var(--color-text);
          opacity:.025;
          user-select:none;
          pointer-events:none;
        }
        .calendar-hero-plane{
          position:absolute;
          top:18%;
          right:clamp(var(--space-6),8vw,var(--space-24));
          color:var(--color-accent);
          opacity:.09;
          transform:rotate(-15deg);
          pointer-events:none;
        }
        .calendar-back{
          display:inline-flex;
          align-items:center;
          gap:var(--space-2);
          color:var(--color-text-faint);
          font-size:var(--text-xs);
          font-weight:800;
          letter-spacing:.08em;
          text-transform:uppercase;
          text-decoration:none;
          margin-bottom:var(--space-6);
        }
        .calendar-back:hover{color:var(--color-accent)}
        .calendar-title{
          max-width:14ch;
          font-family:var(--font-display);
          font-weight:950;
          font-size:clamp(2.8rem,7vw,5.8rem);
          line-height:.94;
          letter-spacing:-.06em;
          margin-bottom:var(--space-5);
        }
        .calendar-title-accent{color:var(--color-accent)}
        .calendar-subtitle{
          max-width:58ch;
          font-size:clamp(var(--text-sm),1.6vw,var(--text-base));
          color:var(--color-text-muted);
          line-height:1.75;
        }
        .calendar-hero-meta{
          display:flex;
          align-items:center;
          gap:var(--space-3);
          flex-wrap:wrap;
          margin-bottom:var(--space-5);
        }
        .calendar-year-pill{
          display:inline-flex;
          align-items:center;
          gap:var(--space-2);
          min-height:34px;
          padding:0 var(--space-3);
          border-radius:var(--radius-full);
          color:var(--color-accent);
          background:var(--color-accent-subtle);
          border:1px solid color-mix(in srgb,var(--color-accent) 26%,transparent);
          font-size:var(--text-xs);
          font-weight:850;
          letter-spacing:.06em;
          text-transform:uppercase;
        }
        .calendar-stats{
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:var(--space-3);
          max-width:850px;
          margin-top:var(--space-10);
        }
        .calendar-stat{
          position:relative;
          min-width:0;
          padding:var(--space-4);
          border:1px solid var(--color-border);
          border-radius:var(--radius-xl);
          background:color-mix(in srgb,var(--color-surface) 86%,transparent);
          backdrop-filter:blur(10px);
          box-shadow:0 10px 30px rgba(0,0,0,.035);
        }
        .calendar-stat::after{
          content:"";
          position:absolute;
          top:var(--space-3);
          right:var(--space-3);
          width:7px;
          height:7px;
          border-radius:50%;
          background:var(--color-divider);
        }
        .calendar-stat--accent::after{background:var(--color-accent);box-shadow:0 0 0 4px var(--color-accent-subtle)}
        .calendar-stat-value{
          display:block;
          font-family:var(--font-display);
          font-size:var(--text-xl);
          font-weight:900;
          letter-spacing:-.045em;
          line-height:1;
          font-variant-numeric:tabular-nums;
        }
        .calendar-stat-label{
          display:block;
          margin-top:var(--space-2);
          font-size:var(--text-xs);
          font-weight:700;
          letter-spacing:.07em;
          text-transform:uppercase;
          color:var(--color-text-faint);
        }
        .calendar-content{
          max-width:var(--content-default);
          margin:-34px auto 0;
          padding:0 clamp(var(--space-4),4vw,var(--space-8)) var(--space-8);
          position:relative;
          z-index:2;
        }
        .calendar-section-heading{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:var(--space-4);
          flex-wrap:wrap;
          margin-top:var(--space-10);
          margin-bottom:var(--space-5);
        }
        .calendar-section-title{
          display:flex;
          align-items:center;
          gap:var(--space-2);
          font-family:var(--font-display);
          font-size:var(--text-lg);
          font-weight:900;
          letter-spacing:-.025em;
        }
        .calendar-section-count{
          color:var(--color-text-faint);
          font-family:var(--font-body);
          font-size:var(--text-sm);
          font-weight:600;
        }
        .calendar-section-line{
          flex:1;
          min-width:80px;
          height:1px;
          background:var(--color-divider);
        }
        .calendar-list{display:flex;flex-direction:column;gap:var(--space-3)}
        .calendar-next-label{
          display:inline-flex;
          align-items:center;
          gap:var(--space-2);
          margin-bottom:var(--space-3);
          color:var(--color-accent);
          font-size:var(--text-xs);
          font-weight:800;
          text-transform:uppercase;
          letter-spacing:.09em;
        }
        .calendar-next-pulse{
          width:8px;
          height:8px;
          border-radius:var(--radius-full);
          background:var(--color-accent);
          box-shadow:0 0 0 4px var(--color-accent-subtle-2);
        }
        .calendar-empty{
          padding:var(--space-16) var(--space-6);
          border:1px dashed var(--color-border-strong);
          border-radius:var(--radius-xl);
          text-align:center;
          color:var(--color-text-muted);
          background:var(--color-surface);
        }
        .calendar-empty-icon{
          width:50px;
          height:50px;
          display:grid;
          place-items:center;
          margin:0 auto var(--space-4);
          border-radius:var(--radius-full);
          color:var(--color-text-faint);
          background:var(--color-surface-offset);
        }
        .calendar-empty-title{
          font-family:var(--font-display);
          font-size:var(--text-lg);
          font-weight:800;
          letter-spacing:-.02em;
          margin-bottom:var(--space-2);
        }
        .calendar-empty-text{
          font-size:var(--text-sm);
          color:var(--color-text-faint);
          margin:0 auto var(--space-5);
        }
        .calendar-season-finished{
          position:relative;
          overflow:hidden;
          margin-top:var(--space-8);
          padding:clamp(var(--space-6),5vw,var(--space-10));
          border:1px solid color-mix(in srgb,var(--color-accent) 26%,var(--color-divider));
          border-radius:var(--radius-2xl);
          background:
            radial-gradient(circle at 100% 0%,color-mix(in srgb,var(--color-accent) 10%,transparent),transparent 38%),
            var(--color-surface);
        }
        .calendar-season-finished::after{
          content:"✈";
          position:absolute;
          right:-1rem;
          bottom:-3.25rem;
          font-size:clamp(7rem,17vw,12rem);
          line-height:1;
          color:var(--color-accent);
          opacity:.045;
          transform:rotate(-12deg);
          pointer-events:none;
        }
        .calendar-season-kicker{
          display:inline-flex;
          align-items:center;
          gap:var(--space-2);
          margin-bottom:var(--space-3);
          color:var(--color-accent);
          font-size:var(--text-xs);
          font-weight:800;
          letter-spacing:.09em;
          text-transform:uppercase;
        }
        .calendar-season-title{
          position:relative;
          z-index:1;
          max-width:24ch;
          font-family:var(--font-display);
          font-size:var(--text-xl);
          font-weight:900;
          letter-spacing:-.035em;
          line-height:1.08;
          margin-bottom:var(--space-3);
        }
        .calendar-season-copy{
          position:relative;
          z-index:1;
          max-width:64ch;
          color:var(--color-text-muted);
          font-size:var(--text-sm);
          line-height:1.7;
        }
        .calendar-next-year-note{
          position:relative;
          z-index:1;
          display:flex;
          align-items:flex-start;
          gap:var(--space-3);
          max-width:720px;
          margin-top:var(--space-6);
          padding:var(--space-5);
          border:1px solid var(--color-divider);
          border-radius:var(--radius-xl);
          background:var(--color-surface-offset);
        }
        .calendar-next-year-note strong{
          display:block;
          margin-bottom:var(--space-1);
          color:var(--color-text);
          font-family:var(--font-display);
          font-size:var(--text-base);
          font-weight:850;
        }
        .calendar-next-year-note p{
          color:var(--color-text-muted);
          font-size:var(--text-sm);
          line-height:1.6;
        }
        .calendar-season-actions{
          position:relative;
          z-index:1;
          display:flex;
          gap:var(--space-3);
          flex-wrap:wrap;
          margin-top:var(--space-6);
        }
        .calendar-cta{
          position:relative;
          overflow:hidden;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:var(--space-6);
          flex-wrap:wrap;
          margin-top:var(--space-12);
          padding:var(--space-8);
          border:1px solid color-mix(in srgb,var(--color-accent) 30%,transparent);
          border-radius:var(--radius-2xl);
          background:var(--color-accent-subtle);
        }
        .calendar-cta-deco{
          position:absolute;
          right:-2%;
          bottom:-26%;
          color:var(--color-accent);
          opacity:.06;
          font-family:var(--font-display);
          font-size:clamp(7rem,16vw,13rem);
          font-weight:900;
          line-height:1;
          pointer-events:none;
        }
        .calendar-cta-title{
          position:relative;
          font-family:var(--font-display);
          font-size:var(--text-lg);
          font-weight:900;
          letter-spacing:-.025em;
          margin-bottom:var(--space-2);
        }
        .calendar-cta-copy{
          position:relative;
          font-size:var(--text-sm);
          color:var(--color-text-muted);
          line-height:1.6;
        }
        @media(max-width:640px){
          .calendar-page{padding-top:64px}
          .calendar-hero{padding-block:var(--space-10)}
          .calendar-title{font-size:clamp(2rem,10vw,3rem)}
          .calendar-subtitle{font-size:var(--text-sm)}
          .calendar-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-3);margin-top:var(--space-8)}
          .calendar-stat{padding:var(--space-3)}
          .calendar-stat-value{font-size:var(--text-lg)}
          .calendar-content{margin-top:-22px;padding-top:0}
          .calendar-cta{padding:var(--space-6)}
          .calendar-cta .btn{width:100%}
        }
      `}</style>

      <main className="calendar-page">
        <section className="calendar-hero">
          <div className="calendar-hero-deco" aria-hidden>
            AIR
          </div>
          <Plane size={76} className="calendar-hero-plane" aria-hidden />

          <div className="container--narrow" style={{ position:"relative", zIndex:1 }}>
            <Link href="/" className="calendar-back">
              <ChevronRight size={13} style={{ transform:"rotate(180deg)" }} />
              Strona główna
            </Link>

            <div className="calendar-hero-meta">
              <span className="badge">
                <CalendarDays size={12} />
                Aktualny kalendarz
              </span>
              <span className="calendar-year-pill">
                <Sparkles size={12} />
                Sezon {currentYear}
              </span>
            </div>

            <h1 className="calendar-title">
              Kalendarz pokazów <span className="calendar-title-accent">lotniczych</span>
            </h1>

            <p className="calendar-subtitle">
              Terminy, lokalizacje, program, bilety, parking i wskazówki dla fotografów.
              Każde wydarzenie prowadzi do osobnego przewodnika z aktualizacjami oraz źródłami.
            </p>

            <div className="calendar-stats" aria-label="Statystyki kalendarza">
              <div className="calendar-stat">
                <span className="calendar-stat-value">{events.length}</span>
                <span className="calendar-stat-label">Opublikowanych wydarzeń</span>
              </div>

              <div className="calendar-stat calendar-stat--accent">
                <span className="calendar-stat-value" style={{ color:"var(--color-accent)" }}>
                  {totalUpcoming}
                </span>
                <span className="calendar-stat-label">Przed nami</span>
              </div>

              <div className="calendar-stat">
                <span className="calendar-stat-value">{totalCountries}</span>
                <span className="calendar-stat-label">Kraje w kalendarzu</span>
              </div>

              <div className="calendar-stat">
                <span className="calendar-stat-value" style={{ color:"var(--color-text-muted)" }}>
                  {totalCompleted}
                </span>
                <span className="calendar-stat-label">Archiwalne terminy</span>
              </div>
            </div>
          </div>
        </section>

        <div className="calendar-content">
          <CalendarFilters
            filters={filters}
            countries={countries}
            months={months}
            resultsCount={filteredEvents.length}
            onChange={setFilters}
            onReset={() => setFilters(INITIAL_FILTERS)}
          />

          {seasonFinished && nextYearIsEmpty && !hasActiveFilters && (
            <section
              className="calendar-season-finished"
              aria-labelledby="season-finished-heading"
            >
              <p className="calendar-season-kicker">
                <CheckCircle2 size={15} />
                Sezon {currentYear}
              </p>

              <h2 id="season-finished-heading" className="calendar-season-title">
                Sezon pokazów {currentYear} dobiegł końca
              </h2>

              <p className="calendar-season-copy">
                Na ten rok nie mamy już nadchodzących wydarzeń w kalendarzu.
                Zakończone terminy nadal możesz wyświetlić w archiwum.
              </p>

              <div className="calendar-next-year-note">
                <Sparkles size={20} color="var(--color-gold)" aria-hidden />
                <div>
                  <strong>Kalendarz {nextYear}</strong>
                  <p>
                    Nie dodano jeszcze żadnych wydarzeń na {nextYear} rok.
                    Kalendarz będzie uzupełniany wraz z pojawianiem się
                    oficjalnych terminów organizatorów.
                  </p>
                </div>
              </div>

              <div className="calendar-season-actions">
                <button
                  className="btn btn-ghost"
                  onClick={() =>
                    setFilters({ ...INITIAL_FILTERS, showPast: true })
                  }
                >
                  Zobacz zakończone wydarzenia {currentYear}
                </button>
              </div>
            </section>
          )}

          {nextEvent && (
            <section style={{ marginTop:"var(--space-8)" }} aria-labelledby="next-event-heading">
              <p className="calendar-next-label">
                <span className="calendar-next-pulse" aria-hidden />
                Najbliższe wydarzenie
              </p>

              <h2 id="next-event-heading" className="sr-only">
                Najbliższe wydarzenie w kalendarzu
              </h2>

              <EventCard event={nextEvent} isNext />
            </section>
          )}

          {upcomingEvents.length > 0 && (
            <section aria-labelledby="upcoming-events-heading">
              <div className="calendar-section-heading">
                <h2 id="upcoming-events-heading" className="calendar-section-title">
                  <Clock3 size={19} color="var(--color-gold)" />
                  Nadchodzące wydarzenia
                  <span className="calendar-section-count">({upcomingEvents.length})</span>
                </h2>
                <span className="calendar-section-line" aria-hidden />
              </div>

              <div className="calendar-list">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {pastEvents.length > 0 && filters.showPast && (
            <section aria-labelledby="past-events-heading">
              <div className="calendar-section-heading">
                <h2 id="past-events-heading" className="calendar-section-title">
                  <CheckCircle2 size={19} color="var(--color-text-faint)" />
                  Zakończone i archiwalne
                  <span className="calendar-section-count">({pastEvents.length})</span>
                </h2>
                <span className="calendar-section-line" aria-hidden />
              </div>

              <div className="calendar-list">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} compact />
                ))}
              </div>
            </section>
          )}

          {hasActiveFilters &&
            !nextEvent &&
            upcomingEvents.length === 0 &&
            pastEvents.length === 0 && (
            <section className="calendar-empty">
              <div className="calendar-empty-icon">
                <MapPin size={23} />
              </div>
              <h2 className="calendar-empty-title">
                Nie znaleziono wydarzeń
              </h2>
              <p className="calendar-empty-text">
                Zmień filtry albo sprawdź ponownie później — kalendarz jest aktualizowany ręcznie na podstawie informacji organizatorów.
              </p>
              <button className="btn btn-ghost" onClick={() => setFilters(INITIAL_FILTERS)}>
                Wyczyść filtry
              </button>
            </section>
          )}

          {events.length === 0 && !hasActiveFilters && (
            <section className="calendar-empty">
              <div className="calendar-empty-icon">
                <CalendarDays size={23} />
              </div>
              <h2 className="calendar-empty-title">
                Kalendarz jest aktualizowany
              </h2>
              <p className="calendar-empty-text">
                Pierwsze wydarzenia pojawią się tutaj po weryfikacji terminów i informacji organizatorów.
              </p>
            </section>
          )}

          <aside className="calendar-cta">
            <span className="calendar-cta-deco" aria-hidden>✈</span>

            <div style={{ position:"relative", zIndex:1 }}>
              <h2 className="calendar-cta-title">
                Zdjęcia z poprzednich edycji
              </h2>
              <p className="calendar-cta-copy">
                Zobacz autorskie galerie i relacje z wydarzeń, na których byłem.
              </p>
            </div>

            <Link href="/gallery" className="btn btn-primary" style={{ position:"relative", zIndex:1 }}>
              Przeglądaj galerię
              <ChevronRight size={16} />
            </Link>
          </aside>

          {events.some((event) => event.status === "rescheduled" || event.status === "postponed" || event.status === "cancelled") && (
            <p style={{ marginTop:"var(--space-6)", fontSize:"var(--text-xs)", color:"var(--color-text-faint)", lineHeight:1.6 }}>
              Statusy wydarzeń są aktualizowane na podstawie informacji organizatorów. W przypadku wydarzenia {getStatusLabel("rescheduled")} lub odwołanego zawsze sprawdź oficjalny link przed wyjazdem.
            </p>
          )}

          <p style={{ marginTop:"var(--space-4)", fontSize:"var(--text-xs)", color:"var(--color-text-faint)", lineHeight:1.6 }}>
            Informacje w kalendarzu mają charakter informacyjny. Przed podróżą potwierdź program, bilety, parking oraz zasady wejścia na oficjalnej stronie organizatora.
          </p>
        </div>
      </main>
    </>
  );
}