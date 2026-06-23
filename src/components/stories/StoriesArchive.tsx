"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Images, MapPin, Calendar, Filter, Search, X } from "lucide-react";
import StoryPlayer from "./StoryPlayer";
import { mapStory } from "@/lib/supabase/types";
import type { DbStory, MappedStory } from "@/lib/supabase/types";

interface ShowFilter { id: string; name: string; year: number; }

export default function StoriesArchive() {
  const [stories,  setStories]  = useState<MappedStory[]>([]);
  const [filtered, setFiltered] = useState<MappedStory[]>([]);
  const [shows,    setShows]    = useState<ShowFilter[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [openIdx,  setOpenIdx]  = useState<number | null>(null);
  const [query,    setQuery]    = useState("");
  const [showId,   setShowId]   = useState("all");
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/stories");
    if (res.ok) {
      const raw: DbStory[] = await res.json();
      const data = raw.map(mapStory);   // ← kluczowe mapowanie
      setStories(data);
      setFiltered(data);

      const map = new Map<string, ShowFilter>();
      data.forEach(s => {
        if (!map.has(s.showId)) {
          map.set(s.showId, { id: s.showId, name: s.showId, year: 0 });
        }
      });

      const BASE    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const sr = await fetch(
        `${BASE}/rest/v1/air_shows?published=eq.true&select=id,name,year&order=year.desc`,
        { headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` } }
      );
      if (sr.ok) {
        const showData: ShowFilter[] = await sr.json();
        setShows(showData.filter(s => map.has(s.id)));
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    let out = stories;
    if (showId !== "all") out = out.filter(s => s.showId === showId);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(s =>
        s.title.toLowerCase().includes(q) ||
        (s.subtitle ?? "").toLowerCase().includes(q)
      );
    }
    setFiltered(out);
  }, [query, showId, stories]);

  function openStory(globalIdx: number) {
    const story   = filtered[globalIdx];
    const realIdx = stories.findIndex(s => s.id === story.id);
    setOpenIdx(realIdx);
  }

  const showName = (id: string) => shows.find(s => s.id === id)?.name ?? "";

  return (
    <>
      <style>{`
        .sa-page{min-height:100dvh;padding-top:80px}
        .sa-hero{padding:clamp(var(--space-12),6vw,var(--space-20)) 0 var(--space-10);text-align:center;position:relative;overflow:hidden}
        .sa-hero-bg{position:absolute;inset:0;background:linear-gradient(135deg,var(--color-surface) 0%,var(--color-bg) 100%);z-index:0}
        .sa-hero-deco{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:900;font-size:clamp(8rem,22vw,20rem);color:var(--color-text);opacity:.025;user-select:none;pointer-events:none;letter-spacing:-0.06em;z-index:0}
        .sa-hero-content{position:relative;z-index:1}
        .sa-toolbar{display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center;padding:0 0 var(--space-8);max-width:var(--content-wide);margin:0 auto}
        .sa-search{position:relative;flex:1;min-width:200px}
        .sa-search input{width:100%;padding:var(--space-3) var(--space-4) var(--space-3) var(--space-10);border-radius:var(--radius-full);border:1px solid var(--color-border);background:var(--color-surface);font-size:var(--text-sm);color:var(--color-text);transition:border-color .15s,box-shadow .15s}
        .sa-search input:focus{outline:none;border-color:var(--color-primary);box-shadow:0 0 0 3px oklch(from var(--color-primary) l c h / .12)}
        .sa-search-icon{position:absolute;left:var(--space-3);top:50%;transform:translateY(-50%);color:var(--color-text-faint);pointer-events:none}
        .sa-search-clear{position:absolute;right:var(--space-3);top:50%;transform:translateY(-50%);background:none;border:none;color:var(--color-text-faint);cursor:pointer;padding:2px;border-radius:50%;display:flex;transition:color .15s}
        .sa-search-clear:hover{color:var(--color-text)}
        .sa-select{padding:var(--space-2) var(--space-4);border-radius:var(--radius-full);border:1px solid var(--color-border);background:var(--color-surface);font-size:var(--text-sm);color:var(--color-text);cursor:pointer;appearance:none;padding-right:var(--space-8);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}
        .sa-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:var(--space-6);max-width:var(--content-wide);margin:0 auto}
        @media(min-width:900px){.sa-grid{grid-template-columns:repeat(3,1fr)}}
        @media(min-width:1200px){.sa-grid{grid-template-columns:repeat(4,1fr)}}
        .sa-card{position:relative;border-radius:var(--radius-xl);overflow:hidden;cursor:pointer;background:var(--color-surface);border:1px solid var(--color-border);transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s;aspect-ratio:9/14}
        .sa-card:hover{transform:translateY(-4px) scale(1.01);box-shadow:var(--shadow-lg)}
        .sa-card:focus-visible{outline:2px solid var(--color-primary);outline-offset:3px}
        .sa-card-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.16,1,.3,1)}
        .sa-card:hover .sa-card-img{transform:scale(1.06)}
        .sa-card-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.05) 0%,transparent 30%,transparent 45%,rgba(0,0,0,.85) 100%)}
        .sa-card-body{position:absolute;bottom:0;left:0;right:0;padding:var(--space-5) var(--space-4)}
        .sa-card-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(.85);width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.15);backdrop-filter:blur(8px);border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s,transform .2s}
        .sa-card:hover .sa-card-play{opacity:1;transform:translate(-50%,-50%) scale(1)}
        .sa-card-ring{position:absolute;top:var(--space-3);left:var(--space-3);width:44px;height:44px;border-radius:50%;padding:2px;background:conic-gradient(from 0deg,var(--accent,#01696f),#f97316,var(--accent,#01696f));flex-shrink:0}
        .sa-card-ring-inner{width:100%;height:100%;border-radius:50%;border:2px solid rgba(0,0,0,.6);overflow:hidden}
        .sa-card-frames-badge{position:absolute;top:var(--space-3);right:var(--space-3);background:rgba(0,0,0,.55);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.1);border-radius:var(--radius-full);padding:3px 8px;font-size:10px;font-weight:700;color:rgba(255,255,255,.85);display:flex;align-items:center;gap:4px}
        .sa-empty{grid-column:1/-1;padding:var(--space-20);text-align:center;color:var(--color-text-faint)}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .sa-skel{background:linear-gradient(90deg,var(--color-surface-offset) 25%,var(--color-surface-dynamic) 50%,var(--color-surface-offset) 75%);background-size:200% 100%;animation:shimmer 1.5s ease-in-out infinite;border-radius:var(--radius-xl);aspect-ratio:9/14}
        .sa-stats{display:flex;gap:var(--space-6);justify-content:center;flex-wrap:wrap;padding:var(--space-6) 0;border-top:1px solid var(--color-divider);border-bottom:1px solid var(--color-divider);margin-bottom:var(--space-8);max-width:var(--content-wide);margin-inline:auto}
        .sa-stat{display:flex;flex-direction:column;align-items:center;gap:2px}
      `}</style>

      <div className="sa-page">
        <div className="sa-hero">
          <div className="sa-hero-bg"/>
          <div className="sa-hero-deco">R</div>
          <div className="sa-hero-content">
            <span style={{ display:"inline-flex", alignItems:"center", gap:"var(--space-2)", fontSize:"var(--text-xs)", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color:"var(--color-text-faint)", marginBottom:"var(--space-4)" }}>
              <Play size={11}/> Relacje fotograficzne
            </span>
            <h1 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-2xl)", letterSpacing:"-0.04em", lineHeight:1.05, marginBottom:"var(--space-4)" }}>
              Przeżyj każdy pokaz<br/>
              <span style={{ color:"var(--color-primary)" }}>od środka</span>
            </h1>
            <p style={{ fontSize:"var(--text-base)", color:"var(--color-text-muted)", maxWidth:"52ch", margin:"0 auto" }}>
              Chronologiczne opowieści z najważniejszych momentów każdego eventu — zdjęcia, fakty, statystyki.
            </p>
          </div>
        </div>

        <div className="container" style={{ paddingTop:"var(--space-8)" }}>
          {!loading && (
            <div className="sa-stats">
              {[
                { label:"Relacji",  value: stories.length },
                { label:"Pokazów",  value: shows.length },
                { label:"Klatek",   value: stories.reduce((s, r) => s + (r.frames?.length ?? 0), 0) },
              ].map(({ label, value }) => (
                <div className="sa-stat" key={label}>
                  <span style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)", letterSpacing:"-0.04em", fontVariantNumeric:"tabular-nums" }}>{value}</span>
                  <span style={{ fontSize:"var(--text-xs)", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"var(--color-text-faint)" }}>{label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="sa-toolbar">
            <div className="sa-search">
              <Search size={14} className="sa-search-icon"/>
              <input ref={inputRef} type="search" placeholder="Szukaj relacji…"
                value={query} onChange={e => setQuery(e.target.value)}/>
              {query && (
                <button className="sa-search-clear" onClick={() => { setQuery(""); inputRef.current?.focus(); }}>
                  <X size={13}/>
                </button>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
              <Filter size={13} style={{ color:"var(--color-text-faint)", flexShrink:0 }}/>
              <select className="sa-select" value={showId} onChange={e => setShowId(e.target.value)}>
                <option value="all">Wszystkie pokazy</option>
                {shows.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
              </select>
            </div>
            {(query || showId !== "all") && (
              <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", whiteSpace:"nowrap" }}>
                {filtered.length} {filtered.length === 1 ? "relacja" : filtered.length < 5 ? "relacje" : "relacji"}
              </span>
            )}
          </div>

          <div className="sa-grid">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <div key={i} className="sa-skel"/>)
            ) : filtered.length === 0 ? (
              <div className="sa-empty">
                <Play size={32} style={{ margin:"0 auto var(--space-3)", opacity:.3 }}/>
                <p style={{ fontSize:"var(--text-sm)" }}>
                  {query || showId !== "all" ? "Brak relacji spełniających kryteria." : "Brak opublikowanych relacji."}
                </p>
                {(query || showId !== "all") && (
                  <button onClick={() => { setQuery(""); setShowId("all"); }}
                    style={{ marginTop:"var(--space-4)", fontSize:"var(--text-xs)", fontWeight:600, color:"var(--color-primary)", background:"none", border:"none", cursor:"pointer" }}>
                    Wyczyść filtry
                  </button>
                )}
              </div>
            ) : filtered.map((story, i) => (
              <button key={story.id} className="sa-card" onClick={() => openStory(i)}
                aria-label={`Otwórz relację: ${story.title}`}
                style={{ "--accent": story.accentColor } as React.CSSProperties}>
                {story.coverImage
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img className="sa-card-img" src={story.coverImage} alt={story.title}/>
                  : (
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,#111 0%,#1a1a1a 100%)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:"4rem", opacity:.15 }}>✈</span>
                    </div>
                  )
                }
                <div className="sa-card-overlay"/>
                <div className="sa-card-ring">
                  <div className="sa-card-ring-inner">
                    {story.coverImage
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={story.coverImage} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                      : <div style={{ width:"100%", height:"100%", background:story.accentColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>✈</div>
                    }
                  </div>
                </div>
                <div className="sa-card-frames-badge">
                  <Images size={10}/> {story.frames?.length ?? 0}
                </div>
                <div className="sa-card-play">
                  <Play size={20} style={{ color:"#fff", marginLeft:2 }}/>
                </div>
                <div className="sa-card-body">
                  <div style={{ display:"flex", gap:2, marginBottom:"var(--space-3)" }}>
                    {(story.frames ?? []).slice(0, Math.min(story.frames?.length ?? 0, 8)).map((_, fi) => (
                      <div key={fi} style={{ flex:1, height:2, borderRadius:99, background: fi === 0 ? "#fff" : "rgba(255,255,255,.3)" }}/>
                    ))}
                    {(story.frames?.length ?? 0) > 8 && (
                      <div style={{ flex:1, height:2, borderRadius:99, background:"rgba(255,255,255,.15)" }}/>
                    )}
                  </div>
                  {showName(story.showId) && (
                    <p style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(255,255,255,.5)", marginBottom:"var(--space-1)", display:"flex", alignItems:"center", gap:4 }}>
                      <MapPin size={9}/> {showName(story.showId)}
                    </p>
                  )}
                  <p style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-base)", color:"#fff", lineHeight:1.2, marginBottom: story.subtitle ? "var(--space-1)" : 0 }}>
                    {story.title}
                  </p>
                  {story.subtitle && (
                    <p style={{ fontSize:11, color:"rgba(255,255,255,.55)", lineHeight:1.3 }}>{story.subtitle}</p>
                  )}
                  <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", marginTop:"var(--space-2)" }}>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,.4)", display:"flex", alignItems:"center", gap:3 }}>
                      <Calendar size={9}/>
                      {new Date(story.createdAt).toLocaleDateString("pl-PL", { day:"numeric", month:"short", year:"numeric" })}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {openIdx !== null && (
        <StoryPlayer
          stories={stories}
          initialIndex={openIdx}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </>
  );
}