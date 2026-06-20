"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Images, Upload, Clapperboard,
  Settings, LogOut, Menu, X, ChevronRight,
  Plane, Bell, Sun, Moon,
} from "lucide-react";

const STORAGE_KEY  = "airshow_settings";
const SESSION_KEY  = "airshow_admin_authed";
const ENV_PIN      = process.env.NEXT_PUBLIC_ADMIN_PIN; // opcjonalny fallback

const NAV = [
  { href: "/admin",               label: "Dashboard",     icon: LayoutDashboard, exact: true },
  { href: "/admin/photos",        label: "Zdjęcia",       icon: Images },
  { href: "/admin/photos/upload", label: "Dodaj zdjęcia", icon: Upload },
  { href: "/admin/shows",         label: "Pokazy",        icon: Clapperboard },
  { href: "/admin/settings",      label: "Ustawienia",    icon: Settings },
];

/** Pobierz aktualny PIN: localStorage → env → domyślny */
function getCorrectPin(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.adminPin && String(parsed.adminPin).length >= 4) {
        return String(parsed.adminPin);
      }
    }
  } catch { /* silent */ }
  return ENV_PIN ?? "";  // ← pusty string = nic nie przejdzie
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authed, setAuthed]           = useState(false);
  const [pin, setPin]                 = useState("");
  const [pinError, setPinError]       = useState(false);
  const [attempts, setAttempts]       = useState(0);
  const [lockUntil, setLockUntil]     = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark]               = useState(false);
  const [mounted, setMounted]         = useState(false);
  const [timeLeft, setTimeLeft]       = useState(0);

  // ── Mount: sprawdź sesję i motyw ──
  useEffect(() => {
    setMounted(true);
    // Sesja w sessionStorage przeżywa odświeżenie, ale nie zamknięcie karty
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session === "true") setAuthed(true);
    // Motyw
    const isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
  }, []);

  // ── Motyw ──
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark, mounted]);

  // ── Zamknij sidebar po zmianie strony ──
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // ── Countdown blokady ──
  useEffect(() => {
    if (!lockUntil) return;
    const tick = setInterval(() => {
      const left = Math.ceil((lockUntil - Date.now()) / 1000);
      if (left <= 0) { setLockUntil(null); setAttempts(0); setTimeLeft(0); clearInterval(tick); }
      else setTimeLeft(left);
    }, 1000);
    return () => clearInterval(tick);
  }, [lockUntil]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (lockUntil && Date.now() < lockUntil) return;

    const correct = getCorrectPin();
    if (pin === correct) {
      setAuthed(true);
      setPinError(false);
      setAttempts(0);
      sessionStorage.setItem(SESSION_KEY, "true");
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setPinError(true);
      setPin("");
      // Blokada po 3 nieudanych próbach — 30 sekund
      if (next >= 3) {
        setLockUntil(Date.now() + 30_000);
        setAttempts(0);
      }
    }
  }

  function handleLogout() {
    setAuthed(false);
    setPin("");
    setPinError(false);
    setAttempts(0);
    sessionStorage.removeItem(SESSION_KEY);
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const crumbMap: Record<string, string> = {
    admin: "Admin", photos: "Zdjęcia", upload: "Upload",
    shows: "Pokazy", settings: "Ustawienia",
  };

  // ── Nie renderuj nic przed hydracją ──
  if (!mounted) return null;

  // ─── LOGIN ───────────────────────────────────────────────────
  if (!authed) return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--color-bg)", padding: "var(--space-4)",
    }}>
      <div style={{
        width: "100%", maxWidth: 360,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-10)",
        boxShadow: "var(--shadow-lg)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "var(--radius-xl)",
            background: "var(--color-accent-subtle)",
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
            }}>
              PIN dostępu
            </label>
            <input
              className="input"
              type="password"
              inputMode="numeric"
              maxLength={16}
              placeholder="••••"
              value={pin}
              disabled={!!lockUntil}
              onChange={(e) => { setPin(e.target.value); setPinError(false); }}
              autoFocus
              style={{
                fontSize: "var(--text-lg)", textAlign: "center",
                letterSpacing: pin ? "0.5em" : "normal",
                fontWeight: 700,
                borderColor: pinError ? "var(--color-accent)" : undefined,
                opacity: lockUntil ? 0.5 : 1,
              }}
            />

            {/* Błąd */}
            {pinError && !lockUntil && (
              <p style={{
                fontSize: "var(--text-xs)", color: "var(--color-accent)",
                marginTop: "var(--space-2)", textAlign: "center", fontWeight: 600,
              }}>
                ✗ Nieprawidłowy PIN.{" "}
                {3 - attempts > 0 && (
                  <span style={{ color: "var(--color-text-faint)" }}>
                    Pozostało prób: {3 - attempts}
                  </span>
                )}
              </p>
            )}

            {/* Blokada */}
            {lockUntil && (
              <p style={{
                fontSize: "var(--text-xs)", color: "var(--color-accent)",
                marginTop: "var(--space-2)", textAlign: "center", fontWeight: 600,
              }}>
                🔒 Za dużo prób. Odczekaj {timeLeft}s
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!!lockUntil || !pin}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              gap: "var(--space-2)", padding: "var(--space-3) var(--space-5)",
              borderRadius: "var(--radius-md)",
              background: (lockUntil || !pin) ? "var(--color-surface-dynamic)" : "var(--color-accent)",
              color: (lockUntil || !pin) ? "var(--color-text-faint)" : "#fff",
              border: "none", cursor: (lockUntil || !pin) ? "not-allowed" : "pointer",
              fontSize: "var(--text-sm)", fontWeight: 700, transition: "all .15s",
            }}
          >
            Zaloguj się
          </button>
        </form>
      </div>
    </div>
  );

  // ─── MAIN LAYOUT ─────────────────────────────────────────────
  return (
    <>
      <style>{`
        .admin-sidebar {
          position: fixed; top: 0; left: 0; bottom: 0; width: 240px;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          display: flex; flex-direction: column;
          z-index: 200;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        @media (max-width: 1023px) {
          .admin-sidebar { transform: translateX(-100%); box-shadow: var(--shadow-xl); }
          .admin-sidebar.open { transform: translateX(0); }
        }
        .admin-main {
          margin-left: 240px; min-height: 100dvh;
          display: flex; flex-direction: column;
          background: var(--color-bg);
        }
        @media (max-width: 1023px) { .admin-main { margin-left: 0; } }
        .nav-item {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm); font-weight: 500;
          color: var(--color-text-muted); text-decoration: none;
          transition: background 180ms, color 180ms;
          position: relative; min-height: 44px;
          cursor: pointer; border: none; background: none;
          width: 100%; text-align: left; font-family: inherit;
        }
        .nav-item:hover { background: var(--color-surface-offset); color: var(--color-text); }
        .nav-item.active {
          background: var(--color-accent-subtle); color: var(--color-accent); font-weight: 600;
        }
        .nav-item.active::before {
          content: ""; position: absolute; left: 0; top: 25%; bottom: 25%;
          width: 3px; border-radius: var(--radius-full); background: var(--color-accent);
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
          background: rgba(0,0,0,0.45); backdrop-filter: blur(2px); z-index: 190;
        }
        .sidebar-overlay.open { display: block; }
        .admin-content { flex: 1; padding: var(--space-6); }
        @media (max-width: 640px) { .admin-content { padding: var(--space-4); } }
        #admin-hamburger { display: none; }
        @media (max-width: 1023px) { #admin-hamburger { display: flex !important; } }
        .icon-btn {
          width: 34px; height: 34px; border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          border: none; cursor: pointer; background: transparent;
          color: var(--color-text-muted); transition: background 150ms, color 150ms;
        }
        .icon-btn:hover { background: var(--color-surface-offset); color: var(--color-text); }
      `}</style>

      {/* Overlay mobile */}
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)} />

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

        {/* Nav */}
        <nav style={{ flex: 1, padding: "var(--space-3)", overflowY: "auto" }}>
          <p style={{
            fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: "var(--color-text-faint)",
            padding: "var(--space-2) var(--space-4)", marginBottom: "var(--space-1)",
          }}>Menu</p>
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href}
              className={`nav-item ${isActive(href, exact) ? "active" : ""}`}>
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "var(--space-3)", borderTop: "1px solid var(--color-border)" }}>
          <button className="nav-item" onClick={handleLogout}>
            <LogOut size={17} /> Wyloguj
          </button>
          <Link href="/" className="nav-item" style={{ marginTop: "var(--space-1)" }}>
            <ChevronRight size={17} /> Wróć na stronę
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-header">
          <button
            id="admin-hamburger"
            className="icon-btn"
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

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
            <button className="icon-btn" aria-label="Powiadomienia">
              <Bell size={16} />
            </button>
            <button className="icon-btn" aria-label="Motyw" onClick={() => setDark((d) => !d)}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div style={{
              width: 32, height: 32, borderRadius: "var(--radius-full)",
              background: "var(--color-accent-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "var(--text-xs)", fontWeight: 700,
              color: "var(--color-accent)", flexShrink: 0, userSelect: "none",
              marginLeft: "var(--space-1)",
            }}>M</div>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </>
  );
}