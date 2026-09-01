import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  MapPin,
  Sparkles,
  Star,
  Ticket,
} from "lucide-react";
import type {
  AirshowAdmissionType,
  AirshowEventStatus,
  AirshowEventType,
  MappedAirshowEvent,
} from "@/lib/supabase/types";

interface EventCardProps {
  event: MappedAirshowEvent;
  isNext?: boolean;
  compact?: boolean;
}

const STATUS_CONFIG: Record<
  AirshowEventStatus,
  {
    label: string;
    className: string;
  }
> = {
  scheduled: {
    label: "Zaplanowane",
    className: "event-card-status--scheduled",
  },
  rescheduled: {
    label: "Zmieniony termin",
    className: "event-card-status--rescheduled",
  },
  postponed: {
    label: "Przełożone",
    className: "event-card-status--postponed",
  },
  cancelled: {
    label: "Odwołane",
    className: "event-card-status--cancelled",
  },
  completed: {
    label: "Zakończone",
    className: "event-card-status--completed",
  },
};

const EVENT_TYPE_LABELS: Record<AirshowEventType, string> = {
  military: "Wojskowe",
  civil: "Cywilne",
  aerobatic: "Akrobacyjne",
  mixed: "Lotniczo-obronne",
  other: "Inne",
};

const ADMISSION_LABELS: Record<AirshowAdmissionType, string> = {
  free: "Wstęp bezpłatny",
  ticketed: "Bilety",
  registration_required: "Rejestracja",
  unknown: "Wstęp: sprawdź organizatora",
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

function getEventEndDate(event: MappedAirshowEvent) {
  return dateAtStartOfDay(event.endDate ?? event.startDate);
}

function getDaysUntil(event: MappedAirshowEvent) {
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

  const startDate = dateAtStartOfDay(event.startDate);
  return Math.round((startDate.getTime() - startOfToday.getTime()) / 86_400_000);
}

function isEventRunning(event: MappedAirshowEvent) {
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

  const startDate = dateAtStartOfDay(event.startDate);
  const endDate = getEventEndDate(event);

  return startDate <= startOfToday && endDate >= startOfToday;
}

function formatDateRange(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (Number.isNaN(start.getTime())) {
    return "Termin w przygotowaniu";
  }

  const fullFormatter = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (!end || Number.isNaN(end.getTime())) {
    return fullFormatter.format(start);
  }

  const isSameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (isSameDay) {
    return fullFormatter.format(start);
  }

  const isSameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();

  if (isSameMonth) {
    return `${start.getDate()}–${end.getDate()} ${end.toLocaleDateString("pl-PL", {
      month: "long",
      year: "numeric",
    })}`;
  }

  return `${fullFormatter.format(start)} – ${fullFormatter.format(end)}`;
}

function formatMonthBlock(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { day: "?", month: "DATA" };
  }

  return {
    day: String(date.getDate()),
    month: date
      .toLocaleDateString("pl-PL", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
  };
}

function formatVerification(value: string | null) {
  if (!value) {
    return "Brak daty weryfikacji";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Brak daty weryfikacji";
  }

  return `Zweryfikowano: ${new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)}`;
}

function getCountdownLabel(event: MappedAirshowEvent) {
  const days = getDaysUntil(event);

  if (isEventRunning(event)) {
    return "Trwa teraz";
  }

  if (days === 0) {
    return "Dziś";
  }

  if (days === 1) {
    return "Jutro";
  }

  if (days > 1) {
    return `Za ${days} dni`;
  }

  return "Termin minął";
}

export default function EventCard({
  event,
  isNext = false,
  compact = false,
}: EventCardProps) {
  const dateBlock = formatMonthBlock(event.startDate);
  const status = STATUS_CONFIG[event.status];
  const days = getDaysUntil(event);
  const eventHasPassed =
    event.status === "completed" ||
    event.status === "cancelled" ||
    getEventEndDate(event).getTime() < Date.now() - 86_400_000;

  const countdownVisible =
    !eventHasPassed &&
    event.status !== "cancelled" &&
    event.status !== "postponed";

  return (
    <>
      <style>{`
        .event-card{
          position:relative;
          display:grid;
          grid-template-columns:auto minmax(0,1fr) auto;
          gap:var(--space-4);
          align-items:center;
          padding:var(--space-5);
          border:1px solid var(--color-border);
          border-radius:var(--radius-xl);
          background:var(--color-surface);
          color:var(--color-text);
          text-decoration:none;
          overflow:hidden;
          transition:transform var(--transition),box-shadow var(--transition),border-color var(--transition),background var(--transition);
        }
        .event-card:hover{
          transform:translateY(-3px);
          box-shadow:var(--shadow-md);
          border-color:color-mix(in srgb,var(--color-accent) 36%,transparent);
        }
        .event-card:focus-visible{
          outline:none;
          box-shadow:var(--focus-ring),var(--shadow-md);
        }
        .event-card--next{
          background:var(--color-accent-subtle);
          border-color:color-mix(in srgb,var(--color-accent) 44%,transparent);
        }
        .event-card--completed{opacity:.66}
        .event-card--cancelled{opacity:.72}
        .event-card-stripe{
          position:absolute;
          top:14%;
          bottom:14%;
          left:0;
          width:3px;
          border-radius:0 var(--radius-full) var(--radius-full) 0;
          background:var(--color-gold);
        }
        .event-card--next .event-card-stripe,
        .event-card--scheduled .event-card-stripe{background:var(--color-accent)}
        .event-card--rescheduled .event-card-stripe,
        .event-card--postponed .event-card-stripe{background:var(--color-gold)}
        .event-card--cancelled .event-card-stripe{background:#dc2626}
        .event-card--completed .event-card-stripe{background:var(--color-text-faint)}
        .event-card-date{
          width:52px;
          height:58px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
          border-radius:var(--radius-lg);
          background:var(--color-surface-offset);
          border:1px solid var(--color-border);
          transition:transform var(--transition),background var(--transition);
        }
        .event-card:hover .event-card-date{transform:scale(1.05)}
        .event-card--next .event-card-date{
          background:var(--color-accent);
          border-color:var(--color-accent);
          box-shadow:0 6px 18px color-mix(in srgb,var(--color-accent) 30%,transparent);
        }
        .event-card-day{
          font-family:var(--font-display);
          font-size:var(--text-lg);
          line-height:1;
          font-weight:900;
          letter-spacing:-.04em;
          font-variant-numeric:tabular-nums;
        }
        .event-card-month{
          font-size:9px;
          line-height:1.1;
          margin-top:3px;
          font-weight:800;
          letter-spacing:.09em;
          color:var(--color-text-faint);
        }
        .event-card--next .event-card-day{color:#fff}
        .event-card--next .event-card-month{color:rgba(255,255,255,.72)}
        .event-card-content{min-width:0}
        .event-card-top{
          display:flex;
          align-items:center;
          gap:var(--space-2);
          flex-wrap:wrap;
          margin-bottom:var(--space-2);
        }
        .event-card-title{
          font-family:var(--font-display);
          font-size:var(--text-base);
          line-height:1.25;
          letter-spacing:-.022em;
          font-weight:800;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        .event-card-description{
          margin-top:var(--space-2);
          color:var(--color-text-muted);
          font-size:var(--text-xs);
          line-height:1.55;
          display:-webkit-box;
          overflow:hidden;
          -webkit-line-clamp:2;
          -webkit-box-orient:vertical;
        }
        .event-card-meta{
          display:flex;
          align-items:center;
          gap:var(--space-2);
          flex-wrap:wrap;
          color:var(--color-text-muted);
          font-size:var(--text-xs);
          margin-top:var(--space-2);
        }
        .event-card-meta-item{
          display:inline-flex;
          align-items:center;
          gap:4px;
          min-width:0;
        }
        .event-card-meta-dot{
          width:3px;
          height:3px;
          border-radius:var(--radius-full);
          background:var(--color-text-faint);
          flex-shrink:0;
        }
        .event-card-badges{
          display:flex;
          align-items:center;
          flex-wrap:wrap;
          gap:4px;
        }
        .event-card-badge{
          display:inline-flex;
          align-items:center;
          gap:4px;
          padding:3px 8px;
          border-radius:var(--radius-full);
          font-size:9px;
          font-weight:800;
          letter-spacing:.07em;
          text-transform:uppercase;
          white-space:nowrap;
        }
        .event-card-status--scheduled{
          background:var(--color-accent-subtle);
          color:var(--color-accent);
          border:1px solid color-mix(in srgb,var(--color-accent) 28%,transparent);
        }
        .event-card-status--rescheduled,
        .event-card-status--postponed{
          background:var(--color-gold-subtle);
          color:var(--color-gold);
          border:1px solid color-mix(in srgb,var(--color-gold) 30%,transparent);
        }
        .event-card-status--cancelled{
          background:rgba(220,38,38,.10);
          color:#dc2626;
          border:1px solid rgba(220,38,38,.26);
        }
        .event-card-status--completed{
          background:var(--color-surface-offset);
          color:var(--color-text-faint);
          border:1px solid var(--color-border);
        }
        .event-card-featured{
          color:var(--color-gold);
          background:var(--color-gold-subtle);
          border:1px solid color-mix(in srgb,var(--color-gold) 28%,transparent);
        }
        .event-card-next{
          color:#fff;
          background:var(--color-accent);
        }
        .event-card-admission{
          color:var(--color-text-muted);
          background:var(--color-surface-offset);
          border:1px solid var(--color-border);
        }
        .event-card-right{
          display:flex;
          flex-direction:column;
          align-items:flex-end;
          justify-content:center;
          gap:var(--space-2);
          min-width:74px;
        }
        .event-card-countdown{
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          min-width:62px;
          min-height:48px;
          padding:var(--space-2);
          border-radius:var(--radius-lg);
          background:var(--color-surface-offset);
          border:1px solid var(--color-border);
          color:var(--color-text-muted);
          text-align:center;
        }
        .event-card--next .event-card-countdown{
          background:color-mix(in srgb,var(--color-accent) 12%,var(--color-surface));
          border-color:color-mix(in srgb,var(--color-accent) 25%,transparent);
          color:var(--color-accent);
        }
        .event-card-countdown-value{
          font-family:var(--font-display);
          font-size:var(--text-sm);
          font-weight:900;
          letter-spacing:-.025em;
          line-height:1.1;
        }
        .event-card-countdown-label{
          margin-top:2px;
          font-size:9px;
          font-weight:800;
          letter-spacing:.08em;
          text-transform:uppercase;
          color:var(--color-text-faint);
        }
        .event-card-arrow{
          color:var(--color-text-faint);
          transition:transform var(--transition),color var(--transition);
        }
        .event-card:hover .event-card-arrow{
          transform:translateX(3px);
          color:var(--color-accent);
        }
        .event-card-verification{
          display:inline-flex;
          align-items:center;
          gap:4px;
          margin-top:var(--space-2);
          color:var(--color-text-faint);
          font-size:10px;
          font-weight:600;
        }
        .event-card--compact{
          padding:var(--space-4);
          border-radius:var(--radius-lg);
        }
        .event-card--compact .event-card-description,
        .event-card--compact .event-card-verification{display:none}
        .event-card--compact .event-card-date{width:46px;height:50px}
        @media(max-width:640px){
          .event-card{grid-template-columns:auto minmax(0,1fr);padding:var(--space-4);gap:var(--space-3)}
          .event-card-right{display:none}
          .event-card-title{white-space:normal;font-size:var(--text-sm)}
          .event-card-description{display:none}
          .event-card-meta{gap:var(--space-1)}
          .event-card-meta-dot{display:none}
          .event-card-meta-item{width:100%}
          .event-card-badges{margin-top:var(--space-2)}
        }
      `}</style>

      <Link
        href={`/airshow/${event.slug}`}
        className={[
          "event-card",
          isNext ? "event-card--next" : "",
          `event-card--${event.status}`,
          compact ? "event-card--compact" : "",
        ].filter(Boolean).join(" ")}
        aria-label={`Zobacz informacje o wydarzeniu: ${event.name}`}
      >
        <span className="event-card-stripe" aria-hidden />

        <div className="event-card-date" aria-hidden>
          <span className="event-card-day">{dateBlock.day}</span>
          <span className="event-card-month">{dateBlock.month}</span>
        </div>

        <div className="event-card-content">
          <div className="event-card-top">
            <h2 className="event-card-title">{event.name}</h2>

            <div className="event-card-badges">
              {isNext && (
                <span className="event-card-badge event-card-next">
                  <Sparkles size={10} />
                  Następny
                </span>
              )}

              <span className={`event-card-badge ${status.className}`}>
                {event.status === "cancelled" ? (
                  <CircleAlert size={10} />
                ) : (
                  <CalendarDays size={10} />
                )}
                {status.label}
              </span>

              {event.featured && (
                <span className="event-card-badge event-card-featured">
                  <Star size={10} fill="currentColor" />
                  Wyróżnione
                </span>
              )}

              {event.admissionType !== "unknown" && (
                <span className="event-card-badge event-card-admission">
                  <Ticket size={10} />
                  {ADMISSION_LABELS[event.admissionType]}
                </span>
              )}
            </div>
          </div>

          <div className="event-card-meta">
            <span className="event-card-meta-item">
              <CalendarDays size={12} />
              {formatDateRange(event.startDate, event.endDate)}
            </span>

            <span className="event-card-meta-dot" aria-hidden />

            <span className="event-card-meta-item">
              <MapPin size={12} />
              {event.city}, {event.country}
            </span>

            <span className="event-card-meta-dot" aria-hidden />

            <span className="event-card-meta-item">
              <PlaneIcon />
              {EVENT_TYPE_LABELS[event.eventType]}
            </span>
          </div>

          {event.shortDescription && (
            <p className="event-card-description">{event.shortDescription}</p>
          )}

          <span className="event-card-verification">
            <Clock3 size={11} />
            {formatVerification(event.lastVerifiedAt)}
          </span>
        </div>

        <div className="event-card-right" aria-hidden>
          {countdownVisible && days >= 0 ? (
            <div className="event-card-countdown">
              <span className="event-card-countdown-value">
                {isEventRunning(event) ? "TERAZ" : days === 0 ? "DZIŚ" : days === 1 ? "JUTRO" : days}
              </span>
              {!isEventRunning(event) && days > 1 && (
                <span className="event-card-countdown-label">dni</span>
              )}
            </div>
          ) : (
            <div className="event-card-countdown">
              <span className="event-card-countdown-value">
                {event.status === "cancelled" ? "STOP" : "ARCH."}
              </span>
              <span className="event-card-countdown-label">
                {event.status === "cancelled" ? "status" : "minęło"}
              </span>
            </div>
          )}

          {event.officialUrl && <ExternalLink size={15} className="event-card-arrow" />}
          {!event.officialUrl && <ChevronRight size={17} className="event-card-arrow" />}
        </div>

        <span className="sr-only">{getCountdownLabel(event)}</span>
      </Link>
    </>
  );
}

function PlaneIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.8 19.6 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8l-8.6-1.8-1.1 1.1 7 3.5-3 3-2-1-1.5 1.5 3.6 2.2 2.2 3.6 1.5-1.5-1-2 3-3 3.5 7Z" />
    </svg>
  );
}