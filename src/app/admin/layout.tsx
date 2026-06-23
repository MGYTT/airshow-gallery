"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Images, Upload, Clapperboard,
  Settings, LogOut, Menu, X, ChevronRight,
  Plane, Bell, Sun, Moon, Play,
} from "lucide-react";

const NAV = [
  { href: "/admin",               label: "Dashboard",     icon: LayoutDashboard, exact: true },
  { href: "/admin/photos",        label: "Zdjęcia",       icon: Images },
  { href: "/admin/photos/upload", label: "Dodaj zdjęcia", icon: Upload },
  { href: "/admin/shows",         label: "Pokazy",        icon: Clapperboard },
  { href: "/admin/stories",       label: "Relacje",       icon: Play },
  { href: "/admin/settings",      label: "Ustawienia",    icon: Settings },
];

const crumbMap: Record<string, string> = {
  admin: "Admin", photos: "Zdjęcia", upload: "Upload",
  shows: "Pokazy", settings: "Ustawienia", stories: "Relacje",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname                      = usePathname();
  const router                        = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark]               = useState(false);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark, mounted]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  if (!mounted) return null;

  return (
    <>
      <style>{`
        .admin-sidebar{position:fixed;top:0;left:0;bottom:0;width:240px;background:var(--color-surface);border-right:1px solid var(--color-border);display:flex;flex-direction:column;z-index:200;transition:transform .3s cubic-bezier(.16,1,.3,1)}
        @media(max-width:1023px){.admin-sidebar{transform:translateX(-100%);box-shadow:var(--shadow-xl)}.admin-sidebar.open{transform:translateX(0)}}
        .admin-main{margin-left:240px;min-height:100dvh;display:flex;flex-direction:column;background:var(--color-bg)}
        @media(max-width:1023px){.admin-main{margin-left:0}}

        .nav-item{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);font-size:var(--text-sm);font-weight:500;color:var(--color-text-muted);text-decoration:none;transition:background 180ms,color 180ms;position:relative;min-height:44px;cursor:pointer;border:none;background:none;width:100%;text-align:left;font-family:inherit}
        .nav-item:hover{background:var(--color-surface-offset);color:var(--color-text)}
        .nav-item.active{background:var(--color-accent-subtle);color:var(--color-accent);font-weight:600}
        .nav-item.active::before{content:"";position:absolute;left:0;top:25%;bottom:25%;width:3px;border-radius:var(--radius-full);background:var(--color-accent)}

        /* Relacje — teal zamiast accent (czerwony) */
        .nav-item.stories-link:hover{background:oklch(from var(--color-primary) l c h / .08);color:var(--color-primary)}
        .nav-item.stories-link.active{background:oklch(from var(--color-primary) l c h / .1);color:var(--color-primary)}
        .nav-item.stories-link.active::before{background:var(--color-primary)}

        .admin-header{height:56px;border-bottom:1px solid var(--color-border);background:var(--color-surface);display:flex;align-items:center;padding:0 var(--space-6);gap:var(--space-4);position:sticky;top:0;z-index:10}
        .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(2px);z-index:190}
        .sidebar-overlay.open{display:block}
        .admin-content{flex:1;padding:var(--space-6)}
        @media(max-width:640px){.admin-content{padding:var(--space-4)}}
        #admin-hamburger{display:none}
        @media(max-width:1023px){#admin-hamburger{display:flex !important}}
        .icon-btn{width:34px;height:34px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;background:transparent;color:var(--color-text-muted);transition:background 150ms,color 150ms}
        .icon-btn:hover{background:var(--color-surface-offset);color:var(--color-text)}

        /* Separator między sekcjami w nav */
        .nav-sep{height:1px;background:var(--color-divider);margin:var(--space-2) var(--space-4)}
      `}</style>

      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div style={{ padding:"var(--space-5) var(--space-5) var(--space-4)", borderBottom:"1px solid var(--color-border)", display:"flex", alignItems:"center", gap:"var(--space-3)" }}>
          <div style={{ width:32, height:32, borderRadius:"var(--radius-md)", background:"var(--color-accent-subtle)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-accent)", flexShrink:0 }}>
            <Plane size={16}/>
          </div>
          <div>
            <p style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-sm)", letterSpacing:"-0.02em", lineHeight:1.2 }}>AirShow</p>
            <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>Admin Panel</p>
          </div>
        </div>

        {/* Nawigacja */}
        <nav style={{ flex:1, padding:"var(--space-3)", overflowY:"auto" }}>

          {/* Sekcja: Treść */}
          <p style={{ fontSize:"var(--text-xs)", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color:"var(--color-text-faint)", padding:"var(--space-2) var(--space-4)", marginBottom:"var(--space-1)" }}>
            Treść
          </p>

          {NAV.filter(n => !["stories", "settings"].includes(n.href.split("/")[2] ?? "")).map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive(href, exact) ? "active" : ""}`}
            >
              <Icon size={17}/>
              {label}
            </Link>
          ))}

          {/* Separator */}
          <div className="nav-sep"/>

          {/* Sekcja: Relacje */}
          <p style={{ fontSize:"var(--text-xs)", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color:"var(--color-text-faint)", padding:"var(--space-2) var(--space-4)", marginBottom:"var(--space-1)" }}>
            Relacje
          </p>

          <Link
            href="/admin/stories"
            className={`nav-item stories-link ${isActive("/admin/stories") ? "active" : ""}`}
          >
            <Play size={17}/>
            Zarządzaj relacjami
            {/* Badge "nowe" */}
            <span style={{ marginLeft:"auto", fontSize:9, fontWeight:800, letterSpacing:".06em", textTransform:"uppercase", background:"var(--color-primary)", color:"#fff", padding:"2px 6px", borderRadius:99 }}>
              NEW
            </span>
          </Link>

          {/* Separator */}
          <div className="nav-sep"/>

          {/* Sekcja: System */}
          <p style={{ fontSize:"var(--text-xs)", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color:"var(--color-text-faint)", padding:"var(--space-2) var(--space-4)", marginBottom:"var(--space-1)" }}>
            System
          </p>

          <Link
            href="/admin/settings"
            className={`nav-item ${isActive("/admin/settings") ? "active" : ""}`}
          >
            <Settings size={17}/>
            Ustawienia
          </Link>
        </nav>

        {/* Footer sidebara */}
        <div style={{ padding:"var(--space-3)", borderTop:"1px solid var(--color-border)" }}>
          <button className="nav-item" onClick={handleLogout}>
            <LogOut size={17}/> Wyloguj
          </button>
          <Link href="/" className="nav-item" style={{ marginTop:"var(--space-1)" }}>
            <ChevronRight size={17}/> Wróć na stronę
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button id="admin-hamburger" className="icon-btn" aria-label="Menu" onClick={() => setSidebarOpen(v => !v)}>
            {sidebarOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>

          <nav style={{ flex:1, display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
            {pathname.split("/").filter(Boolean).map((seg, i, arr) => (
              <span key={i} style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                {i > 0 && <ChevronRight size={12} style={{ color:"var(--color-text-faint)" }}/>}
                <span style={{ fontSize:"var(--text-xs)", fontWeight: i === arr.length - 1 ? 600 : 400, color: i === arr.length - 1 ? "var(--color-text)" : "var(--color-text-faint)" }}>
                  {crumbMap[seg] ?? seg}
                </span>
              </span>
            ))}
          </nav>

          <div style={{ display:"flex", alignItems:"center", gap:"var(--space-1)" }}>
            <button className="icon-btn" aria-label="Powiadomienia"><Bell size={16}/></button>
            <button className="icon-btn" aria-label="Motyw" onClick={() => setDark(d => !d)}>
              {dark ? <Sun size={16}/> : <Moon size={16}/>}
            </button>
            <div style={{ width:32, height:32, borderRadius:"var(--radius-full)", background:"var(--color-accent-subtle)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"var(--text-xs)", fontWeight:700, color:"var(--color-accent)", flexShrink:0, userSelect:"none", marginLeft:"var(--space-1)" }}>
              M
            </div>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </>
  );
}