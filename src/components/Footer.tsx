"use client";

import Link from "next/link";
import { Instagram, Mail, Camera, MapPin, ExternalLink, Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style jsx>{`
        .footer-root {
          border-top: 1px solid var(--color-divider);
          background: var(--color-surface);
          position: relative;
          overflow: hidden;
        }

        .footer-accent-bar {
          height: 3px;
          background: linear-gradient(
            to right,
            var(--color-accent) 0%,
            transparent 70%
          );
        }

        .footer-bg-text {
          position: absolute;
          bottom: -0.15em;
          right: -0.02em;
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(6rem, 18vw, 18rem);
          line-height: 1;
          color: var(--color-text);
          opacity: 0.025;
          user-select: none;
          pointer-events: none;
          letter-spacing: -0.06em;
          white-space: nowrap;
        }

        /* ── MAIN GRID — mobile: 1 kolumna, desktop: 3 kolumny ── */
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-10);
          margin-bottom: var(--space-4);
        }
        @media (min-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: var(--space-8);
          }
        }
        @media (min-width: 1024px) {
          .footer-grid {
            grid-template-columns: 2fr 1fr 1fr;
            gap: var(--space-12);
          }
        }

        /* ── Brand col — pełna szerokość tylko na mobile ── */
        .footer-brand {
          max-width: 100%;
        }
        @media (min-width: 640px) {
          .footer-brand {
            grid-column: 1 / -1; /* całą szerokość na tabletach */
          }
        }
        @media (min-width: 1024px) {
          .footer-brand {
            grid-column: auto;
            max-width: 380px;
          }
        }

        /* ── Section label ── */
        .section-label {
          font-size: var(--text-xs);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-faint);
          margin-bottom: var(--space-4);
        }

        /* ── Nav links ── */
        .footer-nav-link {
          display: flex;
          align-items: center;
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          text-decoration: none;
          padding: var(--space-2) 0;
          border-bottom: 1px solid transparent;
          transition: color 0.2s ease, border-color 0.2s ease;
          width: fit-content;
          min-height: 44px; /* touch target */
        }
        .footer-nav-link:hover {
          color: var(--color-text);
          border-bottom-color: var(--color-accent);
        }

        /* ── Social links ── */
        .footer-social-link {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          background: transparent;
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          font-weight: 500;
          text-decoration: none;
          min-height: 56px; /* touch target */
          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease,
            transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 0.2s ease;
        }
        .footer-social-link:hover {
          background: var(--color-surface-2);
          border-color: var(--color-accent);
          color: var(--color-text);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }
        .footer-social-link:active {
          transform: scale(0.98);
        }
        .footer-social-link:hover .social-icon {
          color: var(--color-accent);
        }
        .social-icon {
          transition: color 0.2s ease;
          flex-shrink: 0;
        }

        /* ── Show badges ── */
        .show-badges-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }
        .show-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 600;
          border: 1px solid var(--color-border);
          background: var(--color-surface-offset);
          color: var(--color-text-muted);
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
          cursor: default;
        }
        .show-badge:hover {
          border-color: var(--color-accent);
          color: var(--color-accent);
          background: var(--color-accent-subtle);
        }
        .show-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: var(--color-accent);
          flex-shrink: 0;
        }

        /* ── Divider ── */
        .footer-divider {
          height: 1px;
          background: var(--color-divider);
          margin: var(--space-8) 0 var(--space-6);
        }

        /* ── Bottom bar — mobile: kolumna, desktop: row ── */
        .footer-bottom {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-3);
        }
        @media (min-width: 768px) {
          .footer-bottom {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .bottom-text {
          font-size: var(--text-xs);
          color: var(--color-text-faint);
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        /* ── Nav cols — na 640px obok siebie ── */
        .footer-nav-cols {
          display: contents;
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .footer-nav-cols {
            display: grid;
            grid-column: 1 / -1;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-8);
          }
        }
      `}</style>

      <footer className="footer-root">
        <div className="footer-accent-bar" />

        <div className="footer-bg-text" aria-hidden="true">AIR</div>

        <div
          className="container"
          style={{
            paddingTop: "var(--space-12)",
            paddingBottom: "var(--space-8)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* ═══ MAIN GRID ═══ */}
          <div className="footer-grid">

            {/* ── Col 1: Brand ── */}
            <div className="footer-brand">
              {/* Logo */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-5)",
                }}
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                  <path
                    d="M4 20 L18 10 L32 20 L26 20 L22 28 L18 26 L14 28 L10 20 Z"
                    fill="var(--color-accent)"
                  />
                  <circle cx="18" cy="19" r="2.5" fill="var(--color-bg)" />
                </svg>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: "var(--text-xl)",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  Air<span style={{ color: "var(--color-accent)" }}>Show</span>
                  <span
                    style={{
                      fontWeight: 400,
                      color: "var(--color-text-faint)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    {" "}Gallery
                  </span>
                </span>
              </div>

              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.7,
                  marginBottom: "var(--space-4)",
                  maxWidth: "380px",
                }}
              >
                Prywatna galeria fotograficzna miłośnika lotnictwa z okolic Nowego Targu.
                Każde zdjęcie to wspomnienie — od dziecięcych pikników po NATO Days 2025.
              </p>

              {/* Location pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-faint)",
                  fontWeight: 500,
                  padding: "var(--space-1) var(--space-3)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-full)",
                  background: "var(--color-surface-offset)",
                  marginBottom: "var(--space-5)",
                }}
              >
                <MapPin size={11} />
                Nowy Targ, Polska
              </div>

              {/* Shows attended */}
              <p className="section-label">Byłem na:</p>
              <div className="show-badges-wrap">
                {["NATO Days 2025", "Piknik Lotniczy Nowy Targ"].map((show) => (
                  <span key={show} className="show-badge">
                    <span className="show-badge-dot" />
                    {show}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Nav + Contact — wrapper dla tabletu ── */}
            <div className="footer-nav-cols">

              {/* Col 2: Navigation */}
              <div>
                <p className="section-label">Nawigacja</p>
                <nav style={{ display: "flex", flexDirection: "column" }}>
                  {[
                    { href: "/", label: "Strona główna" },
                    { href: "/gallery", label: "Galeria zdjęć" },
                    { href: "/#pokazy", label: "Pokazy lotnicze" },
                    { href: "/#o-mnie", label: "O mnie" },
                  ].map(({ href, label }) => (
                    <Link key={href} href={href} className="footer-nav-link">
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Col 3: Contact */}
              <div>
                <p className="section-label">Kontakt</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  {[
                    {
                      icon: <Instagram size={16} className="social-icon" />,
                      label: "@mgyt_spotting",
                      sub: "Instagram",
                      href: "https://www.instagram.com/mgyt_spotting/",
                    },
                    {
                      icon: <Mail size={16} className="social-icon" />,
                      label: "Napisz do mnie",
                      sub: "E-mail",
                      href: "mailto:bieniekmaks4@gmail.com",
                    },
                    {
                      icon: <Camera size={16} className="social-icon" />,
                      label: "Galeria lotnicza",
                      sub: "Portfolio",
                      href: "/gallery",
                    },
                  ].map(({ icon, label, sub, href }) => (
                    <a
                      key={label}
                      href={href}
                      className="footer-social-link"
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {icon}
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            display: "block",
                            lineHeight: 1.3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-text-faint)",
                            fontWeight: 400,
                          }}
                        >
                          {sub}
                        </span>
                      </span>
                      {href.startsWith("http") || href.startsWith("mailto") ? (
  <ExternalLink size={12} style={{ color: "var(--color-text-faint)", flexShrink: 0 }} />
) : null}
                    </a>
                  ))}
                </div>
              </div>

            </div>{/* end footer-nav-cols */}
          </div>{/* end footer-grid */}

          {/* ═══ DIVIDER ═══ */}
          <div className="footer-divider" />

          {/* ═══ BOTTOM BAR ═══ */}
          <div className="footer-bottom">
            <p className="bottom-text">
              © {currentYear} AirShow Gallery
              <span style={{ color: "var(--color-divider)" }} aria-hidden="true">·</span>
              Nowy Targ, Polska
            </p>

            <p className="bottom-text">
              Stworzone z{" "}
              <Heart size={11} fill="var(--color-accent)" stroke="none" />
              {" "}przez mgyt
            </p>
          </div>

        </div>
      </footer>
    </>
  );
}