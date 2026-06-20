"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import {
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
} from "lucide-react";
import type { Photo } from "@/lib/data";

interface PhotoGridProps {
  photos: Photo[];
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [loaded, setLoaded] = useState<Set<string>>(new Set());

  const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  /* ── Klawiatura ── */
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) =>
          i !== null ? (i - 1 + photos.length) % photos.length : null
        );
    },
    [lightboxIndex, photos.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  /* ── Blokuj scroll przy lightboxie ── */
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  /* ── Empty state ── */
  if (photos.length === 0) {
    return (
      <div
        style={{
          padding: "var(--space-24) var(--space-8)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-4)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "var(--radius-full)",
            background: "var(--color-surface-offset)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ZoomIn size={24} color="var(--color-text-faint)" />
        </div>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "var(--text-lg)",
            color: "var(--color-text)",
          }}
        >
          Brak zdjęć dla tego pokazu
        </p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Wybierz inny pokaz z filtrów powyżej
        </p>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        /* ── Grid ── */
        .photo-masonry {
          columns: 3 280px;
          column-gap: var(--space-4);
          padding-bottom: var(--space-16);
        }
        @media (max-width: 600px) {
          .photo-masonry { columns: 2 150px; column-gap: var(--space-2); }
        }

        /* ── Item ── */
        .photo-item {
          break-inside: avoid;
          margin-bottom: var(--space-4);
          position: relative;
          cursor: zoom-in;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--color-surface-offset);
          border: 1px solid var(--color-border);
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.3s cubic-bezier(0.16,1,0.3,1),
                      border-color 0.3s ease;
        }
        .photo-item:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
          border-color: var(--color-accent);
        }

        /* ── Skeleton shimmer ── */
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            var(--color-surface-offset) 25%,
            var(--color-surface-dynamic, #e0e0e0) 50%,
            var(--color-surface-offset) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        /* ── Image fade-in ── */
        .photo-img {
          width: 100%;
          height: auto;
          display: block;
          opacity: 0;
          transition: opacity 0.4s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        .photo-img.loaded { opacity: 1; }
        .photo-item:hover .photo-img { transform: scale(1.04); }

        /* ── Overlay ── */
        .photo-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.25s ease;
          pointer-events: none;
        }
        .photo-item:hover .photo-overlay {
          background: rgba(0, 0, 0, 0.32);
        }
        .overlay-icon {
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1);
          color: white;
        }
        .photo-item:hover .overlay-icon {
          opacity: 1;
          transform: scale(1);
        }

        /* ── Caption bar ── */
        .photo-caption {
          padding: var(--space-2) var(--space-3);
          font-size: var(--text-xs);
          color: var(--color-text-faint);
          font-style: italic;
          border-top: 1px solid var(--color-divider);
          background: var(--color-surface);
          transition: color 0.2s ease;
        }
        .photo-item:hover .photo-caption {
          color: var(--color-text-muted);
        }

        /* ── Lightbox backdrop ── */
        .lightbox-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.94);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(6px);
          padding: var(--space-6);
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Lightbox nav buttons ── */
        .lb-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
          z-index: 10;
        }
        .lb-nav-btn:hover {
          background: rgba(255,255,255,0.18);
          transform: translateY(-50%) scale(1.08);
        }
        .lb-nav-prev { left: var(--space-4); }
        .lb-nav-next { right: var(--space-4); }

        /* ── Lightbox top bar ── */
        .lb-topbar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-6);
          background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
        }
        .lb-ctrl-btn {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .lb-ctrl-btn:hover {
          background: rgba(255,255,255,0.18);
          color: #fff;
        }

        /* ── Lightbox image ── */
        .lb-image-wrap {
          max-width: min(92vw, 1100px);
          max-height: 78vh;
          position: relative;
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.8);
          animation: popIn 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* ── Lightbox bottom info ── */
        .lb-info-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: min(92vw, 1100px);
          margin-top: var(--space-4);
          gap: var(--space-4);
          flex-wrap: wrap;
        }
        .lb-aircraft {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: var(--text-base);
          color: #fff;
          letter-spacing: -0.02em;
        }
        .lb-alt {
          font-size: var(--text-sm);
          color: rgba(255,255,255,0.5);
          margin-top: 2px;
          font-style: italic;
        }
        .lb-counter {
          font-size: var(--text-xs);
          color: rgba(255,255,255,0.4);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* ── Lightbox dot strip ── */
        .lb-dots {
          display: flex;
          gap: 6px;
          justify-content: center;
          margin-top: var(--space-4);
          flex-wrap: wrap;
          max-width: 300px;
        }
        .lb-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.25);
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
          border: none;
          padding: 0;
        }
        .lb-dot.active {
          background: var(--color-accent);
          transform: scale(1.4);
        }
        .lb-dot:hover:not(.active) {
          background: rgba(255,255,255,0.5);
        }

        /* ── Kbd hint ── */
        .lb-kbd-hint {
          position: absolute;
          bottom: var(--space-4);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: var(--space-3);
          opacity: 0.35;
        }
        .kbd {
          font-size: 10px;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }

        @media (max-width: 640px) {
          .lb-nav-btn { width: 40px; height: 40px; }
          .lb-nav-prev { left: var(--space-2); }
          .lb-nav-next { right: var(--space-2); }
          .lb-kbd-hint { display: none; }
        }
      `}</style>

      {/* ═══════════════════════════════════════
          MASONRY GRID
      ═══════════════════════════════════════ */}
      <div className="photo-masonry">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="photo-item"
            onClick={() => { setLightboxIndex(index); setInfoOpen(false); }}
            role="button"
            aria-label={`Powiększ: ${photo.alt}`}
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && setLightboxIndex(index)
            }
          >
            {/* Skeleton loader */}
            {!loaded.has(photo.id) && <div className="skeleton" style={{ paddingTop: `${(photo.height / photo.width) * 100}%` }} />}

            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading="lazy"
              className={`photo-img${loaded.has(photo.id) ? " loaded" : ""}`}
              onLoad={() =>
                setLoaded((prev) => new Set(prev).add(photo.id))
              }
            />

            {/* Hover overlay */}
            <div className="photo-overlay">
              <ZoomIn size={28} className="overlay-icon" />
            </div>

            {/* Caption */}
            <div className="photo-caption">{photo.aircraft}</div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════
          LIGHTBOX
      ═══════════════════════════════════════ */}
      {lightboxIndex !== null && currentPhoto && (
        <div
          className="lightbox-backdrop"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Przeglądarka zdjęć"
        >
          {/* Top bar */}
          <div className="lb-topbar" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              {/* Info toggle */}
              <button
                className="lb-ctrl-btn"
                onClick={() => setInfoOpen((v) => !v)}
                aria-label="Informacje o zdjęciu"
                title="Informacje"
              >
                <Info size={16} />
              </button>
            </div>

            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "var(--text-sm)",
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "-0.02em",
              }}
            >
              Air<span style={{ color: "var(--color-accent)" }}>Show</span>
            </span>

            {/* Close */}
            <button
              className="lb-ctrl-btn"
              onClick={() => setLightboxIndex(null)}
              aria-label="Zamknij (Esc)"
              title="Zamknij"
            >
              <X size={16} />
            </button>
          </div>

          {/* Prev button */}
          <button
            className="lb-nav-btn lb-nav-prev"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(
                (i) => (i !== null ? (i - 1 + photos.length) % photos.length : 0)
              );
            }}
            aria-label="Poprzednie zdjęcie"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Image */}
          <div
            className="lb-image-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              key={currentPhoto.id}
              src={currentPhoto.src}
              alt={currentPhoto.alt}
              width={currentPhoto.width}
              height={currentPhoto.height}
              style={{
                maxWidth: "min(92vw, 1100px)",
                maxHeight: "78vh",
                width: "auto",
                height: "auto",
                display: "block",
              }}
              priority
            />

            {/* Inline info panel */}
            {infoOpen && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
                  padding: "var(--space-8) var(--space-5) var(--space-5)",
                  animation: "fadeIn 0.2s ease",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "var(--text-lg)",
                    color: "#fff",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  {currentPhoto.aircraft}
                </p>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "rgba(255,255,255,0.6)",
                    fontStyle: "italic",
                  }}
                >
                  {currentPhoto.alt}
                </p>
              </div>
            )}
          </div>

          {/* Next button */}
          <button
            className="lb-nav-btn lb-nav-next"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) =>
                i !== null ? (i + 1) % photos.length : 0
              );
            }}
            aria-label="Następne zdjęcie"
          >
            <ChevronRight size={22} />
          </button>

          {/* Bottom info + dots */}
          <div
            className="lb-info-bar"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="lb-aircraft">{currentPhoto.aircraft}</div>
              <div className="lb-alt">{currentPhoto.alt}</div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
              }}
            >
              <span className="lb-counter">
                {lightboxIndex + 1} / {photos.length}
              </span>
              {/* Download button */}
              <a
                href={currentPhoto.src}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="lb-ctrl-btn"
                title="Pobierz zdjęcie"
                aria-label="Pobierz zdjęcie"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  width: "40px",
                  height: "40px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.8)",
                  transition: "background 0.2s ease",
                }}
              >
                <Download size={15} />
              </a>
            </div>
          </div>

          {/* Dot navigation */}
          {photos.length <= 20 && (
            <div
              className="lb-dots"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((_, i) => (
                <button
                  key={i}
                  className={`lb-dot${i === lightboxIndex ? " active" : ""}`}
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Zdjęcie ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Keyboard hint */}
          <div className="lb-kbd-hint">
            <span className="kbd">← →</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
              nawigacja
            </span>
            <span className="kbd">Esc</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
              zamknij
            </span>
          </div>
        </div>
      )}
    </>
  );
}