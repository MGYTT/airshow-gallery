"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, Plane } from "lucide-react";

const NAV_LINKS = [
  { href: "/",        label: "Start" },
  { href: "/gallery", label: "Galeria" },
  { href: "/#pokazy", label: "Pokazy" },
  { href: "/#o-mnie", label: "O mnie" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme]       = useState<"light" | "dark">("dark");
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Sync theme ze stanem DOM
    const current = document.documentElement.getAttribute("data-theme") as "light" | "dark";
    if (current) setTheme(current);

    // Scroll detection
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // init
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Zamknij menu przy zmianie route
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Zablokuj scroll body gdy menu otwarte
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const isActive = (href: string) => {
  if (href === "/") return pathname === "/";
  const base = href.split("#")[0];
  if (base === "/") return false;
  if (href === "/gallery") {
    return pathname.startsWith("/gallery") || pathname.startsWith("/pokaz");
  }
  return pathname.startsWith(base);
};

  return (
    <>
      <style>{`
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          transition: background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease, box-shadow 0.35s ease;
        }
        .navbar.scrolled {
          background: var(--color-bg);
          border-bottom: 1px solid var(--color-border);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
        }
        .navbar.top {
          background: transparent;
          border-bottom: 1px solid transparent;
          backdrop-filter: none;
        }
        .nav-inner {
          max-width: var(--content-wide, 1200px);
          margin: 0 auto;
          padding: 0 var(--space-8);
          display: flex; align-items: center;
          justify-content: space-between;
          height: 64px;
          gap: var(--space-4);
        }
        @media (max-width: 640px) {
          .nav-inner { padding: 0 var(--space-5); }
        }

        /* ── Logo ── */
        .nav-logo {
          display: flex; align-items: center; gap: var(--space-2);
          text-decoration: none; flex-shrink: 0;
          transition: opacity 0.2s;
        }
        .nav-logo:hover { opacity: 0.85; }
        .nav-logo-text {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: var(--text-lg);
          letter-spacing: -0.03em;
          color: var(--color-text);
        }

        /* ── Desktop links ── */
        .nav-links {
          display: flex; align-items: center;
          gap: var(--space-1);
          flex: 1; justify-content: center;
        }
        .nav-link {
          position: relative;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: var(--text-sm); font-weight: 500;
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color 0.2s, background 0.2s;
        }
        .nav-link:hover {
          color: var(--color-text);
          background: var(--color-surface-offset);
        }
        .nav-link.active {
          color: var(--color-text);
          font-weight: 600;
        }
        .nav-link.active::after {
          content: '';
          position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
          width: 16px; height: 2px;
          background: var(--color-accent);
          border-radius: var(--radius-full);
        }

        /* ── Right controls ── */
        .nav-controls {
          display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0;
        }
        .nav-icon-btn {
          width: 38px; height: 38px;
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          color: var(--color-text-muted);
          background: transparent;
          border: 1px solid var(--color-border);
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s;
        }
        .nav-icon-btn:hover {
          background: var(--color-surface);
          color: var(--color-text);
          border-color: var(--color-border-strong, var(--color-border));
        }
        .nav-icon-btn:active { transform: scale(0.93); }

        /* ── CTA button ── */
        .nav-cta {
          display: flex; align-items: center; gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          background: var(--color-accent);
          color: #fff !important;
          font-size: var(--text-sm); font-weight: 700;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(204,31,31,0.25);
        }
        .nav-cta:hover {
          background: var(--color-accent-hover, #aa1515);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(204,31,31,0.35);
        }
        .nav-cta:active { transform: scale(0.96); }

        /* ── Hamburger ── */
        .nav-hamburger {
          display: none;
        }
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .nav-cta   { display: none; }
          .nav-hamburger { display: flex; }
        }

        /* ── Mobile menu overlay ── */
        .mobile-overlay {
          position: fixed; inset: 0; z-index: 199;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          animation: overlayIn 0.25s ease;
        }
        @keyframes overlayIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }

        /* ── Mobile menu drawer ── */
        .mobile-drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(320px, 85vw);
          z-index: 200;
          background: var(--color-bg);
          border-left: 1px solid var(--color-border);
          display: flex; flex-direction: column;
          box-shadow: -8px 0 32px rgba(0,0,0,0.15);
          animation: drawerIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes drawerIn {
          from { transform: translateX(100%); opacity: 0 }
          to   { transform: translateX(0);   opacity: 1 }
        }
        .mobile-drawer-header {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-5);
          height: 64px;
          border-bottom: 1px solid var(--color-divider);
          flex-shrink: 0;
        }
        .mobile-drawer-body {
          flex: 1; overflow-y: auto;
          padding: var(--space-6) var(--space-5);
          display: flex; flex-direction: column; gap: var(--space-2);
        }
        .mobile-link {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-4) var(--space-4);
          border-radius: var(--radius-lg);
          font-size: var(--text-base); font-weight: 500;
          color: var(--color-text-muted);
          text-decoration: none;
          border: 1px solid transparent;
          transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s;
        }
        .mobile-link:hover {
          background: var(--color-surface-offset);
          color: var(--color-text);
          transform: translateX(4px);
        }
        .mobile-link.active {
          background: var(--color-accent-subtle, rgba(204,31,31,0.08));
          border-color: var(--color-accent);
          color: var(--color-accent);
          font-weight: 600;
        }
        .mobile-link-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0; opacity: 0.5;
        }
        .mobile-drawer-footer {
          padding: var(--space-5);
          border-top: 1px solid var(--color-divider);
          display: flex; flex-direction: column; gap: var(--space-3);
          flex-shrink: 0;
        }
        .mobile-cta {
          display: flex; align-items: center; justify-content: center;
          gap: var(--space-2);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          background: var(--color-accent);
          color: #fff; font-size: var(--text-sm); font-weight: 700;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .mobile-cta:hover { background: var(--color-accent-hover, #aa1515); transform: translateY(-1px); }
        .mobile-theme-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
        }
      `}</style>

      <header className={`navbar ${scrolled ? "scrolled" : "top"}`}>
        <div className="nav-inner">

          {/* ── Logo ── */}
          <Link href="/" className="nav-logo">
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-label="AirShow Gallery Logo">
              <path
                d="M4 20 L18 10 L32 20 L26 20 L22 28 L18 26 L14 28 L10 20 Z"
                fill="var(--color-accent)"
              />
              <path
                d="M16 20 L20 20 L20 24 L18 25 L16 24 Z"
                fill="var(--color-text-inverse)"
                style={{ mixBlendMode: "overlay" }}
              />
              <circle cx="18" cy="19" r="2.5" fill="var(--color-bg)" />
            </svg>
            <span className="nav-logo-text">
              Air<span style={{ color: "var(--color-accent)" }}>Show</span>
            </span>
          </Link>

          {/* ── Desktop links ── */}
          <nav className="nav-links" aria-label="Nawigacja główna">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive(link.href) ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── Right controls ── */}
          <div className="nav-controls">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="nav-icon-btn"
              aria-label={`Przełącz na tryb ${theme === "light" ? "ciemny" : "jasny"}`}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* CTA — desktop only */}
            <Link href="/gallery" className="nav-cta">
              <Plane size={14} />
              Przeglądaj
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(true)}
              className="nav-icon-btn nav-hamburger"
              aria-label="Otwórz menu"
              aria-expanded={menuOpen}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <>
          {/* Overlay */}
          <div
            className="mobile-overlay"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />

          {/* Drawer */}
          <div className="mobile-drawer" role="dialog" aria-label="Menu nawigacji">
            {/* Header */}
            <div className="mobile-drawer-header">
              <Link href="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
                <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                  <path d="M4 20 L18 10 L32 20 L26 20 L22 28 L18 26 L14 28 L10 20 Z" fill="var(--color-accent)" />
                  <circle cx="18" cy="19" r="2.5" fill="var(--color-bg)" />
                </svg>
                <span className="nav-logo-text" style={{ fontSize: "var(--text-base)" }}>
                  Air<span style={{ color: "var(--color-accent)" }}>Show</span>
                </span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="nav-icon-btn"
                aria-label="Zamknij menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Links */}
            <div className="mobile-drawer-body">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-link ${isActive(link.href) ? "active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="mobile-link-dot" />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Footer */}
            <div className="mobile-drawer-footer">
              {/* Theme row */}
              <div className="mobile-theme-row">
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-muted)" }}>
                  {theme === "light" ? "Tryb jasny" : "Tryb ciemny"}
                </span>
                <button
                  onClick={toggleTheme}
                  className="nav-icon-btn"
                  style={{ border: "none", background: "transparent" }}
                  aria-label="Przełącz motyw"
                >
                  {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                </button>
              </div>

              {/* CTA */}
              <Link href="/gallery" className="mobile-cta" onClick={() => setMenuOpen(false)}>
                <Plane size={15} />
                Przeglądaj galerię
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}