"use client";

import { useState, useMemo, useCallback, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ShowCard from "@/components/ShowCard";
import {
  Filter, Grid, LayoutGrid, X,
  ChevronLeft, ChevronRight, ZoomIn,
  Images, Plane, MapPin, Calendar, Loader2,
  Search, SlidersHorizontal, ArrowUpDown,
} from "lucide-react";

// ── Typy ─────────────────────────────────────────────────────
interface AirShow {
  id: string; name: string; location: string; date: string;
  year: number; description: string; coverImage: string;
  photoCount: number; tags: string[]; featured: boolean; published: boolean;
}
interface Photo {
  id: string; showId: string; src: string; alt: string;
  aircraft: string; width: number; height: number;
  tags: string[]; featured: boolean;
}
type SortKey = "newest" | "oldest" | "alpha" | "photos";
type ViewMode = "grid" | "shows";

// ─────────────────────────────────────────────────────────────
// LIGHTBOX z swipe
// ─────────────────────────────────────────────────────────────
function Lightbox({ list, index, onClose, onPrev, onNext, shows }: {
  list: Photo[]; index: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
  shows: AirShow[];
}) {
  const photo     = list[index];
  const show      = shows.find(s => s.id === photo?.showId);
  const touchX    = useRef<number | null>(null);
  const touchY    = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  // Swipe touch handlers
  function handleTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null || touchY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    // Swipe tylko jeśli poziomy jest dominujący (nie scroll)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? onNext() : onPrev();
    }
    touchX.current = null;
    touchY.current = null;
  }

  if (!photo) return null;

  return (
    <>
      <style>{`
        .lb { position:fixed; inset:0; background:rgba(0,0,0,0.96); z-index:9999; display:flex; align-items:center; justify-content:center; animation:lbIn .18s ease; }
        @keyframes lbIn { from{opacity:0} to{opacity:1} }
        .lb-btn { position:fixed; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.14); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .15s; }
        .lb-btn:hover { background:rgba(255,255,255,0.18); }
        .lb-close { top:var(--space-5); right:var(--space-5); width:44px; height:44px; border-radius:var(--radius-full); }
        .lb-prev,.lb-next { top:50%; transform:translateY(-50%); width:48px; height:72px; border-radius:var(--radius-lg); }
        .lb-prev { left:var(--space-5); }
        .lb-next { right:var(--space-5); }
        .lb-prev:hover { transform:translateY(-50%) translateX(-2px); }
        .lb-next:hover { transform:translateY(-50%) translateX(2px); }
        .lb-counter { position:fixed; top:var(--space-5); left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.55); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.8); font-size:var(--text-xs); font-weight:600; padding:var(--space-2) var(--space-4); border-radius:var(--radius-full); white-space:nowrap; }
        .lb-img { display:block; max-width:min(90vw,1200px); max-height:82dvh; width:auto; height:auto; border-radius:var(--radius-xl); box-shadow:0 32px 80px rgba(0,0,0,0.6); object-fit:contain; }
        .lb-bar { position:fixed; bottom:0; left:0; right:0; padding:var(--space-4) var(--space-8); background:linear-gradient(to top,rgba(0,0,0,0.85),transparent); display:flex; align-items:flex-end; justify-content:space-between; gap:var(--space-4); flex-wrap:wrap; }
        .lb-swipe-hint { position:fixed; bottom:var(--space-16); left:50%; transform:translateX(-50%); font-size:10px; color:rgba(255,255,255,0.25); letter-spacing:.06em; text-transform:uppercase; display:none; }
        @media(hover:none){ .lb-swipe-hint { display:block; } .lb-prev,.lb-next { opacity:0.4; } }
        @media(max-width:640px){ .lb-prev { left:var(--space-2); } .lb-next { right:var(--space-2); } .lb-bar { padding:var(--space-3) var(--space-4); } }
      `}</style>

      <div
        className="lb"
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button className="lb-btn lb-close" onClick={onClose} aria-label="Zamknij"><X size={18}/></button>
        <div className="lb-counter">{index + 1} / {list.length}</div>
        <button className="lb-btn lb-prev" onClick={e => { e.stopPropagation(); onPrev(); }} aria-label="Poprzednie"><ChevronLeft size={22}/></button>

        <img
          key={photo.id}
          src={photo.src}
          alt={photo.alt}
          className="lb-img"
          onClick={e => e.stopPropagation()}
        />

        <button className="lb-btn lb-next" onClick={e => { e.stopPropagation(); onNext(); }} aria-label="Następne"><ChevronRight size={22}/></button>

        <div className="lb-swipe-hint">← przesuń →</div>

        <div className="lb-bar" onClick={e => e.stopPropagation()}>
          <div>
            <p style={{ fontSize:"var(--text-sm)", fontWeight:700, color:"#fff", marginBottom:4 }}>{photo.aircraft}</p>
            <p style={{ fontSize:"var(--text-xs)", color:"rgba(255,255,255,0.55)" }}>{photo.alt}</p>
          </div>
          {show && (
            <Link
              href={`/pokaz/${show.id}`}
              style={{ display:"inline-flex", alignItems:"center", gap:"var(--space-2)", fontSize:"var(--text-xs)", fontWeight:600, color:"rgba(255,255,255,0.8)", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", padding:"var(--space-2) var(--space-3)", borderRadius:"var(--radius-md)", textDecoration:"none", flexShrink:0, backdropFilter:"blur(6px)" }}
            >
              <Images size={12}/>{show.name}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MASONRY
// ─────────────────────────────────────────────────────────────
function PhotoMasonry({ list, onOpen }: { list: Photo[]; onOpen: (i: number) => void }) {
  if (list.length === 0) return (
    <div style={{ minHeight:"40dvh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"var(--space-4)", color:"var(--color-text-faint)", paddingBottom:"var(--space-16)" }}>
      <Plane size={40} style={{ opacity:.25 }}/>
      <p style={{ fontSize:"var(--text-sm)", fontWeight:600 }}>Brak zdjęć pasujących do filtrów</p>
    </div>
  );

  return (
    <>
      <style>{`
        .masonry { columns:4 200px; column-gap:var(--space-3); padding-bottom:var(--space-20); }
        @media(max-width:600px){ .masonry { columns:2 130px; } }
        .m-item { break-inside:avoid; margin-bottom:var(--space-3); border-radius:var(--radius-lg); overflow:hidden; cursor:zoom-in; position:relative; background:var(--color-surface-offset); }
        .m-item img { display:block; width:100%; height:auto; transition:transform .4s cubic-bezier(.16,1,.3,1); }
        .m-item:hover img { transform:scale(1.04); }
        .m-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.28); opacity:0; transition:opacity .2s; display:flex; align-items:center; justify-content:center; color:#fff; }
        .m-item:hover .m-overlay { opacity:1; }
        .m-caption { position:absolute; bottom:0; left:0; right:0; background:linear-gradient(to top,rgba(0,0,0,0.72),transparent); padding:var(--space-6) var(--space-3) var(--space-3); opacity:0; transition:opacity .2s; }
        .m-item:hover .m-caption { opacity:1; }
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
            onKeyDown={e => e.key === "Enter" && onOpen(i)}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading={i < 8 ? "eager" : "lazy"}
              style={{ aspectRatio:`${photo.width}/${photo.height}` }}
            />
            <div className="m-overlay"><ZoomIn size={26}/></div>
            <div className="m-caption">
              <p style={{ fontSize:"var(--text-xs)", fontWeight:600, color:"#fff", lineHeight:1.3 }}>{photo.aircraft}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PILL
// ─────────────────────────────────────────────────────────────
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ display:"inline-flex", alignItems:"center", padding:"var(--space-2) var(--space-4)", borderRadius:"var(--radius-full)", fontSize:"var(--text-xs)", fontWeight:600, cursor:"pointer", border:"1.5px solid", whiteSpace:"nowrap", transition:"all var(--transition)", background:active?"var(--color-accent)":"var(--color-surface)", color:active?"#fff":"var(--color-text-muted)", borderColor:active?"var(--color-accent)":"var(--color-border)" }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// GALLERY CONTENT
// ─────────────────────────────────────────────────────────────
function GalleryContent() {
  const searchParams = useSearchParams();
  const initialShow  = searchParams.get("show") ?? "all";

  const [shows, setShows]     = useState<AirShow[]>([]);
  const [photos, setPhotos]   = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtry
  const [activeShow, setActiveShow]   = useState<string>(initialShow);
  const [view, setView]               = useState<ViewMode>("grid");
  const [lbIndex, setLbIndex]         = useState<number | null>(null);
  const [search, setSearch]           = useState("");
  const [filterYear, setFilterYear]   = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterTag, setFilterTag]     = useState<string>("all");
  const [sort, setSort]               = useState<SortKey>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [showsRes, photosRes] = await Promise.all([
          fetch("/api/shows"),
          fetch("/api/photos"),
        ]);
        const showsData:  Record<string, unknown>[] = showsRes.ok  ? await showsRes.json()  : [];
        const photosData: Record<string, unknown>[] = photosRes.ok ? await photosRes.json() : [];

        setShows(showsData.map(s => ({
          id:          s.id          as string,
          name:        s.name        as string,
          location:    s.location    as string,
          date:        s.date        as string,
          year:        s.year        as number,
          description: (s.description as string) ?? "",
          coverImage:  (s.coverImage  as string) ?? "",
          photoCount:  (s.photoCount  as number) ?? 0,
          tags:        (s.tags        as string[]) ?? [],
          featured:    Boolean(s.featured),
          published:   Boolean(s.published),
        })));
        setPhotos(photosData.map(p => ({
          id:       p.id       as string,
          showId:   p.showId   as string,
          src:      p.src      as string,
          alt:      (p.alt      as string) ?? "",
          aircraft: (p.aircraft as string) ?? "",
          width:    (p.width    as number) ?? 1200,
          height:   (p.height   as number) ?? 800,
          tags:     (p.tags     as string[]) ?? [],
          featured: Boolean(p.featured),
        })));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Opcje filtrów z danych ───────────────────────────────
  const years = useMemo(() =>
    [...new Set(shows.map(s => s.year))].sort((a, b) => b - a),
    [shows]
  );
  const countries = useMemo(() =>
    [...new Set(shows.map(s => {
      const parts = s.location.split(",");
      return parts[parts.length - 1].trim();
    }))].sort(),
    [shows]
  );
  const allTags = useMemo(() =>
    [...new Set(photos.flatMap(p => p.tags).filter(Boolean))].sort(),
    [photos]
  );

  // ── Sortowane pokazy (dla widoku "shows") ────────────────
  const sortedShows = useMemo(() => {
    const q = search.toLowerCase();
    let list = [...shows];

    if (q) list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    );
    if (filterYear !== "all")    list = list.filter(s => s.year === Number(filterYear));
    if (filterCountry !== "all") list = list.filter(s => s.location.split(",").pop()?.trim() === filterCountry);
    if (filterTag !== "all")     list = list.filter(s => s.tags.includes(filterTag));

    switch (sort) {
      case "newest":  return list.sort((a, b) => b.year - a.year);
      case "oldest":  return list.sort((a, b) => a.year - b.year);
      case "alpha":   return list.sort((a, b) => a.name.localeCompare(b.name, "pl"));
      case "photos":  return list.sort((a, b) => b.photoCount - a.photoCount);
    }
  }, [shows, search, filterYear, filterCountry, filterTag, sort]);

  // ── Filtrowane zdjęcia (dla widoku "grid") ───────────────
  const filteredPhotos = useMemo<Photo[]>(() => {
    const q = search.toLowerCase();
    let list = [...photos];

    // Filtr pokazu (pill)
    if (activeShow !== "all") list = list.filter(p => p.showId === activeShow);

    // Wyszukiwarka
    if (q) list = list.filter(p =>
      p.aircraft.toLowerCase().includes(q) ||
      p.alt.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );

    // Filtry dodatkowe — działają przez powiązany pokaz
    if (filterYear !== "all" || filterCountry !== "all" || filterTag !== "all") {
      const validShowIds = new Set(
        shows.filter(s => {
          const country = s.location.split(",").pop()?.trim() ?? "";
          const byYear    = filterYear    === "all" || s.year === Number(filterYear);
          const byCountry = filterCountry === "all" || country === filterCountry;
          const byTag     = filterTag     === "all" || s.tags.includes(filterTag);
          return byYear && byCountry && byTag;
        }).map(s => s.id)
      );
      list = list.filter(p => validShowIds.has(p.showId));
    }

    // Filtr tagu zdjęcia
    if (filterTag !== "all") {
      list = list.filter(p => p.tags.includes(filterTag));
    }

    return list;
  }, [photos, activeShow, search, filterYear, filterCountry, filterTag, shows]);

  const total = filteredPhotos.length;

  // Liczba aktywnych filtrów (poza "all")
  const activeFilterCount = [
    filterYear !== "all",
    filterCountry !== "all",
    filterTag !== "all",
    search.trim() !== "",
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setFilterYear("all");
    setFilterCountry("all");
    setFilterTag("all");
    setActiveShow("all");
  }

  const openLb  = useCallback((i: number) => setLbIndex(i), []);
  const closeLb = useCallback(() => setLbIndex(null), []);
  const prevLb  = useCallback(() => setLbIndex(p => p === null || total === 0 ? null : (p - 1 + total) % total), [total]);
  const nextLb  = useCallback(() => setLbIndex(p => p === null || total === 0 ? null : (p + 1) % total), [total]);

  const activeShowData = useMemo(() => shows.find(s => s.id === activeShow), [shows, activeShow]);

  if (loading) return (
    <div style={{ minHeight:"60dvh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"var(--space-4)", color:"var(--color-text-faint)" }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      <Loader2 size={32} style={{ animation:"spin 1s linear infinite" }}/>
      <p style={{ fontSize:"var(--text-sm)" }}>Ładowanie galerii…</p>
    </div>
  );

  return (
    <>
      <style>{`
        .g-header { border-bottom:1px solid var(--color-divider); padding:var(--space-12) 0 var(--space-8); background:var(--color-surface); position:relative; overflow:hidden; }
        .g-ghost { position:absolute; right:-1%; top:50%; transform:translateY(-50%); font-family:var(--font-display); font-weight:900; font-size:clamp(6rem,18vw,16rem); line-height:1; letter-spacing:-0.06em; color:var(--color-text); opacity:0.03; user-select:none; pointer-events:none; }
        .g-filterbar { position:sticky; top:63px; z-index:50; background:var(--color-bg); border-bottom:1px solid var(--color-divider); }
        .g-filterbar-main { padding:var(--space-3) 0; }
        .g-pills { display:flex; gap:var(--space-2); flex-wrap:nowrap; overflow-x:auto; flex:1; min-width:0; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
        .g-pills::-webkit-scrollbar { display:none; }
        .g-view-toggle { display:flex; flex-shrink:0; border:1.5px solid var(--color-border); border-radius:var(--radius-md); overflow:hidden; }
        .g-view-btn { padding:var(--space-2) var(--space-3); display:flex; align-items:center; gap:var(--space-2); font-size:var(--text-xs); font-weight:600; cursor:pointer; border:none; transition:background var(--transition),color var(--transition); }
        .g-meta-chip { display:inline-flex; align-items:center; gap:var(--space-2); font-size:var(--text-xs); color:var(--color-text-faint); }
        .g-filter-panel { border-top:1px solid var(--color-divider); padding:var(--space-4) 0; display:flex; flex-wrap:wrap; gap:var(--space-3); align-items:center; }
        .g-select { padding:var(--space-2) var(--space-8) var(--space-2) var(--space-3); border-radius:var(--radius-md); border:1.5px solid var(--color-border); background:var(--color-surface); color:var(--color-text); font-size:var(--text-xs); font-weight:600; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 8px center; min-height:34px; }
        .g-search-wrap { position:relative; flex:1; min-width:180px; max-width:320px; }
        .g-search-wrap input { padding-left:var(--space-9); font-size:var(--text-xs); min-height:34px; }
        .g-active-badge { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:var(--radius-full); background:var(--color-accent); color:#fff; font-size:10px; font-weight:800; margin-left:var(--space-1); }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div className="g-header">
        <div aria-hidden className="g-ghost">FOTO</div>
        <div className="container" style={{ position:"relative", zIndex:1 }}>
          <span className="badge" style={{ marginBottom:"var(--space-4)" }}>
            <Filter size={11}/> Galeria
          </span>
          <h1 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-3xl)", letterSpacing:"-0.04em", lineHeight:1.05, marginBottom:"var(--space-3)" }}>
            {activeShow === "all"
              ? <><span style={{ color:"var(--color-accent)" }}>Wszystkie</span> zdjęcia</>
              : (activeShowData?.name ?? "Galeria")}
          </h1>
          <div style={{ display:"flex", gap:"var(--space-5)", flexWrap:"wrap" }}>
            <span className="g-meta-chip">
              <Images size={13}/>
              <strong style={{ color:"var(--color-text)", fontVariantNumeric:"tabular-nums" }}>{total}</strong> zdjęć
            </span>
            {activeShow === "all"
              ? <span className="g-meta-chip"><Plane size={13}/><strong style={{ color:"var(--color-text)" }}>{shows.length}</strong> pokazów</span>
              : activeShowData && <>
                  <span className="g-meta-chip"><MapPin size={13}/>{activeShowData.location}</span>
                  <span className="g-meta-chip"><Calendar size={13}/>{activeShowData.date || activeShowData.year}</span>
                </>
            }
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} style={{ display:"inline-flex", alignItems:"center", gap:"var(--space-1)", fontSize:"var(--text-xs)", fontWeight:600, color:"var(--color-accent)", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                <X size={11}/> Wyczyść filtry ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="g-filterbar">
        <div className="container">
          {/* Wiersz 1: pills + widok */}
          <div className="g-filterbar-main">
            <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)" }}>
              <div className="g-pills">
                <Pill active={activeShow === "all"} onClick={() => setActiveShow("all")}>
                  Wszystkie ({photos.length})
                </Pill>
                {shows.map(show => {
                  const cnt = photos.filter(p => p.showId === show.id).length;
                  return (
                    <Pill key={show.id} active={activeShow === show.id} onClick={() => setActiveShow(show.id)}>
                      {show.name}
                      <span style={{ marginLeft:4, opacity:.6, fontWeight:500, fontSize:10 }}>({cnt})</span>
                    </Pill>
                  );
                })}
              </div>

              {/* Przycisk filtrów */}
              <button
                onClick={() => setFiltersOpen(v => !v)}
                style={{ display:"flex", alignItems:"center", gap:"var(--space-2)", flexShrink:0, padding:"var(--space-2) var(--space-3)", borderRadius:"var(--radius-md)", border:`1.5px solid ${filtersOpen ? "var(--color-accent)" : "var(--color-border)"}`, background:filtersOpen ? "var(--color-accent-subtle)" : "var(--color-surface)", color:filtersOpen ? "var(--color-accent)" : "var(--color-text-muted)", fontSize:"var(--text-xs)", fontWeight:600, cursor:"pointer", transition:"all .15s", whiteSpace:"nowrap" }}
              >
                <SlidersHorizontal size={13}/>
                Filtry
                {activeFilterCount > 0 && <span className="g-active-badge">{activeFilterCount}</span>}
              </button>

              {/* Widok */}
              <div className="g-view-toggle">
                {(["grid","shows"] as const).map(v => (
                  <button
                    key={v}
                    className="g-view-btn"
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    style={{ background:view === v ? "var(--color-surface-offset)" : "transparent", color:view === v ? "var(--color-text)" : "var(--color-text-faint)" }}
                  >
                    {v === "grid" ? <Grid size={14}/> : <LayoutGrid size={14}/>}
                    <span style={{ display:"none" }} className="g-view-label">{v === "grid" ? "Siatka" : "Pokazy"}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Wiersz 2: rozwijany panel filtrów */}
          {filtersOpen && (
            <div className="g-filter-panel">
              {/* Wyszukiwarka */}
              <div className="g-search-wrap">
                <Search size={13} style={{ position:"absolute", left:"var(--space-3)", top:"50%", transform:"translateY(-50%)", color:"var(--color-text-faint)", pointerEvents:"none" }}/>
                <input
                  className="input"
                  placeholder="Szukaj samolotu, opisu…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft:"var(--space-9)", fontSize:"var(--text-xs)", minHeight:34 }}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{ position:"absolute", right:"var(--space-2)", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--color-text-faint)", display:"flex" }}>
                    <X size={12}/>
                  </button>
                )}
              </div>

              {/* Rok */}
              <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                <Calendar size={13} style={{ color:"var(--color-text-faint)", flexShrink:0 }}/>
                <select className="g-select" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                  <option value="all">Wszystkie lata</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Kraj */}
              <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                <MapPin size={13} style={{ color:"var(--color-text-faint)", flexShrink:0 }}/>
                <select className="g-select" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
                  <option value="all">Wszystkie kraje</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Tag */}
              {allTags.length > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                  <Filter size={13} style={{ color:"var(--color-text-faint)", flexShrink:0 }}/>
                  <select className="g-select" value={filterTag} onChange={e => setFilterTag(e.target.value)}>
                    <option value="all">Wszystkie tagi</option>
                    {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}

              {/* Sortowanie */}
              <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)", marginLeft:"auto" }}>
                <ArrowUpDown size={13} style={{ color:"var(--color-text-faint)", flexShrink:0 }}/>
                <select className="g-select" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
                  <option value="newest">Najnowsze</option>
                  <option value="oldest">Najstarsze</option>
                  <option value="alpha">A → Z</option>
                  <option value="photos">Najwięcej zdjęć</option>
                </select>
              </div>

              {/* Wyczyść */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  style={{ display:"flex", alignItems:"center", gap:"var(--space-1)", fontSize:"var(--text-xs)", fontWeight:600, color:"var(--color-text-faint)", background:"none", border:"1.5px solid var(--color-border)", borderRadius:"var(--radius-md)", cursor:"pointer", padding:"var(--space-2) var(--space-3)", whiteSpace:"nowrap" }}
                >
                  <X size={12}/> Wyczyść
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ paddingTop:"var(--space-8)" }}>
        {view === "grid"
          ? <PhotoMasonry list={filteredPhotos} onOpen={openLb}/>
          : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(320px,100%),1fr))", gap:"var(--space-6)", paddingBottom:"var(--space-16)" }}>
              {sortedShows.map(show => <ShowCard key={show.id} show={show}/>)}
            </div>
          )
        }
      </div>

      {/* Lightbox */}
      {lbIndex !== null && total > 0 && (
        <Lightbox
          list={filteredPhotos}
          index={lbIndex}
          onClose={closeLb}
          onPrev={prevLb}
          onNext={nextLb}
          shows={shows}
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
    <div style={{ paddingTop:"64px" }}>
      <Suspense fallback={
        <div style={{ minHeight:"60dvh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"var(--space-4)", color:"var(--color-text-faint)" }}>
          <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
          <Plane size={32} style={{ opacity:.3, animation:"spin 2s linear infinite" }}/>
          <p style={{ fontSize:"var(--text-sm)" }}>Ładowanie galerii…</p>
        </div>
      }>
        <GalleryContent/>
      </Suspense>
    </div>
  );
}