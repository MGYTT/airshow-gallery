"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  airShows,
  photos,
  getPhotosByShow,
  type Photo,
  type AirShow,
} from "@/lib/data";
import ShowCard from "@/components/ShowCard";
import {
  Filter,
  Grid,
  LayoutGrid,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Images,
  Plane,
  MapPin,
  Calendar,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// LIGHTBOX
// ─────────────────────────────────────────────────────────────
function Lightbox({
  list,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  list: Photo[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const photo = list[index];
  const show = airShows.find((s) => s.id === photo?.showId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  if (!photo) return null;

  return (
    <>
      <style>{`
        .lb {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.96);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          animation: lbIn .18s ease;
        }
        @keyframes lbIn { from { opacity:0 } to { opacity:1 } }
        .lb-btn {
          position: fixed;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .lb-btn:hover { background: rgba(255,255,255,0.18); }
        .lb-close {
          top: var(--space-5); right: var(--space-5);
          width: 44px; height: 44px;
          border-radius: var(--radius-full);
        }
        .lb-prev, .lb-next {
          top: 50%; transform: translateY(-50%);
          width: 48px; height: 72px;
          border-radius: var(--radius-lg);
        }
        .lb-prev { left: var(--space-5); }
        .lb-next { right: var(--space-5); }
        .lb-prev:hover { transform: translateY(-50%) translateX(-2px); }
        .lb-next:hover { transform: translateY(-50%) translateX(2px); }
        .lb-counter {
          position: fixed; top: var(--space-5); left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,0.55); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
          font-size: var(--text-xs); font-weight: 600;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-full);
        }
        .lb-img {
          display: block;
          max-width: min(90vw, 1200px);
          max-height: 82dvh;
          width: auto; height: auto;
          border-radius: var(--radius-xl);
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
          object-fit: contain;
        }
        .lb-bar {
          position: fixed; bottom: 0; left: 0; right: 0;
          padding: var(--space-4) var(--space-8);
          background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
          display: flex; align-items: flex-end;
          justify-content: space-between; gap: var(--space-4);
          flex-wrap: wrap;
        }
      `}</style>

      <div className="lb" onClick={onClose}>
        {/* Close */}
        <button className="lb-btn lb-close" onClick={onClose} aria-label="Zamknij">
          <X size={18} />
        </button>

        {/* Counter */}
        <div className="lb-counter">{index + 1} / {list.length}</div>

        {/* Prev */}
        <button
          className="lb-btn lb-prev"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Poprzednie zdjęcie"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Image */}
        <img
          key={photo.id}
          src={photo.src}
          alt={photo.alt}
          className="lb-img"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Next */}
        <button
          className="lb-btn lb-next"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Następne zdjęcie"
        >
          <ChevronRight size={22} />
        </button>

        {/* Info bar */}
        <div className="lb-bar" onClick={(e) => e.stopPropagation()}>
          <div>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              {photo.aircraft}
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.55)" }}>
              {photo.alt}
            </p>
          </div>
          {show && (
            <Link
              href={`/show/${show.id}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
                fontSize: "var(--text-xs)", fontWeight: 600,
                color: "rgba(255,255,255,0.8)",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                textDecoration: "none", flexShrink: 0,
                backdropFilter: "blur(6px)",
              }}
            >
              <Images size={12} />
              {show.name}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MASONRY GRID
// ─────────────────────────────────────────────────────────────
function PhotoMasonry({
  list,
  onOpen,
}: {
  list: Photo[];
  onOpen: (i: number) => void;
}) {
  if (list.length === 0) {
    return (
      <div style={{
        minHeight: "40dvh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "var(--space-4)",
        color: "var(--color-text-faint)",
        paddingBottom: "var(--space-16)",
      }}>
        <Plane size={40} style={{ opacity: 0.25 }} />
        <p style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>
          Brak zdjęć dla wybranego pokazu
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .masonry {
          columns: 4 200px;
          column-gap: var(--space-3);
          padding-bottom: var(--space-20);
        }
        @media (max-width: 600px) {
          .masonry { columns: 2 130px; }
        }
        .m-item {
          break-inside: avoid;
          margin-bottom: var(--space-3);
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: zoom-in;
          position: relative;
          background: var(--color-surface-offset);
        }
        .m-item img {
          display: block; width: 100%; height: auto;
          transition: transform .4s cubic-bezier(.16,1,.3,1);
        }
        .m-item:hover img { transform: scale(1.04); }
        .m-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.28);
          opacity: 0; transition: opacity .2s;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .m-item:hover .m-overlay { opacity: 1; }
        .m-caption {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.72), transparent);
          padding: var(--space-6) var(--space-3) var(--space-3);
          opacity: 0; transition: opacity .2s;
        }
        .m-item:hover .m-caption { opacity: 1; }
      `}</style>

      <div className="masonry">
        {list.map((photo, i) => (
          <div
            key={photo.id}
            className="m-item"
            onClick={() => onOpen(i)}
            role="button"
            tabIndex={0}
            aria-label={`Otwórz: ${photo.alt}`}
            onKeyDown={(e) => e.key === "Enter" && onOpen(i)}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading={i < 8 ? "eager" : "lazy"}
              style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
            />
            <div className="m-overlay">
              <ZoomIn size={26} />
            </div>
            <div className="m-caption">
              <p style={{
                fontSize: "var(--text-xs)", fontWeight: 600,
                color: "#fff", lineHeight: 1.3,
              }}>
                {photo.aircraft}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// FILTER PILL
// ─────────────────────────────────────────────────────────────
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "var(--space-2) var(--space-4)",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--text-xs)", fontWeight: 600,
        cursor: "pointer", border: "1.5px solid",
        whiteSpace: "nowrap",
        transition: "all var(--transition)",
        background: active ? "var(--color-accent)" : "var(--color-surface)",
        color: active ? "#fff" : "var(--color-text-muted)",
        borderColor: active ? "var(--color-accent)" : "var(--color-border)",
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// GALLERY CONTENT (needs Suspense for useSearchParams)
// ─────────────────────────────────────────────────────────────
function GalleryContent() {
  const searchParams = useSearchParams();
  const initialShow = searchParams.get("show") ?? "all";

  const [activeShow, setActiveShow] = useState<string>(initialShow);
  const [view, setView]             = useState<"grid" | "shows">("grid");
  const [lbIndex, setLbIndex]       = useState<number | null>(null);

  // ── Filtered list — zawsze tablica, nigdy undefined ──
  const filteredList = useMemo<Photo[]>(() => {
    const base = photos ?? [];
    if (activeShow === "all") return base;
    return base.filter((p) => p.showId === activeShow);
  }, [activeShow]);

  const total = filteredList.length;

  // ── Lightbox handlers ──
  const openLb  = useCallback((i: number) => setLbIndex(i), []);
  const closeLb = useCallback(() => setLbIndex(null), []);
  const prevLb  = useCallback(() => {
    setLbIndex((p) => {
      if (p === null || total === 0) return null;
      return (p - 1 + total) % total;
    });
  }, [total]);
  const nextLb  = useCallback(() => {
    setLbIndex((p) => {
      if (p === null || total === 0) return null;
      return (p + 1) % total;
    });
  }, [total]);

  const activeShowData = useMemo<AirShow | undefined>(
    () => airShows.find((s) => s.id === activeShow),
    [activeShow]
  );

  return (
    <>
      <style>{`
        .g-header {
          border-bottom: 1px solid var(--color-divider);
          padding: var(--space-12) 0 var(--space-8);
          background: var(--color-surface);
          position: relative; overflow: hidden;
        }
        .g-ghost {
          position: absolute; right: -1%; top: 50%;
          transform: translateY(-50%);
          font-family: var(--font-display); font-weight: 900;
          font-size: clamp(6rem, 18vw, 16rem);
          line-height: 1; letter-spacing: -0.06em;
          color: var(--color-text); opacity: 0.03;
          user-select: none; pointer-events: none;
        }
        .g-filterbar {
          position: sticky; top: 63px; z-index: 50;
          background: var(--color-bg);
          border-bottom: 1px solid var(--color-divider);
          padding: var(--space-3) 0;
        }
        .g-pills {
          display: flex; gap: var(--space-2);
          flex-wrap: wrap; flex: 1; min-width: 0;
        }
        .g-view-toggle {
          display: flex; flex-shrink: 0;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .g-view-btn {
          padding: var(--space-2) var(--space-3);
          display: flex; align-items: center; gap: var(--space-2);
          font-size: var(--text-xs); font-weight: 600;
          cursor: pointer; border: none;
          transition: background var(--transition), color var(--transition);
        }
        .g-meta-chip {
          display: inline-flex; align-items: center; gap: var(--space-2);
          font-size: var(--text-xs); color: var(--color-text-faint);
        }
      `}</style>

      {/* ── Header ── */}
      <div className="g-header">
        <div aria-hidden className="g-ghost">FOTO</div>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <span className="badge" style={{ marginBottom: "var(--space-4)" }}>
            <Filter size={11} /> Galeria
          </span>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "var(--text-3xl)",
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            marginBottom: "var(--space-3)",
          }}>
            {activeShow === "all" ? (
              <>Wszystkie <span style={{ color: "var(--color-accent)" }}>zdjęcia</span></>
            ) : (
              activeShowData?.name ?? "Galeria"
            )}
          </h1>

          {/* Meta */}
          <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap" }}>
            <span className="g-meta-chip">
              <Images size={13} />
              <strong style={{ color: "var(--color-text)", fontVariantNumeric: "tabular-nums" }}>
                {total}
              </strong>{" "}zdjęć
            </span>
            {activeShow === "all" ? (
              <span className="g-meta-chip">
                <Plane size={13} />
                <strong style={{ color: "var(--color-text)" }}>{airShows.length}</strong> pokazów
              </span>
            ) : activeShowData ? (
              <>
                <span className="g-meta-chip"><MapPin size={13} />{activeShowData.location}</span>
                <span className="g-meta-chip"><Calendar size={13} />{activeShowData.date} {activeShowData.year}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="g-filterbar">
        <div className="container">
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)", flexWrap: "wrap",
          }}>
            <div className="g-pills">
              <Pill active={activeShow === "all"} onClick={() => setActiveShow("all")}>
                Wszystkie ({(photos ?? []).length})
              </Pill>
              {airShows.map((show) => {
                const cnt = (photos ?? []).filter((p) => p.showId === show.id).length;
                return (
                  <Pill
                    key={show.id}
                    active={activeShow === show.id}
                    onClick={() => setActiveShow(show.id)}
                  >
                    {show.name}
                    <span style={{ marginLeft: 4, opacity: 0.6, fontWeight: 500, fontSize: 10 }}>
                      ({cnt})
                    </span>
                  </Pill>
                );
              })}
            </div>

            {/* View toggle */}
            <div className="g-view-toggle">
              {(["grid", "shows"] as const).map((v) => (
                <button
                  key={v}
                  className="g-view-btn"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  aria-label={v === "grid" ? "Widok siatki" : "Widok kart pokazów"}
                  style={{
                    background: view === v ? "var(--color-surface-offset)" : "transparent",
                    color: view === v ? "var(--color-text)" : "var(--color-text-faint)",
                  }}
                >
                  {v === "grid" ? <Grid size={14} /> : <LayoutGrid size={14} />}
                  {v === "grid" ? "Siatka" : "Pokazy"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container" style={{ paddingTop: "var(--space-8)" }}>
        {view === "grid" ? (
          <PhotoMasonry list={filteredList} onOpen={openLb} />
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
            gap: "var(--space-6)",
            paddingBottom: "var(--space-16)",
          }}>
            {airShows.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lbIndex !== null && total > 0 && (
        <Lightbox
          list={filteredList}
          index={lbIndex}
          onClose={closeLb}
          onPrev={prevLb}
          onNext={nextLb}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE EXPORT
// ─────────────────────────────────────────────────────────────
export default function GalleryPage() {
  return (
    <div style={{ paddingTop: "64px" }}>
      <Suspense
        fallback={
          <div style={{
            minHeight: "60dvh",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "var(--space-4)", color: "var(--color-text-faint)",
          }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <Plane size={32} style={{ opacity: 0.3, animation: "spin 2s linear infinite" }} />
            <p style={{ fontSize: "var(--text-sm)" }}>Ładowanie galerii…</p>
          </div>
        }
      >
        <GalleryContent />
      </Suspense>
    </div>
  );
}