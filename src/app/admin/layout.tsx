"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Images, Upload, Clapperboard,
  Settings, LogOut, Menu, X, ChevronRight,
  Plane, Bell, Sun, Moon,
} from "lucide-react";

const ADMIN_PIN = "1234";

const NAV = [
  { href: "/admin",               label: "Dashboard",      icon: LayoutDashboard, exact: true },
  { href: "/admin/photos",        label: "Zdjęcia",        icon: Images },
  { href: "/admin/photos/upload", label: "Dodaj zdjęcia",  icon: Upload },
  { href: "/admin/shows",         label: "Pokazy",         icon: Clapperboard },
  { href: "/admin/settings",      label: "Ustawienia",     icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pin === ADMIN_PIN) { setAuthed(true); setPinError(false); }
    else { setPinError(true); setPin(""); }
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const crumbMap: Record<string, string> = {
    admin: "Admin", photos: "Zdjęcia", upload: "Upload",
    shows: "Pokazy", settings: "Ustawienia",
  };

  // ─── LOGIN ──────────────────────────────────────────────────
  if (!authed) return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--color-bg)", padding: "var(--space-4)",
    }}>
      <div style={{
        width: "100%", maxWidth: 360,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-2xl)",
        padding: "var(--space-10)",
        boxShadow: "var(--shadow-xl)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "var(--radius-xl)",
            background: "var(--color-accent-subtle)",
            border: "1px solid var(--color-accent-subtle-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto var(--space-4)", color: "var(--color-accent)",
          }}>
            <Plane size={24} />
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 900,
            fontSize: "var(--text-xl)", letterSpacing: "-0.03em", marginBottom: "var(--space-1)",
          }}>Admin Panel</h1>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
            AirShow Gallery
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "var(--space-4)" }}>
            <label style={{
              display: "block", fontSize: "var(--text-xs)", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.08em",
              color: "var(--color-text-muted)", marginBottom: "var(--space-2)",
            }}>PIN dostępu</label>
            <input
              className="input"
              type="password"
              inputMode="numeric"
              maxLength={8}
              placeholder="••••"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(false); }}
              autoFocus
              style={{
                fontSize: "var(--text-lg)", textAlign: "center",
                letterSpacing: "0.4em", fontWeight: 700,
                borderColor: pinError ? "var(--color-accent)" : undefined,
              }}
            />
            {pinError && (
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", marginTop: "var(--space-2)", textAlign: "center" }}>
                Nieprawidłowy PIN. Spróbuj ponownie.
              </p>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Zaloguj się
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "var(--space-6)", fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
          Demo PIN:{" "}
          <code style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
            1234
          </code>
        </p>
      </div>
    </div>
  );

  // ─── MAIN LAYOUT ────────────────────────────────────────────
  return (
    <>
      <style>{`
        .admin-sidebar {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 240px;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          display: flex; flex-direction: column;
          z-index: var(--z-sticky, 200);
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        @media (max-width: 1023px) {
          .admin-sidebar { transform: translateX(-100%); box-shadow: var(--shadow-xl); }
          .admin-sidebar.open { transform: translateX(0); }
        }
        .admin-main {
          margin-left: 240px;
          min-height: 100dvh;
          display: flex; flex-direction: column;
          background: var(--color-bg);
        }
        @media (max-width: 1023px) { .admin-main { margin-left: 0; } }

        .nav-item {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm); font-weight: 500;
          color: var(--color-text-muted);
          text-decoration: none;
          transition: background var(--transition, 180ms), color var(--transition, 180ms);
          position: relative; min-height: 44px;
          cursor: pointer; border: none; background: none;
          width: 100%; text-align: left;
        }
        .nav-item:hover { background: var(--color-surface-offset); color: var(--color-text); }
        .nav-item.active {
          background: var(--color-accent-subtle);
          color: var(--color-accent);
          font-weight: 600;
        }
        .nav-item.active::before {
          content: "";
          position: absolute; left: 0; top: 25%; bottom: 25%;
          width: 3px; border-radius: var(--radius-full);
          background: var(--color-accent);
        }
        .admin-header {
          height: 56px; border-bottom: 1px solid var(--color-border);
          background: var(--color-surface);
          display: flex; align-items: center;
          padding: 0 var(--space-6); gap: var(--space-4);
          position: sticky; top: 0; z-index: 10;
        }
        .sidebar-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(2px);
          z-index: 190;
        }
        .sidebar-overlay.open { display: block; }
        .admin-content {
          flex: 1;
          padding: var(--space-6);
        }
        @media (max-width: 640px) { .admin-content { padding: var(--space-4); } }
        #admin-hamburger { display: none; }
        @media (max-width: 1023px) { #admin-hamburger { display: flex !important; } }
      `}</style>

      {/* Overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Brand */}
        <div style={{
          padding: "var(--space-5) var(--space-5) var(--space-4)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", gap: "var(--space-3)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "var(--radius-md)",
            background: "var(--color-accent-subtle)",
            border: "1px solid var(--color-accent-subtle-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--color-accent)", flexShrink: 0,
          }}>
            <Plane size={16} />
          </div>
          <div>
            <p style={{
              fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: "var(--text-sm)", letterSpacing: "-0.02em", lineHeight: 1.2,
            }}>AirShow</p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "var(--space-3)", overflowY: "auto" }}>
          <p style={{
            fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: "var(--color-text-faint)",
            padding: "var(--space-2) var(--space-4)", marginBottom: "var(--space-1)",
          }}>Menu</p>
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} className={`nav-item ${isActive(href, exact) ? "active" : ""}`}>
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "var(--space-3)", borderTop: "1px solid var(--color-border)" }}>
          <button className="nav-item" onClick={() => { setAuthed(false); setPin(""); }}>
            <LogOut size={17} />
            Wyloguj
          </button>
          <Link href="/" className="nav-item" style={{ marginTop: "var(--space-1)" }}>
            <ChevronRight size={17} />
            Wróć na stronę
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <button
            id="admin-hamburger"
            className="btn btn-icon btn-subtle"
            aria-label="Menu"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Breadcrumbs */}
          <nav style={{ flex: 1, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            {pathname.split("/").filter(Boolean).map((seg, i, arr) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                {i > 0 && <ChevronRight size={12} style={{ color: "var(--color-text-faint)" }} />}
                <span style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: i === arr.length - 1 ? 600 : 400,
                  color: i === arr.length - 1 ? "var(--color-text)" : "var(--color-text-faint)",
                }}>
                  {crumbMap[seg] ?? seg}
                </span>
              </span>
            ))}
          </nav>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <button className="btn btn-icon btn-subtle btn-sm" aria-label="Powiadomienia">
              <Bell size={16} />
            </button>
            <button
              className="btn btn-icon btn-subtle btn-sm"
              aria-label="Motyw"
              onClick={() => setDark((d) => !d)}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div style={{
              width: 32, height: 32, borderRadius: "var(--radius-full)",
              background: "var(--color-accent-subtle)",
              border: "1.5px solid var(--color-accent-subtle-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "var(--text-xs)", fontWeight: 700,
              color: "var(--color-accent)", flexShrink: 0, userSelect: "none",
            }}>M</div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">{children}</main>
      </div>
    </>
  );
}