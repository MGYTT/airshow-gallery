"use client";

import { airShows, photos } from "@/lib/data";
import {
  Images, Clapperboard, Star, TrendingUp,
  ArrowRight, Clock, Upload, Settings,
  ExternalLink, Eye, CheckCircle2, Globe,
  Plane, Camera,
} from "lucide-react";
import Link from "next/link";

// ── Statystyki ────────────────────────────────────────────────
const safePhotos     = photos ?? [];
const safeShows      = airShows ?? [];

const totalPhotos    = safePhotos.length;
const featuredCount  = safeShows.filter((s) => s.featured).length;
const avgPhotos      = Math.round(totalPhotos / Math.max(safeShows.length, 1));
const countriesCount = [...new Set(safeShows.map((s) => s.location.split(",").pop()?.trim()))].length;

const STATS = [
  {
    label: "Wszystkich zdjęć",
    value: totalPhotos,
    icon: Images,
    href: "/admin/photos",
    trend: "łącznie w galerii",
    color: "var(--color-accent)",
    bg: "var(--color-accent-subtle)",
  },
  {
    label: "Pokazy lotnicze",
    value: airShows.length,
    icon: Clapperboard,
    href: "/admin/shows",
    trend: `${featuredCount} wyróżnione`,
    color: "var(--color-gold)",
    bg: "var(--color-gold-subtle)",
  },
  {
    label: "Śr. zdjęć / pokaz",
    value: avgPhotos,
    icon: TrendingUp,
    href: "/admin/photos",
    trend: "zdjęć na pokaz",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
  },
  {
    label: "Kraje / regiony",
    value: countriesCount,
    icon: Globe,
    href: "/admin/shows",
    trend: "odwiedzone miejsca",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.08)",
  },
];

const QUICK_ACTIONS = [
  {
    href: "/admin/photos/upload",
    label: "Dodaj nowe zdjęcia",
    desc: "Upload z dysku lub przeciągnij pliki",
    icon: Upload,
    accent: true,
  },
  {
    href: "/admin/shows",
    label: "Zarządzaj pokazami",
    desc: "Edytuj, ukryj, wyróżnij pokazy",
    icon: Clapperboard,
    accent: false,
  },
  {
    href: "/admin/settings",
    label: "Ustawienia strony",
    desc: "Konfiguracja, motyw, dane autora",
    icon: Settings,
    accent: false,
  },
  {
    href: "/",
    label: "Podgląd strony publicznej",
    desc: "Otwórz stronę w nowej karcie",
    icon: ExternalLink,
    accent: false,
    external: true,
  },
];

// ── Checklist publikacyjna ────────────────────────────────────
const CHECKLIST = [
  { label: "Dodaj przynajmniej 1 pokaz",   done: safeShows.length > 0 },
  { label: "Dodaj zdjęcia do galerii",      done: totalPhotos > 0 },
  { label: "Wyróżnij minimum 1 pokaz",      done: featuredCount > 0 },
  { label: "Uzupełnij opisy pokazów",       done: safeShows.every((s) => s.description.length > 10) },
  { label: "Zdjęcia okładkowe dla pokazów", done: safeShows.every((s) => !!s.coverImage) },
  { label: "Tagi przypisane do pokazów",    done: safeShows.every((s) => s.tags.length > 0) },
];

const checklistDone = CHECKLIST.filter((c) => c.done).length;
const checklistPct  = Math.round((checklistDone / CHECKLIST.length) * 100);

export default function AdminDashboard() {
  const now = new Date();
  const timeStr = now.toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4);
          margin-bottom: var(--space-8);
        }
        @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  { .stats-grid { grid-template-columns: 1fr; } }

        .stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          display: flex; flex-direction: column; gap: var(--space-3);
          text-decoration: none; color: inherit;
          transition: box-shadow var(--transition), transform var(--transition), border-color var(--transition);
        }
        .stat-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
          border-color: var(--color-border-strong);
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-6);
          margin-bottom: var(--space-6);
        }
        @media (max-width: 900px) { .bottom-grid { grid-template-columns: 1fr; } }

        .panel {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
        .panel-header {
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--color-border);
          display: flex; align-items: center;
          justify-content: space-between;
        }

        .show-row {
          display: flex; align-items: center; gap: var(--space-4);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          text-decoration: none; color: inherit;
          transition: background var(--transition);
        }
        .show-row:hover { background: var(--color-surface-offset); }

        .quick-btn {
          display: flex; align-items: center; gap: var(--space-4);
          padding: var(--space-4) var(--space-4);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          background: var(--color-surface-offset);
          text-decoration: none; color: inherit;
          transition: border-color var(--transition), background var(--transition), transform var(--transition);
        }
        .quick-btn:hover {
          border-color: var(--color-border-strong);
          background: var(--color-surface-dynamic);
          transform: translateX(3px);
        }
        .quick-btn.accent {
          background: var(--color-accent-subtle);
          border-color: var(--color-accent);
        }
        .quick-btn.accent:hover {
          background: var(--color-accent);
          color: #fff;
          transform: translateX(3px);
        }
        .quick-btn.accent:hover .qa-icon { color: #fff !important; }
        .quick-btn.accent:hover p { color: rgba(255,255,255,0.75) !important; }

        /* Progress bar */
        .progress-track {
          height: 6px;
          background: var(--color-surface-dynamic);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: var(--radius-full);
          background: linear-gradient(to right, var(--color-accent), #f97316);
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Checklist */
        .check-item {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          font-size: var(--text-xs);
          transition: background var(--transition);
        }
        .check-item:hover { background: var(--color-surface-offset); }
        .check-item.done { color: var(--color-text-muted); }
        .check-item.todo { color: var(--color-text); font-weight: 500; }

        /* Banner */
        .pub-banner {
          border-radius: var(--radius-xl);
          padding: var(--space-5) var(--space-6);
          display: flex; align-items: center;
          justify-content: space-between;
          gap: var(--space-4); flex-wrap: wrap;
          margin-bottom: var(--space-6);
          border: 1px solid;
        }
        .pub-banner.ready {
          background: rgba(34,197,94,0.07);
          border-color: rgba(34,197,94,0.3);
        }
        .pub-banner.not-ready {
          background: var(--color-accent-subtle);
          border-color: var(--color-accent);
        }
      `}</style>

      {/* ── Page title ── */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 900,
          fontSize: "var(--text-xl)", letterSpacing: "-0.03em",
          marginBottom: "var(--space-1)",
        }}>
          Dashboard
        </h1>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          {timeStr} · Witaj z powrotem! ✈️
        </p>
      </div>

      {/* ── Baner gotowości do publikacji ── */}
      <div className={`pub-banner ${checklistPct === 100 ? "ready" : "not-ready"}`}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div style={{
            width: 42, height: 42, borderRadius: "var(--radius-lg)", flexShrink: 0,
            background: checklistPct === 100 ? "rgba(34,197,94,0.15)" : "var(--color-accent-subtle)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: checklistPct === 100 ? "#22c55e" : "var(--color-accent)",
          }}>
            {checklistPct === 100 ? <CheckCircle2 size={22} /> : <Plane size={22} />}
          </div>
          <div>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: 2 }}>
              {checklistPct === 100
                ? "Strona gotowa do publikacji! 🎉"
                : `Gotowość do publikacji — ${checklistPct}%`}
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {checklistPct === 100
                ? `Wszystkie ${CHECKLIST.length} punktów spełnione`
                : `${checklistDone} z ${CHECKLIST.length} punktów ukończone`}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", flexShrink: 0 }}>
          <Link href="/" target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-md)", textDecoration: "none",
              fontSize: "var(--text-xs)", fontWeight: 700,
              background: checklistPct === 100 ? "#22c55e" : "var(--color-accent)",
              color: "#fff",
              transition: "opacity .2s",
            }}
          >
            <Eye size={13} /> Podgląd strony
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid">
        {STATS.map(({ label, value, icon: Icon, href, trend, color, bg }) => (
          <Link key={label} href={href} className="stat-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{
                width: 38, height: 38, borderRadius: "var(--radius-lg)",
                background: bg, display: "flex", alignItems: "center",
                justifyContent: "center", color, flexShrink: 0,
              }}>
                <Icon size={18} />
              </div>
              <ArrowRight size={14} style={{ color: "var(--color-text-faint)" }} />
            </div>
            <div>
              <p style={{
                fontFamily: "var(--font-display)", fontWeight: 900,
                fontSize: "var(--text-2xl)", letterSpacing: "-0.04em",
                lineHeight: 1, color, fontVariantNumeric: "tabular-nums",
              }}>
                {value.toLocaleString("pl-PL")}
              </p>
              <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text)", marginTop: "var(--space-1)" }}>
                {label}
              </p>
            </div>
            <p style={{
              fontSize: "var(--text-xs)", color: "var(--color-text-faint)",
              display: "flex", alignItems: "center", gap: "var(--space-1)",
            }}>
              <Clock size={10} />{trend}
            </p>
          </Link>
        ))}
      </div>

      {/* ── Bottom grid ── */}
      <div className="bottom-grid">

        {/* Ostatnie pokazy */}
        <div className="panel">
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Camera size={15} style={{ color: "var(--color-text-faint)" }} />
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>Pokazy lotnicze</p>
            </div>
            <Link href="/admin/shows" style={{
              fontSize: "var(--text-xs)", color: "var(--color-accent)",
              textDecoration: "none", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              Wszystkie <ArrowRight size={11} />
            </Link>
          </div>
          <div style={{ padding: "var(--space-2)" }}>
            {airShows.slice(0, 6).map((show) => (
              <Link key={show.id} href="/admin/shows" className="show-row">
                {/* Status dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: "var(--radius-full)", flexShrink: 0,
                  background: show.featured ? "var(--color-gold)" : "var(--color-surface-dynamic)",
                  boxShadow: show.featured ? "0 0 6px var(--color-gold)" : "none",
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: "var(--text-sm)", fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {show.name}
                  </p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
                    {show.location} · {show.year}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
                  <span style={{
                    fontSize: "var(--text-xs)", color: "var(--color-text-faint)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {show.photoCount} zdjęć
                  </span>
                  {show.featured && (
                    <span style={{
                      fontSize: "9px", fontWeight: 700, letterSpacing: ".06em",
                      color: "var(--color-gold)",
                      textTransform: "uppercase",
                    }}>
                      ★ wyróżniony
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Prawa kolumna — Szybkie akcje + Checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

          {/* Szybkie akcje */}
          <div className="panel">
            <div className="panel-header">
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>Szybkie akcje</p>
            </div>
            <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {QUICK_ACTIONS.map(({ href, label, desc, icon: Icon, accent, external }) => (
                <Link
                  key={href}
                  href={href}
                  className={`quick-btn ${accent ? "accent" : ""}`}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <Icon
                    size={16}
                    className="qa-icon"
                    style={{ color: accent ? "var(--color-accent)" : "var(--color-text-faint)", flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, lineHeight: 1.3 }}>{label}</p>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginTop: 2 }}>{desc}</p>
                  </div>
                  <ArrowRight size={13} style={{ color: "var(--color-text-faint)", flexShrink: 0, marginLeft: "auto" }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Checklist publikacyjna */}
          <div className="panel">
            <div className="panel-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <CheckCircle2 size={15} style={{ color: "var(--color-text-faint)" }} />
                  <p style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>Gotowość do publikacji</p>
                </div>
                <span style={{
                  fontSize: "var(--text-xs)", fontWeight: 700,
                  color: checklistPct === 100 ? "#22c55e" : "var(--color-accent)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {checklistDone}/{CHECKLIST.length}
                </span>
              </div>
              {/* Progress bar */}
              <div className="progress-track" style={{ width: "100%" }}>
                <div className="progress-fill" style={{ width: `${checklistPct}%` }} />
              </div>
            </div>
            <div style={{ padding: "var(--space-2)" }}>
              {CHECKLIST.map(({ label, done }) => (
                <div key={label} className={`check-item ${done ? "done" : "todo"}`}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "var(--radius-full)",
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: done ? "rgba(34,197,94,0.12)" : "var(--color-surface-offset)",
                    border: `1.5px solid ${done ? "rgba(34,197,94,0.4)" : "var(--color-border)"}`,
                    color: done ? "#22c55e" : "var(--color-text-faint)",
                    transition: "all .2s",
                  }}>
                    {done && <CheckCircle2 size={11} />}
                  </div>
                  <span style={{
                    textDecoration: done ? "line-through" : "none",
                    opacity: done ? 0.55 : 1,
                    fontSize: "var(--text-xs)",
                  }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}