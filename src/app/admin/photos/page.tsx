"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search, Star, Trash2, Check,
  LayoutGrid, LayoutList, X, Loader2, AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

function adminHeaders(json = true) {
  const h: Record<string, string> = { "x-admin-secret": ADMIN_SECRET };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

interface Photo {
  id: string;
  showId: string;
  showName: string;
  src: string;
  alt: string;
  aircraft: string;
  featured: boolean;
  tags: string[];
  width: number;
  height: number;
}

interface Show { id: string; name: string; }

export default function AdminPhotos() {
  const [photos, setPhotos]           = useState<Photo[]>([]);
  const [shows, setShows]             = useState<Show[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [filterShow, setFilterShow]   = useState("all");
  const [filterFeat, setFilterFeat]   = useState<"all"|"featured"|"normal">("all");
  const [view, setView]               = useState<"grid"|"list">("grid");
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  // ✅ KLUCZOWA ZMIANA: pobieramy dane z Supabase przez API
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [photosRes, showsRes] = await Promise.all([
        fetch("/api/photos"),
        fetch("/api/shows?all=true", { headers: adminHeaders(false) }),
      ]);
      if (!photosRes.ok) throw new Error(`Błąd zdjęć: HTTP ${photosRes.status}`);
      if (!showsRes.ok)  throw new Error(`Błąd pokazów: HTTP ${showsRes.status}`);

      const photosData: Record<string, unknown>[] = await photosRes.json();
      const showsData:  Record<string, unknown>[] = await showsRes.json();

      const showMap = new Map(showsData.map(s => [s.id as string, s.name as string]));

      setShows(showsData.map(s => ({ id: s.id as string, name: s.name as string })));
      setPhotos(photosData.map(p => ({
        id:       p.id       as string,
        showId:   p.showId   as string,
        showName: showMap.get(p.showId as string) ?? "Nieznany pokaz",
        src:      p.src      as string,
        alt:      p.alt      as string ?? "",
        aircraft: p.aircraft as string ?? "",
        featured: Boolean(p.featured),
        tags:     (p.tags   as string[]) ?? [],
        width:    (p.width  as number)   ?? 900,
        height:   (p.height as number)   ?? 600,
      })));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => photos.filter(p => {
    const q = search.toLowerCase();
    const mQ = !q || p.alt.toLowerCase().includes(q) || p.aircraft.toLowerCase().includes(q)
             || p.showName.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q));
    const mS = filterShow === "all" || p.showId === filterShow;
    const mF = filterFeat === "all" || (filterFeat === "featured" ? p.featured : !p.featured);
    return mQ && mS && mF;
  }), [photos, search, filterShow, filterFeat]);

  // ✅ Toggle wyróżnienia — zapisuje do Supabase
  async function toggleFeatured(id: string) {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;
    const newVal = !photo.featured;
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, featured: newVal } : p)); // optymistyczny
    try {
      const res = await fetch(`/api/photos/${id}`, {
        method: "PATCH", headers: adminHeaders(),
        body: JSON.stringify({ featured: newVal }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    } catch (e) {
      setError(`Błąd zapisu: ${e}`);
      await loadData(); // cofnij przy błędzie
    }
  }

  // ✅ Usuń zdjęcie — usuwa z Supabase (trwale!)
  async function deletePhoto(id: string) {
    setPhotos(prev => prev.filter(p => p.id !== id)); // optymistyczny
    setDeleteModal(null);
    try {
      const res = await fetch(`/api/photos/${id}`, {
        method: "DELETE", headers: adminHeaders(false),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    } catch (e) {
      setError(`Błąd usuwania: ${e}`);
      await loadData();
    }
  }

  // ✅ Usuń zaznaczone — usuwa wiele z Supabase
  async function deleteSelected() {
    const ids = new Set(selected);
    setPhotos(prev => prev.filter(p => !ids.has(p.id)));
    setSelected(new Set());
    try {
      await Promise.all([...ids].map(id =>
        fetch(`/api/photos/${id}`, { method: "DELETE", headers: adminHeaders(false) })
      ));
    } catch (e) {
      setError(`Błąd usuwania: ${e}`);
      await loadData();
    }
  }

  function toggle(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  const selectStyle = (id: string) => ({
    width: 22, height: 22, borderRadius: "var(--radius-sm)",
    border: `2px solid ${selected.has(id) ? "var(--color-accent)" : "rgba(255,255,255,0.7)"}`,
    background: selected.has(id) ? "var(--color-accent)" : "rgba(0,0,0,0.3)",
    backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer", flexShrink: 0 as const,
    transition: "background 0.15s, border-color 0.15s",
  });

  if (loading) return (
    <div style={{ minHeight: "40dvh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "var(--space-4)", color: "var(--color-text-faint)" }}>
      <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
      <p style={{ fontSize: "var(--text-sm)" }}>Ładowanie zdjęć…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .photo-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(190px,100%),1fr)); gap:var(--space-4); }
        .photo-card { position:relative; border-radius:var(--radius-lg); overflow:hidden; border:2px solid transparent; background:var(--color-surface-offset); cursor:pointer; aspect-ratio:3/2; transition:border-color .2s,transform .2s,box-shadow .2s; }
        .photo-card:hover { box-shadow:var(--shadow-md); transform:translateY(-2px); }
        .photo-card.sel { border-color:var(--color-accent); }
        .card-overlay { position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.55) 0%,transparent 50%);opacity:0;transition:opacity .2s;display:flex;flex-direction:column;justify-content:flex-end;padding:var(--space-3); }
        .photo-card:hover .card-overlay { opacity:1; }
        .card-actions { position:absolute;top:var(--space-2);right:var(--space-2);display:flex;gap:var(--space-1);opacity:0;transition:opacity .2s; }
        .photo-card:hover .card-actions { opacity:1; }
        .act-btn { width:30px;height:30px;border-radius:var(--radius-md);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(6px);transition:background .15s; }
        .list-row { display:flex;align-items:center;gap:var(--space-4);padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);border:1px solid var(--color-border);background:var(--color-surface);transition:background .15s,border-color .15s; }
        .list-row:hover { background:var(--color-surface-offset); }
        .list-row.sel { border-color:var(--color-accent);background:var(--color-accent-subtle); }
        .filter-sel { padding:var(--space-2) var(--space-8) var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1.5px solid var(--color-border);background:var(--color-surface);color:var(--color-text);font-size:var(--text-sm);cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;min-height:36px; }
        .modal-bg { position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:var(--space-4); }
        .modal { background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-xl);padding:var(--space-8);max-width:360px;width:100%;box-shadow:var(--shadow-xl); }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {/* Error banner */}
      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", padding:"var(--space-3) var(--space-4)", background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.25)", borderRadius:"var(--radius-lg)", marginBottom:"var(--space-4)", fontSize:"var(--text-xs)", color:"#ef4444", fontWeight:600 }}>
          <AlertCircle size={14}/> {error}
          <button onClick={() => setError(null)} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#ef4444", display:"flex" }}><X size={13}/></button>
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"var(--space-6)", flexWrap:"wrap", gap:"var(--space-3)" }}>
        <div>
          <h1 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)", letterSpacing:"-0.03em" }}>Zdjęcia</h1>
          <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)" }}>{photos.length} łącznie · {filtered.length} widocznych</p>
        </div>
        <div style={{ display:"flex", gap:"var(--space-2)" }}>
          <button onClick={loadData} style={{ display:"flex", alignItems:"center", gap:"var(--space-2)", padding:"var(--space-2) var(--space-4)", borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)", background:"transparent", cursor:"pointer", color:"var(--color-text-muted)", fontSize:"var(--text-sm)", fontWeight:600 }}>Odśwież</button>
          <Link href="/admin/photos/upload" className="btn btn-primary btn-sm">+ Dodaj zdjęcia</Link>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", flexWrap:"wrap", marginBottom:"var(--space-5)" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:"absolute", left:"var(--space-3)", top:"50%", transform:"translateY(-50%)", color:"var(--color-text-faint)", pointerEvents:"none" }}/>
          <input className="input" placeholder="Szukaj zdjęć…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:"var(--space-10)", fontSize:"var(--text-sm)" }}/>
          {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:"var(--space-3)", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--color-text-faint)", display:"flex" }}><X size={13}/></button>}
        </div>
        <select className="filter-sel" value={filterShow} onChange={e => setFilterShow(e.target.value)}>
          <option value="all">Wszystkie pokazy</option>
          {shows.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="filter-sel" value={filterFeat} onChange={e => setFilterFeat(e.target.value as "all"|"featured"|"normal")}>
          <option value="all">Wszystkie</option>
          <option value="featured">Wyróżnione</option>
          <option value="normal">Zwykłe</option>
        </select>
        <div style={{ display:"flex", border:"1.5px solid var(--color-border)", borderRadius:"var(--radius-md)", overflow:"hidden" }}>
          {([["grid", LayoutGrid], ["list", LayoutList]] as const).map(([v, Icon]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding:"var(--space-2) var(--space-3)", border:"none", cursor:"pointer", background: view===v ? "var(--color-surface-offset)" : "transparent", color: view===v ? "var(--color-text)" : "var(--color-text-faint)", display:"flex", alignItems:"center" }}>
              <Icon size={15}/>
            </button>
          ))}
        </div>
      </div>

      {/* Selection bar */}
      {selected.size > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", padding:"var(--space-3) var(--space-4)", background:"var(--color-accent-subtle)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", marginBottom:"var(--space-4)", flexWrap:"wrap" }}>
          <span style={{ fontSize:"var(--text-sm)", fontWeight:600, color:"var(--color-accent)" }}>{selected.size} zaznaczonych</span>
          <button onClick={() => setSelected(new Set())} style={{ fontSize:"var(--text-xs)", background:"none", border:"none", cursor:"pointer", color:"var(--color-text-muted)" }}>Odznacz</button>
          <button onClick={() => setSelected(new Set(filtered.map(p => p.id)))} style={{ fontSize:"var(--text-xs)", background:"none", border:"none", cursor:"pointer", color:"var(--color-text-muted)" }}>Zaznacz wszystkie</button>
          <button onClick={deleteSelected} style={{ display:"flex", alignItems:"center", gap:4, padding:"var(--space-2) var(--space-3)", borderRadius:"var(--radius-md)", background:"var(--color-accent)", color:"#fff", border:"none", cursor:"pointer", fontSize:"var(--text-xs)", fontWeight:700, marginLeft:"auto" }}>
            <Trash2 size={13}/> Usuń zaznaczone
          </button>
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && (
        <div className="photo-grid">
          {filtered.map(photo => (
            <div key={photo.id} className={`photo-card ${selected.has(photo.id) ? "sel" : ""}`} onClick={() => toggle(photo.id)}>
              <Image src={photo.src} alt={photo.alt} fill style={{ objectFit:"cover" }} sizes="190px" loading="lazy"/>
              <div style={{ position:"absolute", top:"var(--space-2)", left:"var(--space-2)", ...selectStyle(photo.id) }} onClick={e => { e.stopPropagation(); toggle(photo.id); }}>
                {selected.has(photo.id) && <Check size={12} color="#fff"/>}
              </div>
              {photo.featured && (
                <div style={{ position:"absolute", top:"var(--space-2)", left:"var(--space-8)", background:"var(--color-gold)", color:"#fff", fontSize:"10px", fontWeight:700, padding:"2px 6px", borderRadius:"var(--radius-full)", display:"flex", alignItems:"center", gap:3 }}>
                  <Star size={9} fill="#fff"/> Featured
                </div>
              )}
              <div className="card-overlay" onClick={e => e.stopPropagation()}>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.85)", lineHeight:1.3 }}>{photo.showName}</p>
              </div>
              <div className="card-actions" onClick={e => e.stopPropagation()}>
                <button className="act-btn" onClick={() => toggleFeatured(photo.id)} title={photo.featured ? "Usuń wyróżnienie" : "Wyróżnij"} style={{ background: photo.featured ? "rgba(212,169,22,.9)" : "rgba(0,0,0,.55)", color: photo.featured ? "#fff" : "rgba(255,255,255,.8)" }}>
                  <Star size={13} fill={photo.featured ? "currentColor" : "none"}/>
                </button>
                <button className="act-btn" onClick={() => setDeleteModal(photo.id)} style={{ background:"rgba(204,31,31,.85)", color:"#fff" }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-2)" }}>
          {filtered.map(photo => (
            <div key={photo.id} className={`list-row ${selected.has(photo.id) ? "sel" : ""}`}>
              <div style={selectStyle(photo.id)} onClick={() => toggle(photo.id)}>
                {selected.has(photo.id) && <Check size={12} color="#fff"/>}
              </div>
              <div style={{ width:56, height:40, borderRadius:"var(--radius-md)", overflow:"hidden", flexShrink:0, position:"relative", background:"var(--color-surface-offset)" }}>
                <Image src={photo.src} alt={photo.alt} fill style={{ objectFit:"cover" }} sizes="56px" loading="lazy"/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:"var(--text-sm)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{photo.aircraft || photo.alt}</p>
                <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>{photo.showName}</p>
              </div>
              <div style={{ display:"flex", gap:"var(--space-1)", flexShrink:0 }}>
                {photo.tags.slice(0,2).map(t => <span key={t} className="badge badge--neutral" style={{ fontSize:10 }}>{t}</span>)}
              </div>
              <div style={{ display:"flex", gap:"var(--space-2)", flexShrink:0 }}>
                <button className="btn btn-icon btn-sm btn-subtle" onClick={() => toggleFeatured(photo.id)} style={{ color: photo.featured ? "var(--color-gold)" : "inherit" }}>
                  <Star size={14} fill={photo.featured ? "currentColor" : "none"}/>
                </button>
                <button className="btn btn-icon btn-sm btn-subtle" onClick={() => setDeleteModal(photo.id)} style={{ color:"var(--color-accent)" }}>
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && !loading && (
        <div style={{ textAlign:"center", padding:"var(--space-20) var(--space-8)", color:"var(--color-text-muted)" }}>
          <Search size={36} style={{ margin:"0 auto var(--space-4)", color:"var(--color-text-faint)" }}/>
          <p style={{ fontWeight:600, fontSize:"var(--text-sm)" }}>Brak wyników</p>
          <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginTop:"var(--space-2)" }}>Zmień filtry lub dodaj pierwsze zdjęcia.</p>
          <button onClick={() => { setSearch(""); setFilterShow("all"); setFilterFeat("all"); }} style={{ marginTop:"var(--space-4)", padding:"var(--space-2) var(--space-4)", borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)", background:"transparent", cursor:"pointer", fontSize:"var(--text-sm)" }}>Wyczyść filtry</button>
        </div>
      )}

      {/* Delete modal */}
      {deleteModal && (
        <div className="modal-bg" onClick={() => setDeleteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ width:44, height:44, borderRadius:"var(--radius-xl)", background:"rgba(239,68,68,.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"var(--space-4)", color:"#ef4444" }}>
              <Trash2 size={20}/>
            </div>
            <h2 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-lg)", marginBottom:"var(--space-2)" }}>Usuń zdjęcie?</h2>
            <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)", marginBottom:"var(--space-6)" }}>Ta operacja jest nieodwracalna i usunie zdjęcie z bazy danych Supabase.</p>
            <div style={{ display:"flex", gap:"var(--space-3)" }}>
              <button onClick={() => setDeleteModal(null)} style={{ flex:1, padding:"var(--space-3)", borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)", background:"transparent", cursor:"pointer", fontSize:"var(--text-sm)", fontWeight:600 }}>Anuluj</button>
              <button onClick={() => deletePhoto(deleteModal)} style={{ flex:1, padding:"var(--space-3)", borderRadius:"var(--radius-md)", background:"#ef4444", color:"#fff", border:"none", cursor:"pointer", fontSize:"var(--text-sm)", fontWeight:700 }}>Usuń</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}