"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Images,
  Upload,
  Clapperboard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Plane,
  Bell,
  Sun,
  Moon,
  Play,
  CalendarDays,
  BookOpen,
} from "lucide-react";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/photos",
    label: "Zdjęcia",
    icon: Images,
  },
  {
    href: "/admin/photos/upload",
    label: "Dodaj zdjęcia",
    icon: Upload,
  },
  {
    href: "/admin/shows",
    label: "Pokazy",
    icon: Clapperboard,
  },
  {
    href: "/admin/calendar",
    label: "Kalendarz",
    icon: CalendarDays,
  },
  {
    href: "/admin/blog",
    label: "Blog",
    icon: BookOpen,
  },
  {
    href: "/admin/stories",
    label: "Relacje",
    icon: Play,
  },
  {
    href: "/admin/settings",
    label: "Ustawienia",
    icon: Settings,
  },
];

const crumbMap: Record<string, string> = {
  admin: "Admin",
  photos: "Zdjęcia",
  upload: "Dodaj zdjęcia",
  shows: "Pokazy",
  calendar: "Kalendarz",
  new: "Nowe wydarzenie",
  settings: "Ustawienia",
  stories: "Relacje",
  blog: "Blog",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const hasExplicitTheme =
      document.documentElement.getAttribute("data-theme") !== null;

    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark" ||
      (!hasExplicitTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    setDark(isDark);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light"
    );
  }, [dark, mounted]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  if (!mounted) {
    return null;
  }

  const contentNavigation = NAV.filter((item) =>
    [
      "/admin/photos",
      "/admin/photos/upload",
      "/admin/shows",
      "/admin/calendar",
      "/admin/blog",
    ].includes(item.href)
  );

  return (
    <>
      <style>{`
        .admin-sidebar {
          position: fixed;
          z-index: 200;
          top: 0;
          bottom: 0;
          left: 0;
          display: flex;
          flex-direction: column;
          width: 240px;
          border-right: 1px solid var(--color-border);
          background: var(--color-surface);
          transition: transform .3s cubic-bezier(.16,1,.3,1);
        }

        @media (max-width: 1023px) {
          .admin-sidebar {
            box-shadow: var(--shadow-xl);
            transform: translateX(-100%);
          }

          .admin-sidebar.open {
            transform: translateX(0);
          }
        }

        .admin-main {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
          margin-left: 240px;
          background: var(--color-bg);
        }

        @media (max-width: 1023px) {
          .admin-main {
            margin-left: 0;
          }
        }

        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          min-height: 44px;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border: none;
          border-radius: var(--radius-lg);
          background: none;
          color: var(--color-text-muted);
          cursor: pointer;
          font-family: inherit;
          font-size: var(--text-sm);
          font-weight: 500;
          text-align: left;
          text-decoration: none;
          transition: background 180ms, color 180ms;
        }

        .nav-item:hover {
          background: var(--color-surface-offset);
          color: var(--color-text);
        }

        .nav-item.active {
          background: var(--color-accent-subtle);
          color: var(--color-accent);
          font-weight: 600;
        }

        .nav-item.active::before {
          position: absolute;
          top: 25%;
          bottom: 25%;
          left: 0;
          width: 3px;
          border-radius: var(--radius-full);
          background: var(--color-accent);
          content: "";
        }

        .nav-item.stories-link:hover {
          background: oklch(from var(--color-primary) l c h / .08);
          color: var(--color-primary);
        }

        .nav-item.stories-link.active {
          background: oklch(from var(--color-primary) l c h / .1);
          color: var(--color-primary);
        }

        .nav-item.stories-link.active::before {
          background: var(--color-primary);
        }

        .admin-header {
          position: sticky;
          z-index: 10;
          top: 0;
          display: flex;
          align-items: center;
          height: 56px;
          gap: var(--space-4);
          padding: 0 var(--space-6);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface);
        }

        .sidebar-overlay {
          position: fixed;
          z-index: 190;
          inset: 0;
          display: none;
          background: rgba(0,0,0,.45);
          backdrop-filter: blur(2px);
        }

        .sidebar-overlay.open {
          display: block;
        }

        .admin-content {
          flex: 1;
          padding: var(--space-6);
        }

        @media (max-width: 640px) {
          .admin-content {
            padding: var(--space-4);
          }
        }

        #admin-hamburger {
          display: none;
        }

        @media (max-width: 1023px) {
          #admin-hamburger {
            display: flex !important;
          }
        }

        .icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: none;
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: background 150ms, color 150ms;
        }

        .icon-btn:hover {
          background: var(--color-surface-offset);
          color: var(--color-text);
        }

        .icon-btn:focus-visible,
        .nav-item:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        .nav-sep {
          height: 1px;
          margin: var(--space-2) var(--space-4);
          background: var(--color-divider);
        }
      `}</style>

      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}
        aria-label="Menu administratora"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-5) var(--space-5) var(--space-4)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: "var(--radius-md)",
              background: "var(--color-accent-subtle)",
              color: "var(--color-accent)",
            }}
          >
            <Plane size={16} />
          </div>

          <div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-sm)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              AirShow
            </p>

            <p
              style={{
                color: "var(--color-text-faint)",
                fontSize: "var(--text-xs)",
              }}
            >
              Admin Panel
            </p>
          </div>
        </div>

        <nav
          style={{
            flex: 1,
            padding: "var(--space-3)",
            overflowY: "auto",
          }}
        >
          <p
            style={{
              marginBottom: "var(--space-1)",
              padding: "var(--space-2) var(--space-4)",
              color: "var(--color-text-faint)",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            Treść
          </p>

          {NAV.filter((item) => item.href === "/admin").map(
            ({ href, label, icon: Icon, exact }) => (
              <Link
                key={href}
                href={href}
                className={`nav-item ${isActive(href, exact) ? "active" : ""}`}
              >
                <Icon size={17} />
                {label}
              </Link>
            )
          )}

          {contentNavigation.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive(href, exact) ? "active" : ""}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}

          <div className="nav-sep" />

          <p
            style={{
              marginBottom: "var(--space-1)",
              padding: "var(--space-2) var(--space-4)",
              color: "var(--color-text-faint)",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            Relacje
          </p>

          <Link
            href="/admin/stories"
            className={`nav-item stories-link ${
              isActive("/admin/stories") ? "active" : ""
            }`}
          >
            <Play size={17} />
            Zarządzaj relacjami

            <span
              style={{
                marginLeft: "auto",
                padding: "2px 6px",
                borderRadius: 99,
                background: "var(--color-primary)",
                color: "#fff",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".06em",
                textTransform: "uppercase",
              }}
            >
              NEW
            </span>
          </Link>

          <div className="nav-sep" />

          <p
            style={{
              marginBottom: "var(--space-1)",
              padding: "var(--space-2) var(--space-4)",
              color: "var(--color-text-faint)",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            System
          </p>

          <Link
            href="/admin/settings"
            className={`nav-item ${
              isActive("/admin/settings") ? "active" : ""
            }`}
          >
            <Settings size={17} />
            Ustawienia
          </Link>
        </nav>

        <div
          style={{
            padding: "var(--space-3)",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <button className="nav-item" onClick={handleLogout}>
            <LogOut size={17} />
            Wyloguj
          </button>

          <Link
            href="/"
            className="nav-item"
            style={{ marginTop: "var(--space-1)" }}
          >
            <ChevronRight size={17} />
            Wróć na stronę
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button
            id="admin-hamburger"
            className="icon-btn"
            aria-label="Menu"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((value) => !value)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <nav
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              gap: "var(--space-2)",
            }}
            aria-label="Ścieżka administratora"
          >
            {pathname
              .split("/")
              .filter(Boolean)
              .map((segment, index, array) => (
                <span
                  key={`${segment}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                  }}
                >
                  {index > 0 && (
                    <ChevronRight
                      size={12}
                      style={{ color: "var(--color-text-faint)" }}
                      aria-hidden="true"
                    />
                  )}

                  <span
                    style={{
                      color:
                        index === array.length - 1
                          ? "var(--color-text)"
                          : "var(--color-text-faint)",
                      fontSize: "var(--text-xs)",
                      fontWeight: index === array.length - 1 ? 600 : 400,
                    }}
                  >
                    {crumbMap[segment] ?? segment}
                  </span>
                </span>
              ))}
          </nav>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-1)",
            }}
          >
            <button className="icon-btn" aria-label="Powiadomienia">
              <Bell size={16} />
            </button>

            <button
              className="icon-btn"
              aria-label="Zmień motyw"
              onClick={() => setDark((value) => !value)}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                flexShrink: 0,
                marginLeft: "var(--space-1)",
                borderRadius: "var(--radius-full)",
                background: "var(--color-accent-subtle)",
                color: "var(--color-accent)",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                userSelect: "none",
              }}
              aria-label="Administrator MGYT"
              title="Administrator MGYT"
            >
              M
            </div>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </>
  );
}