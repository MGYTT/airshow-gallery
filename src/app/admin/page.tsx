"use client";

import { useState, useEffect } from "react";
import {
  Images, Clapperboard, Star, TrendingUp,
  ArrowRight, Clock, Upload, Settings,
  ExternalLink, Eye, CheckCircle2, Globe,
  Plane, Camera, Loader2, Play,
} from "lucide-react";
import Link from "next/link";

interface AirShow {
  id: string; name: string; location: string; date: string;
  year: number; description: string; coverImage: string;
  photoCount: number; tags: string[]; featured: boolean; published: boolean;
}

export default function AdminDashboard() {
  const [shows, setShows]   = useState<AirShow[]>([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [showsRes, photosRes] = await Promise.all([
          fetch("/api/shows?all=true", {
            headers: { "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "" },
          }),
          fetch("/api/photos"),
        ]);
        const showsData: AirShow[] = showsRes.ok ? await showsRes.json() : [];
        const photosData: unknown[] = photosRes.ok ? await photosRes.json() : [];
        setShows(showsData);
        setPhotoCount(photosData.length);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const featuredCount  = shows.filter(s => s.featured).length;
  const avgPhotos      = Math.round(photoCount / Math.max(shows.length, 1));
  const countriesCount = [...new Set(shows.map(s => s.location.split(",").pop()?.trim()))].length;

  const STATS = [
    { label: "Wszystkich zdjęć",  value: photoCount,      icon: Images,      href: "/admin/photos", trend: "łącznie w galerii",    color: "var(--color-accent)", bg: "var(--color-accent-subtle)" },
    { label: "Pokazy lotnicze",   value: shows.length,    icon: Clapperboard,href: "/admin/shows",  trend: `${featuredCount} wyróżnione`, color: "var(--color-gold)", bg: "var(--color-gold-subtle)" },
    { label: "Śr. zdjęć / pokaz", value: avgPhotos,       icon: TrendingUp,  href: "/admin/photos", trend: "zdjęć na pokaz",       color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
    { label: "Kraje / regiony",   value: countriesCount,  icon: Globe,       href: "/admin/shows",  trend: "odwiedzone miejsca",   color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
  ];

  const QUICK_ACTIONS = [
  { href: "/admin/photos/upload", label: "Dodaj nowe zdjęcia",       desc: "Upload z dysku lub przeciągnij pliki",      icon: Upload,      accent: true,  external: false },
  { href: "/admin/shows",         label: "Zarządzaj pokazami",        desc: "Edytuj, ukryj, wyróżnij pokazy",           icon: Clapperboard,accent: false, external: false },
  { href: "/admin/stories",       label: "Zarządzaj relacjami",       desc: "Twórz i edytuj relacje fotograficzne",      icon: Play,        accent: false, external: false, stories: true },
  { href: "/admin/settings",      label: "Ustawienia strony",         desc: "Konfiguracja, motyw, dane autora",         icon: Settings,    accent: false, external: false },
  { href: "/",                    label: "Podgląd strony publicznej", desc: "Otwórz stronę w nowej karcie",            icon: ExternalLink, accent: false, external: true  },
];

  const CHECKLIST = [
    { label: "Dodaj przynajmniej 1 pokaz",   done: shows.length > 0 },
    { label: "Dodaj zdjęcia do galerii",     done: photoCount > 0 },
    { label: "Wyróżnij minimum 1 pokaz",     done: featuredCount > 0 },
    { label: "Uzupełnij opisy pokazów",      done: shows.length > 0 && shows.every(s => s.description.length > 10) },
    { label: "Zdjęcia okładkowe dla pokazów",done: shows.length > 0 && shows.every(s => !!s.coverImage) },
    { label: "Tagi przypisane do pokazów",   done: shows.length > 0 && shows.every(s => s.tags.length > 0) },
  ];

  const checklistDone = CHECKLIST.filter(c => c.done).length;
  const checklistPct  = Math.round((checklistDone / CHECKLIST.length) * 100);

  const now = new Date();
  const timeStr = now.toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"40dvh", gap:"var(--space-3)", color:"var(--color-text-faint)" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Loader2 size={22} style={{ animation:"spin 1s linear infinite" }}/>
      <span style={{ fontSize:"var(--text-sm)" }}>Ładowanie danych…</span>
    </div>
  );

  return (
    <>
      <style>{`
        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:var(--space-4); margin-bottom:var(--space-8); }
        @media(max-width:1024px){ .stats-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:480px) { .stats-grid { grid-template-columns:1fr; } }
        .stat-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-xl); padding:var(--space-5); display:flex; flex-direction:column; gap:var(--space-3); text-decoration:none; color:inherit; transition:box-shadow var(--transition),transform var(--transition),border-color var(--transition); }
        .stat-card:hover { box-shadow:var(--shadow-md); transform:translateY(-2px); border-color:var(--color-border-strong); }
        .bottom-grid { display:grid; grid-template-columns:1fr 1fr; gap:var(--space-6); margin-bottom:var(--space-6); }
        @media(max-width:900px){ .bottom-grid { grid-template-columns:1fr; } }
        .panel { background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-xl); overflow:hidden; }
        .panel-header { padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border); display:flex; align-items:center; justify-content:space-between; }
        .show-row { display:flex; align-items:center; gap:var(--space-4); padding:var(--space-3) var(--space-4); border-radius:var(--radius-lg); text-decoration:none; color:inherit; transition:background var(--transition); }
        .show-row:hover { background:var(--color-surface-offset); }
        .quick-btn { display:flex; align-items:center; gap:var(--space-4); padding:var(--space-4); border-radius:var(--radius-lg); border:1px solid var(--color-border); background:var(--color-surface-offset); text-decoration:none; color:inherit; transition:border-color var(--transition),background var(--transition),transform var(--transition); }
        .quick-btn:hover { border-color:var(--color-border-strong); background:var(--color-surface-dynamic); transform:translateX(3px); }
        .quick-btn.accent { background:var(--color-accent-subtle); border-color:var(--color-accent); }
        .quick-btn.accent:hover { background:var(--color-accent); color:#fff; }
        .quick-btn.accent:hover .qa-icon { color:#fff !important; }
        .quick-btn.accent:hover p { color:rgba(255,255,255,0.75) !important; }
        .progress-track { height:6px; background:var(--color-surface-dynamic); border-radius:var(--radius-full); overflow:hidden; }
        .progress-fill { height:100%; border-radius:var(--radius-full); background:linear-gradient(to right,var(--color-accent),#f97316); transition:width 0.6s cubic-bezier(0.16,1,0.3,1); }
        .check-item { display:flex; align-items:center; gap:var(--space-3); padding:var(--space-3) var(--space-4); border-radius:var(--radius-md); font-size:var(--text-xs); transition:background var(--transition); }
        .check-item:hover { background:var(--color-surface-offset); }
        .pub-banner { border-radius:var(--radius-xl); padding:var(--space-5) var(--space-6); display:flex; align-items:center; justify-content:space-between; gap:var(--space-4); flex-wrap:wrap; margin-bottom:var(--space-6); border:1px solid; }
        .pub-banner.ready { background:rgba(34,197,94,0.07); border-color:rgba(34,197,94,0.3); }
        .pub-banner.not-ready { background:var(--color-accent-subtle); border-color:var(--color-accent); }
        .quick-btn.stories { background: oklch(from var(--color-primary) l c h / .06); border-color: oklch(from var(--color-primary) l c h / .3); }
.quick-btn.stories:hover { background: var(--color-primary); color: #fff; border-color: transparent; }
.quick-btn.stories:hover .qa-icon { color: #fff !important; }
.quick-btn.stories:hover p { color: rgba(255,255,255,.75) !important; }
      `}</style>

      {/* Title */}
      <div style={{ marginBottom:"var(--space-8)" }}>
        <h1 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)", letterSpacing:"-0.03em", marginBottom:"var(--space-1)" }}>Dashboard</h1>
        <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)" }}>{timeStr} · Witaj z powrotem! ✈️</p>
      </div>

      {/* Baner gotowości */}
      <div className={`pub-banner ${checklistPct === 100 ? "ready" : "not-ready"}`}>
        <div style={{ display:"flex", alignItems:"center", gap:"var(--space-4)" }}>
          <div style={{ width:42, height:42, borderRadius:"var(--radius-lg)", flexShrink:0, background:checklistPct===100?"rgba(34,197,94,0.15)":"var(--color-accent-subtle)", display:"flex", alignItems:"center", justifyContent:"center", color:checklistPct===100?"#22c55e":"var(--color-accent)" }}>
            {checklistPct === 100 ? <CheckCircle2 size={22}/> : <Plane size={22}/>}
          </div>
          <div>
            <p style={{ fontSize:"var(--text-sm)", fontWeight:700, marginBottom:2 }}>
              {checklistPct === 100 ? "Strona gotowa do publikacji! 🎉" : `Gotowość do publikacji — ${checklistPct}%`}
            </p>
            <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-muted)" }}>
              {checklistDone} z {CHECKLIST.length} punktów ukończone
            </p>
          </div>
        </div>
        <Link href="/" target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:"var(--space-2)", padding:"var(--space-2) var(--space-4)", borderRadius:"var(--radius-md)", textDecoration:"none", fontSize:"var(--text-xs)", fontWeight:700, background:checklistPct===100?"#22c55e":"var(--color-accent)", color:"#fff" }}>
          <Eye size={13}/> Podgląd strony
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {STATS.map(({ label, value, icon: Icon, href, trend, color, bg }) => (
          <Link key={label} href={href} className="stat-card">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ width:38, height:38, borderRadius:"var(--radius-lg)", background:bg, display:"flex", alignItems:"center", justifyContent:"center", color, flexShrink:0 }}>
                <Icon size={18}/>
              </div>
              <ArrowRight size={14} style={{ color:"var(--color-text-faint)" }}/>
            </div>
            <div>
              <p style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-2xl)", letterSpacing:"-0.04em", lineHeight:1, color, fontVariantNumeric:"tabular-nums" }}>
                {value.toLocaleString("pl-PL")}
              </p>
              <p style={{ fontSize:"var(--text-xs)", fontWeight:600, color:"var(--color-text)", marginTop:"var(--space-1)" }}>{label}</p>
            </div>
            <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", display:"flex", alignItems:"center", gap:"var(--space-1)" }}>
              <Clock size={10}/>{trend}
            </p>
          </Link>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="bottom-grid">

        {/* Pokazy */}
        <div className="panel">
          <div className="panel-header">
            <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
              <Camera size={15} style={{ color:"var(--color-text-faint)" }}/>
              <p style={{ fontSize:"var(--text-sm)", fontWeight:700 }}>Pokazy lotnicze</p>
            </div>
            <Link href="/admin/shows" style={{ fontSize:"var(--text-xs)", color:"var(--color-accent)", textDecoration:"none", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
              Wszystkie <ArrowRight size={11}/>
            </Link>
          </div>
          <div style={{ padding:"var(--space-2)" }}>
            {shows.length === 0 ? (
              <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-faint)", padding:"var(--space-6)", textAlign:"center" }}>Brak pokazów</p>
            ) : shows.slice(0, 6).map(show => (
              <Link key={show.id} href="/admin/shows" className="show-row">
                <div style={{ width:8, height:8, borderRadius:"var(--radius-full)", flexShrink:0, background:show.featured?"var(--color-gold)":"var(--color-surface-dynamic)", boxShadow:show.featured?"0 0 6px var(--color-gold)":"none" }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:"var(--text-sm)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{show.name}</p>
                  <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>{show.location} · {show.year}</p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2, flexShrink:0 }}>
                  <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", fontVariantNumeric:"tabular-nums" }}>{show.photoCount} zdjęć</span>
                  {show.featured && <span style={{ fontSize:"9px", fontWeight:700, letterSpacing:".06em", color:"var(--color-gold)", textTransform:"uppercase" }}>★ wyróżniony</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Prawa kolumna */}
        <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-5)" }}>

          {/* Szybkie akcje */}
          <div className="panel">
            <div className="panel-header">
              <p style={{ fontSize:"var(--text-sm)", fontWeight:700 }}>Szybkie akcje</p>
            </div>
            <div style={{ padding:"var(--space-4)", display:"flex", flexDirection:"column", gap:"var(--space-2)" }}>
              {QUICK_ACTIONS.map(({ href, label, desc, icon: Icon, accent, external, stories }) => (
  <Link
    key={href}
    href={href}
    className={`quick-btn ${accent ? "accent" : ""} ${stories ? "stories" : ""}`}
    {...(external ? { target:"_blank", rel:"noopener noreferrer" } : {})}
  >
    <Icon
      size={16}
      className="qa-icon"
      style={{ color: stories ? "var(--color-primary)" : accent ? "var(--color-accent)" : "var(--color-text-faint)", flexShrink:0 }}
    />
    <div style={{ minWidth:0 }}>
      <p style={{ fontSize:"var(--text-sm)", fontWeight:600, lineHeight:1.3 }}>{label}</p>
      <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginTop:2 }}>{desc}</p>
    </div>
    <ArrowRight size={13} style={{ color:"var(--color-text-faint)", flexShrink:0, marginLeft:"auto" }}/>
  </Link>
))}
            </div>
          </div>

          {/* Checklist */}
          <div className="panel">
            <div className="panel-header" style={{ flexDirection:"column", alignItems:"flex-start", gap:"var(--space-3)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                  <CheckCircle2 size={15} style={{ color:"var(--color-text-faint)" }}/>
                  <p style={{ fontSize:"var(--text-sm)", fontWeight:700 }}>Gotowość do publikacji</p>
                </div>
                <span style={{ fontSize:"var(--text-xs)", fontWeight:700, color:checklistPct===100?"#22c55e":"var(--color-accent)", fontVariantNumeric:"tabular-nums" }}>
                  {checklistDone}/{CHECKLIST.length}
                </span>
              </div>
              <div className="progress-track" style={{ width:"100%" }}>
                <div className="progress-fill" style={{ width:`${checklistPct}%` }}/>
              </div>
            </div>
            <div style={{ padding:"var(--space-2)" }}>
              {CHECKLIST.map(({ label, done }) => (
                <div key={label} className="check-item">
                  <div style={{ width:18, height:18, borderRadius:"var(--radius-full)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:done?"rgba(34,197,94,0.12)":"var(--color-surface-offset)", border:`1.5px solid ${done?"rgba(34,197,94,0.4)":"var(--color-border)"}`, color:done?"#22c55e":"var(--color-text-faint)" }}>
                    {done && <CheckCircle2 size={11}/>}
                  </div>
                  <span style={{ textDecoration:done?"line-through":"none", opacity:done?0.55:1, fontSize:"var(--text-xs)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}