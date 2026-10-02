"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type {
  AirshowAdmissionType,
  AirshowEventType,
} from "@/lib/supabase/types";

export interface CalendarFilterState {
  search: string;
  countryCode: string;
  month: string;
  eventType: AirshowEventType | "all";
  admissionType: AirshowAdmissionType | "all";
  showPast: boolean;
}

interface CalendarFiltersProps {
  filters: CalendarFilterState;
  countries: Array<{ code: string; name: string }>;
  months: Array<{ value: string; label: string }>;
  resultsCount: number;
  onChange: (next: CalendarFilterState) => void;
  onReset: () => void;
}

const EVENT_TYPES: Array<{ value: AirshowEventType | "all"; label: string }> = [
  { value: "all", label: "Wszystkie typy" },
  { value: "mixed", label: "Lotniczo-obronne" },
  { value: "military", label: "Wojskowe" },
  { value: "civil", label: "Cywilne" },
  { value: "aerobatic", label: "Akrobacyjne" },
  { value: "other", label: "Inne" },
];

const ADMISSION_TYPES: Array<{ value: AirshowAdmissionType | "all"; label: string }> = [
  { value: "all", label: "Wstęp: wszystkie" },
  { value: "free", label: "Wstęp bezpłatny" },
  { value: "ticketed", label: "Bilety" },
  { value: "registration_required", label: "Rejestracja" },
  { value: "unknown", label: "Wstęp: sprawdź organizatora" },
];

export default function CalendarFilters({
  filters,
  countries,
  months,
  resultsCount,
  onChange,
  onReset,
}: CalendarFiltersProps) {
  const hasFilters =
    Boolean(filters.search) ||
    filters.countryCode !== "all" ||
    filters.month !== "all" ||
    filters.eventType !== "all" ||
    filters.admissionType !== "all" ||
    filters.showPast;

  function setFilter<K extends keyof CalendarFilterState>(
    key: K,
    value: CalendarFilterState[K]
  ) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <>
      <style>{`
        .calendar-filters{
          position:relative;
          overflow:hidden;
          padding:var(--space-5);
          background:
            linear-gradient(180deg,color-mix(in srgb,var(--color-surface-offset) 55%,transparent),transparent 42%),
            var(--color-surface);
          border:1px solid var(--color-border);
          border-radius:var(--radius-2xl);
          box-shadow:0 18px 50px rgba(0,0,0,.06);
        }
        .calendar-filters::before{
          content:"";
          position:absolute;
          inset:0 auto 0 0;
          width:3px;
          background:linear-gradient(180deg,var(--color-accent),var(--color-gold));
        }
        .calendar-filters-header{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:var(--space-4);
          margin-bottom:var(--space-5);
          padding-bottom:var(--space-4);
          border-bottom:1px solid var(--color-divider);
        }
        .calendar-filters-title-wrap{display:flex;align-items:flex-start;gap:var(--space-3)}
        .calendar-filters-icon{
          width:36px;height:36px;display:grid;place-items:center;flex:0 0 auto;
          border-radius:var(--radius-lg);
          color:var(--color-accent);
          background:var(--color-accent-subtle);
          border:1px solid color-mix(in srgb,var(--color-accent) 24%,transparent);
        }
        .calendar-filters-title{
          display:block;
          font-family:var(--font-display);
          font-size:var(--text-base);
          font-weight:900;
          letter-spacing:-.02em;
          color:var(--color-text);
        }
        .calendar-filters-subtitle{
          margin-top:2px;
          font-size:var(--text-xs);
          color:var(--color-text-faint);
          line-height:1.45;
        }
        .calendar-filters-count{
          display:inline-flex;
          align-items:center;
          min-height:30px;
          padding:0 var(--space-3);
          border-radius:var(--radius-full);
          background:var(--color-surface-offset);
          border:1px solid var(--color-border);
          font-size:var(--text-xs);
          font-weight:800;
          color:var(--color-text-muted);
          font-variant-numeric:tabular-nums;
          white-space:nowrap;
        }
        .calendar-filter-grid{
          display:grid;
          grid-template-columns:minmax(220px,2fr) repeat(4,minmax(150px,1fr));
          gap:var(--space-3);
        }
        .calendar-filter-search{position:relative}
        .calendar-filter-search svg{
          position:absolute;
          left:var(--space-3);
          top:50%;
          transform:translateY(-50%);
          color:var(--color-text-faint);
          pointer-events:none;
        }
        .calendar-filter-input,
        .calendar-filter-select{
          width:100%;
          min-height:44px;
          border:1.5px solid var(--color-border-strong);
          border-radius:var(--radius-lg);
          background:color-mix(in srgb,var(--color-surface) 92%,var(--color-surface-offset));
          color:var(--color-text);
          font-size:var(--text-sm);
          outline:none;
        }
        .calendar-filter-input{
          padding:var(--space-2) var(--space-10) var(--space-2) var(--space-10);
        }
        .calendar-filter-select{
          padding:var(--space-2) var(--space-3);
        }
        .calendar-filter-input:hover,
        .calendar-filter-select:hover{border-color:color-mix(in srgb,var(--color-accent) 32%,var(--color-border-strong))}
        .calendar-filter-input:focus,
        .calendar-filter-select:focus{
          border-color:var(--color-accent);
          background:var(--color-surface);
          box-shadow:var(--focus-ring);
        }
        .calendar-filter-clear{
          position:absolute;
          right:var(--space-2);
          top:50%;
          transform:translateY(-50%);
          width:30px;
          height:30px;
          display:flex;
          align-items:center;
          justify-content:center;
          color:var(--color-text-faint);
          border-radius:var(--radius-sm);
        }
        .calendar-filter-clear:hover{
          color:var(--color-text);
          background:var(--color-surface-offset);
        }
        .calendar-filter-bottom{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:var(--space-4);
          flex-wrap:wrap;
          margin-top:var(--space-4);
        }
        .calendar-filter-checkbox{
          display:inline-flex;
          align-items:center;
          gap:var(--space-2);
          min-height:34px;
          padding:0 var(--space-3);
          border-radius:var(--radius-full);
          border:1px solid var(--color-border);
          background:var(--color-surface-offset);
          font-size:var(--text-xs);
          font-weight:700;
          color:var(--color-text-muted);
          cursor:pointer;
          transition:border-color var(--transition),background var(--transition),color var(--transition);
        }
        .calendar-filter-checkbox:hover{
          border-color:color-mix(in srgb,var(--color-accent) 34%,var(--color-border));
          color:var(--color-text);
        }
        .calendar-filter-checkbox input{
          width:16px;
          height:16px;
          accent-color:var(--color-accent);
        }
        .calendar-filter-reset{
          display:inline-flex;
          align-items:center;
          gap:var(--space-2);
          min-height:32px;
          color:var(--color-accent);
          font-size:var(--text-xs);
          font-weight:800;
          border-radius:var(--radius-sm);
          padding:var(--space-1) var(--space-2);
        }
        .calendar-filter-reset:hover{
          background:var(--color-accent-subtle);
        }
        @media(max-width:1024px){
          .calendar-filter-grid{
            grid-template-columns:repeat(2,minmax(0,1fr));
          }
          .calendar-filter-search{
            grid-column:1 / -1;
          }
        }
        @media(max-width:620px){
          .calendar-filters{padding:var(--space-4);border-radius:var(--radius-xl)}
          .calendar-filters-header{align-items:flex-start}
          .calendar-filters-subtitle{display:none}
          .calendar-filter-grid{grid-template-columns:1fr}
          .calendar-filter-search{grid-column:auto}
          .calendar-filter-bottom{align-items:stretch}
          .calendar-filter-checkbox{width:100%;justify-content:center}
        }
      `}</style>

      <section className="calendar-filters" aria-label="Filtry kalendarza">
        <div className="calendar-filters-header">
          <div className="calendar-filters-title-wrap">
            <span className="calendar-filters-icon" aria-hidden>
              <SlidersHorizontal size={17} />
            </span>
            <div>
              <p className="calendar-filters-title">Znajdź pokaz</p>
              <p className="calendar-filters-subtitle">
                Filtruj po miejscu, terminie, typie wydarzenia i rodzaju wstępu.
              </p>
            </div>
          </div>

          <span className="calendar-filters-count">
            {resultsCount} {resultsCount === 1 ? "wydarzenie" : "wydarzeń"}
          </span>
        </div>

        <div className="calendar-filter-grid">
          <div className="calendar-filter-search">
            <Search size={15} />
            <input
              className="calendar-filter-input"
              value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
              placeholder="Szukaj miasta, wydarzenia lub lotniska…"
              aria-label="Szukaj wydarzenia"
            />

            {filters.search && (
              <button
                type="button"
                className="calendar-filter-clear"
                onClick={() => setFilter("search", "")}
                aria-label="Wyczyść wyszukiwanie"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <select
            className="calendar-filter-select"
            value={filters.countryCode}
            onChange={(event) => setFilter("countryCode", event.target.value)}
            aria-label="Filtruj po kraju"
          >
            <option value="all">Wszystkie kraje</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>

          <select
            className="calendar-filter-select"
            value={filters.month}
            onChange={(event) => setFilter("month", event.target.value)}
            aria-label="Filtruj po miesiącu"
          >
            <option value="all">Wszystkie miesiące</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>

          <select
            className="calendar-filter-select"
            value={filters.eventType}
            onChange={(event) => setFilter("eventType", event.target.value as AirshowEventType | "all")}
            aria-label="Filtruj po typie wydarzenia"
          >
            {EVENT_TYPES.map((eventType) => (
              <option key={eventType.value} value={eventType.value}>
                {eventType.label}
              </option>
            ))}
          </select>

          <select
            className="calendar-filter-select"
            value={filters.admissionType}
            onChange={(event) => setFilter("admissionType", event.target.value as AirshowAdmissionType | "all")}
            aria-label="Filtruj po rodzaju wstępu"
          >
            {ADMISSION_TYPES.map((admission) => (
              <option key={admission.value} value={admission.value}>
                {admission.label}
              </option>
            ))}
          </select>
        </div>

        <div className="calendar-filter-bottom">
          <label className="calendar-filter-checkbox">
            <input
              type="checkbox"
              checked={filters.showPast}
              onChange={(event) => setFilter("showPast", event.target.checked)}
            />
            Pokaż zakończone wydarzenia
          </label>

          {hasFilters && (
            <button type="button" className="calendar-filter-reset" onClick={onReset}>
              <X size={14} />
              Wyczyść filtry
            </button>
          )}
        </div>
      </section>
    </>
  );
}