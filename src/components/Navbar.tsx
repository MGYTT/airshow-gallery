"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, Plane } from "lucide-react";

const NAV_LINKS = [
  { href: "/",        label: "Start"  },
  { href: "/gallery", label: "Galeria" },
  { href: "/#pokazy", label: "Pokazy" },
  { href: "/#o-mnie", label: "O mnie" },
  { href: "/kalendarz", label: "Kalendarz" },

];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme,    setTheme]    = useState<"light" | "dark">("dark");
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Sync theme ze stanem DOM przy mount
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as "light" | "dark" | null;
    if (current) setTheme(current);
  }, []);

  // Scroll listener — throttled przez requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Zamknij drawer przy zmianie trasy
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Zablokuj scroll body gdy menu otwarte
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Zamknij drawer przy Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    if (menuOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  const isActive = useCallback((href: string) => {
    if (href === "/") return pathname === "/";
    const base = href.split("#")[0];
    if (!base || base === "/") return false;
    if (href === "/gallery") return pathname.startsWith("/gallery") || pathname.startsWith("/pokaz");
    return pathname.startsWith(base);
  }, [pathname]);

  return (
    <>
      <style>{`
        /* ── Base ── */
        .nb{position:fixed;top:0;left:0;right:0;z-index:200;transition:background .3s,border-color .3s,box-shadow .3s}
        .nb.scrolled{background:oklch(from var(--color-bg) l c h / .92);border-bottom:1px solid var(--color-border);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 1px 12px oklch(0 0 0 / .06)}
        .nb.top{background:transparent;border-bottom:1px solid transparent}

        /* ── Inner ── */
        .nb-inner{max-width:var(--content-wide,1200px);margin:0 auto;padding:0 var(--space-8);display:flex;align-items:center;height:64px;gap:var(--space-4)}
        @media(max-width:640px){.nb-inner{padding:0 var(--space-5)}}

        /* ── Logo ── */
        .nb-logo{display:flex;align-items:center;gap:var(--space-2);text-decoration:none;flex-shrink:0;outline:none}
        .nb-logo:focus-visible{outline:2px solid var(--color-primary);outline-offset:3px;border-radius:var(--radius-sm)}
        .nb-logo-text{font-family:var(--font-display);font-weight:900;font-size:var(--text-lg);letter-spacing:-0.03em;color:var(--color-text);transition:opacity .2s}
        .nb-logo:hover .nb-logo-text{opacity:.8}

        /* ── Desktop links ── */
        .nb-links{display:flex;align-items:center;gap:2px;flex:1;justify-content:center}
        .nb-link{position:relative;display:inline-flex;align-items:center;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:500;color:var(--color-text-muted);text-decoration:none;transition:color .18s,background .18s;outline:none}
        .nb-link:hover{color:var(--color-text);background:var(--color-surface-offset)}
        .nb-link:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}
        .nb-link.active{color:var(--color-text);font-weight:600}
        .nb-link.active::after{content:'';position:absolute;bottom:5px;left:50%;transform:translateX(-50%);width:14px;height:2px;background:var(--color-accent,#cc1f1f);border-radius:var(--radius-full);transition:width .2s}
        .nb-link:hover::after{content:'';position:absolute;bottom:5px;left:50%;transform:translateX(-50%);width:14px;height:2px;background:var(--color-border);border-radius:var(--radius-full)}
        .nb-link.active:hover::after{background:var(--color-accent,#cc1f1f)}

        /* ── Controls ── */
        .nb-controls{display:flex;align-items:center;gap:var(--space-2);flex-shrink:0;margin-left:auto}
        .nb-icon-btn{width:36px;height:36px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);background:transparent;border:1px solid var(--color-border);cursor:pointer;transition:background .18s,color .18s,border-color .18s;outline:none;flex-shrink:0}
        .nb-icon-btn:hover{background:var(--color-surface-offset);color:var(--color-text);border-color:var(--color-text-faint)}
        .nb-icon-btn:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}
        .nb-icon-btn:active{transform:scale(.92)}

        /* ── CTA ── */
        .nb-cta{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-4);border-radius:var(--radius-md);background:var(--color-accent,#cc1f1f);color:#fff;font-size:var(--text-sm);font-weight:700;text-decoration:none;transition:background .18s,transform .15s,box-shadow .18s;box-shadow:0 2px 8px oklch(from var(--color-accent,#cc1f1f) l c h / .3);white-space:nowrap;outline:none;flex-shrink:0}
        .nb-cta:hover{background:var(--color-accent-hover,#aa1515);transform:translateY(-1px);box-shadow:0 4px 16px oklch(from var(--color-accent,#cc1f1f) l c h / .4)}
        .nb-cta:active{transform:scale(.96)}
        .nb-cta:focus-visible{outline:2px solid var(--color-primary);outline-offset:3px}

        /* ── Hamburger (mobile only) ── */
        .nb-hamburger{display:none}
        @media(max-width:768px){.nb-links{display:none}.nb-cta{display:none}.nb-hamburger{display:flex}}

        /* ── Mobile overlay ── */
        @keyframes nb-overlay-in{from{opacity:0}to{opacity:1}}
        @keyframes nb-overlay-out{from{opacity:1}to{opacity:0}}
        .nb-overlay{position:fixed;inset:0;z-index:199;background:oklch(0 0 0 / .5);backdrop-filter:blur(3px);animation:nb-overlay-in .2s ease}

        /* ── Mobile drawer ── */
        @keyframes nb-drawer-in{from{transform:translateX(100%);opacity:.5}to{transform:translateX(0);opacity:1}}
        .nb-drawer{position:fixed;top:0;right:0;bottom:0;width:min(300px,85vw);z-index:200;background:var(--color-bg);border-left:1px solid var(--color-border);display:flex;flex-direction:column;box-shadow:-12px 0 40px oklch(0 0 0 / .15);animation:nb-drawer-in .28s cubic-bezier(.16,1,.3,1)}
        .nb-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:0 var(--space-5);height:64px;border-bottom:1px solid var(--color-divider);flex-shrink:0}
        .nb-drawer-body{flex:1;overflow-y:auto;padding:var(--space-5);display:flex;flex-direction:column;gap:4px}
        .nb-mobile-link{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);font-size:var(--text-base);font-weight:500;color:var(--color-text-muted);text-decoration:none;border:1px solid transparent;transition:background .15s,color .15s,transform .15s;outline:none}
        .nb-mobile-link:hover{background:var(--color-surface-offset);color:var(--color-text);transform:translateX(3px)}
        .nb-mobile-link:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}
        .nb-mobile-link.active{background:oklch(from var(--color-accent,#cc1f1f) l c h / .08);border-color:oklch(from var(--color-accent,#cc1f1f) l c h / .3);color:var(--color-accent,#cc1f1f);font-weight:600}
        .nb-mobile-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0;opacity:.45}
        .nb-drawer-foot{padding:var(--space-5);border-top:1px solid var(--color-divider);display:flex;flex-direction:column;gap:var(--space-3);flex-shrink:0}
        .nb-mobile-cta{display:flex;align-items:center;justify-content:center;gap:var(--space-2);padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);background:var(--color-accent,#cc1f1f);color:#fff;font-size:var(--text-sm);font-weight:700;text-decoration:none;transition:background .18s,transform .15s}
        .nb-mobile-cta:hover{background:var(--color-accent-hover,#aa1515);transform:translateY(-1px)}
        .nb-theme-row{display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);border:1px solid var(--color-border);background:var(--color-surface)}
      `}</style>

      <header className={`nb ${scrolled ? "scrolled" : "top"}`}>
        <div className="nb-inner">

          {/* Logo */}
          <Link href="/" className="nb-logo" aria-label="AirShow — strona główna">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden>
              <path d="M4 20 L18 10 L32 20 L26 20 L22 28 L18 26 L14 28 L10 20 Z" fill="var(--color-accent,#cc1f1f)"/>
              <circle cx="18" cy="19" r="2.5" fill="var(--color-bg)"/>
            </svg>
            <span className="nb-logo-text">
              Air<span style={{ color:"var(--color-accent,#cc1f1f)" }}>Show</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="nb-links" aria-label="Nawigacja główna">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`nb-link ${isActive(link.href) ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Controls */}
          <div className="nb-controls">
            <button
              onClick={toggleTheme}
              className="nb-icon-btn"
              aria-label={`Przełącz na tryb ${theme === "light" ? "ciemny" : "jasny"}`}
            >
              {theme === "light" ? <Moon size={15}/> : <Sun size={15}/>}
            </button>
            <Link href="/gallery" className="nb-cta">
              <Plane size={13}/> Przeglądaj
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              className="nb-icon-btn nb-hamburger"
              aria-label="Otwórz menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-drawer"
            >
              <Menu size={17}/>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div
            className="nb-overlay"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            id="mobile-drawer"
            className="nb-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu nawigacji"
          >
            <div className="nb-drawer-head">
              <Link href="/" className="nb-logo" onClick={() => setMenuOpen(false)}>
                <svg width="26" height="26" viewBox="0 0 36 36" fill="none" aria-hidden>
                  <path d="M4 20 L18 10 L32 20 L26 20 L22 28 L18 26 L14 28 L10 20 Z" fill="var(--color-accent,#cc1f1f)"/>
                  <circle cx="18" cy="19" r="2.5" fill="var(--color-bg)"/>
                </svg>
                <span className="nb-logo-text" style={{ fontSize:"var(--text-base)" }}>
                  Air<span style={{ color:"var(--color-accent,#cc1f1f)" }}>Show</span>
                </span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="nb-icon-btn"
                aria-label="Zamknij menu"
              >
                <X size={17}/>
              </button>
            </div>

            <div className="nb-drawer-body">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nb-mobile-link ${isActive(link.href) ? "active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="nb-mobile-dot" aria-hidden/>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="nb-drawer-foot">
              <div className="nb-theme-row">
                <span style={{ fontSize:"var(--text-sm)", fontWeight:500, color:"var(--color-text-muted)" }}>
                  {theme === "light" ? "Tryb jasny" : "Tryb ciemny"}
                </span>
                <button
                  onClick={toggleTheme}
                  className="nb-icon-btn"
                  style={{ border:"none", background:"transparent" }}
                  aria-label="Przełącz motyw"
                >
                  {theme === "light" ? <Moon size={15}/> : <Sun size={15}/>}
                </button>
              </div>
              <Link href="/gallery" className="nb-mobile-cta" onClick={() => setMenuOpen(false)}>
                <Plane size={14}/> Przeglądaj galerię
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}