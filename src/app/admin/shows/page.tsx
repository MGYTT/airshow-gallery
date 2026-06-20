"use client";

import { useState, useMemo } from "react";
import { airShows as initialShows } from "@/lib/data";
import {
  Search, Star, Trash2, Check, X, Plus,
  Eye, EyeOff, MapPin, Calendar, Images,
  ChevronDown, Pencil,
} from "lucide-react";

interface Show {
  id: string;
  name: string;
  date: string;
  year: number;
  location: string;
  country: string;
  description: string;
  coverImage: string;
  featured: boolean;
  published: boolean;
  tags: string[];
  photoCount: number;
}

const COUNTRIES = ["Polska", "Niemcy", "Francja", "Wielka Brytania", "USA", "Czechy", "Słowacja", "Inne"];

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);
}

const EMPTY_SHOW: Omit<Show, "id" | "photoCount"> = {
  name: "", date: "", year: new Date().getFullYear(),
  location: "", country: "Polska", description: "",
  coverImage: "", featured: false, published: true, tags: [],
};

export default function AdminShows() {
  const [shows, setShows] = useState<Show[]>(
  initialShows.map(s => ({
    ...s,
    featured:  s.featured ?? false,   // boolean | undefined → boolean
    published: true,
    country:   "Polska",              // AirShow nie ma country — hardcode domyślna
  }))
);
  const [search, setSearch]         = useState("");
  const [filterFeat, setFilterFeat] = useState<"all"|"featured"|"normal">("all");
  const [filterPub, setFilterPub]   = useState<"all"|"published"|"hidden">("all");
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [editShow, setEditShow]     = useState<Show | null>(null);
  const [isNew, setIsNew]           = useState(false);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [tagInput, setTagInput]     = useState("");

  // ── Filter ──────────────────────────────────────────────────
  const filtered = useMemo(() => shows.filter(s => {
    const q = search.toLowerCase();
    const mQ = !q || s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q));
    const mF = filterFeat === "all" || (filterFeat === "featured" ? s.featured : !s.featured);
    const mP = filterPub  === "all" || (filterPub  === "published" ? s.published : !s.published);
    return mQ && mF && mP;
  }), [shows, search, filterFeat, filterPub]);

  // ── Mutations ────────────────────────────────────────────────
  const update = (id: string, patch: Partial<Show>) =>
    setShows(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));

  const deleteShow = (id: string) => {
    setShows(prev => prev.filter(s => s.id !== id));
    setDeleteModal(null);
  };

  const deleteSelected = () => {
    setShows(prev => prev.filter(s => !selected.has(s.id)));
    setSelected(new Set());
  };

  const toggle = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // ── Edit / New modal ─────────────────────────────────────────
  function openNew() {
    setEditShow({ ...EMPTY_SHOW, id: "", photoCount: 0 });
    setTagInput("");
    setIsNew(true);
  }

  function openEdit(show: Show) {
    setEditShow({ ...show });
    setTagInput("");
    setIsNew(false);
  }

  function saveShow() {
    if (!editShow) return;
    if (isNew) {
      const newShow: Show = {
        ...editShow,
        id: slugify(editShow.name) || `show-${Date.now()}`,
        photoCount: 0,
      };
      setShows(prev => [newShow, ...prev]);
    } else {
      update(editShow.id, editShow);
    }
    setEditShow(null);
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || !editShow) return;
    if (!editShow.tags.includes(t)) {
      setEditShow(prev => prev ? { ...prev, tags: [...prev.tags, t] } : prev);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setEditShow(prev => prev ? { ...prev, tags: prev.tags.filter(t => t !== tag) } : prev);
  }

  const canSave = editShow && editShow.name.trim() && editShow.location.trim();

  return (
    <>
      <style>{`
        .shows-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(320px,100%), 1fr));
          gap: var(--space-4);
        }
        .show-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: box-shadow var(--transition), border-color var(--transition), transform var(--transition);
          position: relative;
        }
        .show-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .show-card.selected { border-color: var(--color-accent); }
        .show-card.unpublished { opacity: 0.6; }
        .show-cover {
          aspect-ratio: 16/7;
          background: var(--color-surface-offset);
          position: relative;
          overflow: hidden;
        }
        .show-cover img { width:100%;height:100%;object-fit:cover;display:block; }
        .cover-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 55%);
        }
        .cover-badges {
          position: absolute; top: var(--space-3); left: var(--space-3);
          display: flex; gap: var(--space-2); flex-wrap: wrap;
        }
        .cover-actions {
          position: absolute; top: var(--space-3); right: var(--space-3);
          display: flex; gap: var(--space-2);
          opacity: 0; transition: opacity .2s;
        }
        .show-card:hover .cover-actions { opacity: 1; }
        .cover-checkbox {
          position: absolute; bottom: var(--space-3); right: var(--space-3);
          width: 22px; height: 22px; border-radius: var(--radius-sm);
          border: 2px solid rgba(255,255,255,.7);
          background: rgba(0,0,0,.3);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background .15s, border-color .15s;
        }
        .cover-checkbox.checked { background: var(--color-accent); border-color: var(--color-accent); }
        .badge-pill {
          font-size: 10px; font-weight: 700;
          padding: 2px 8px; border-radius: var(--radius-full);
          display: inline-flex; align-items: center; gap: 3px;
        }
        .pill-gold { background: var(--color-gold); color: #fff; }
        .pill-red  { background: rgba(204,31,31,.85); color: #fff; }
        .pill-gray { background: rgba(0,0,0,.5); color: #fff; backdrop-filter: blur(4px); }
        .icon-btn {
          width: 30px; height: 30px; border-radius: var(--radius-md);
          border: none; display: flex; align-items: center; justify-content: center;
          cursor: pointer; backdrop-filter: blur(6px);
          transition: background .15s; font-size: 0;
        }
        .filter-sel {
          padding: var(--space-2) var(--space-8) var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          border: 1.5px solid var(--color-border-strong);
          background: var(--color-surface); color: var(--color-text);
          font-size: var(--text-sm); cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center;
          min-height: 36px;
        }
        /* Modal */
        .modal-bg {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.65); backdrop-filter: blur(4px);
          z-index: 1000; display: flex; align-items: center;
          justify-content: center; padding: var(--space-4);
        }
        .modal-sheet {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          width: 100%; max-width: 560px;
          max-height: 90dvh; overflow-y: auto;
          box-shadow: var(--shadow-xl);
          display: flex; flex-direction: column;
        }
        .modal-header {
          padding: var(--space-5) var(--space-6);
          border-bottom: 1px solid var(--color-border);
          display: flex; align-items: center;
          justify-content: space-between;
          position: sticky; top: 0;
          background: var(--color-surface);
          z-index: 2;
        }
        .modal-body   { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5); }
        .modal-footer {
          padding: var(--space-4) var(--space-6);
          border-top: 1px solid var(--color-border);
          display: flex; gap: var(--space-3);
          position: sticky; bottom: 0;
          background: var(--color-surface);
        }
        .field-label {
          display: block; font-size: var(--text-xs); font-weight: 700;
          text-transform: uppercase; letter-spacing: .08em;
          color: var(--color-text-faint); margin-bottom: var(--space-2);
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
        @media(max-width:500px){ .form-row { grid-template-columns: 1fr; } }
        .tag-chip {
          display: inline-flex; align-items: center; gap: var(--space-1);
          padding: 3px 10px; border-radius: var(--radius-full);
          font-size: 11px; font-weight: 600;
          background: var(--color-surface-offset);
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
        }
        .toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: var(--space-4); background: var(--color-surface-offset);
          border-radius: var(--radius-lg); border: 1px solid var(--color-border);
        }
        .toggle-switch {
          width: 44px; height: 24px; border-radius: var(--radius-full);
          position: relative; cursor: pointer; border: none;
          transition: background .2s;
        }
        .toggle-thumb {
          position: absolute; top: 3px; left: 3px;
          width: 18px; height: 18px; border-radius: var(--radius-full);
          background: #fff; transition: transform .2s cubic-bezier(.16,1,.3,1);
          box-shadow: 0 1px 3px rgba(0,0,0,.3);
        }
      `}</style>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"var(--space-6)", flexWrap:"wrap", gap:"var(--space-3)" }}>
        <div>
          <h1 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)", letterSpacing:"-0.03em" }}>
            Pokazy lotnicze
          </h1>
          <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)" }}>
            {shows.length} pokazów · {shows.filter(s=>s.featured).length} wyróżnione · {shows.filter(s=>!s.published).length} ukryte
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>
          <Plus size={15}/> Nowy pokaz
        </button>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", flexWrap:"wrap", marginBottom:"var(--space-5)" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:"absolute", left:"var(--space-3)", top:"50%", transform:"translateY(-50%)", color:"var(--color-text-faint)", pointerEvents:"none" }}/>
          <input className="input" placeholder="Szukaj pokazów, miejsc, tagów..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:"var(--space-10)", fontSize:"var(--text-sm)" }}/>
          {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:"var(--space-3)", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--color-text-faint)", display:"flex" }}><X size={13}/></button>}
        </div>
        <select className="filter-sel" value={filterFeat} onChange={e => setFilterFeat(e.target.value as "all"|"featured"|"normal")}>
          <option value="all">Wszystkie</option>
          <option value="featured">Wyróżnione</option>
          <option value="normal">Zwykłe</option>
        </select>
        <select className="filter-sel" value={filterPub} onChange={e => setFilterPub(e.target.value as "all"|"published"|"hidden")}>
          <option value="all">Widoczność: wszystkie</option>
          <option value="published">Opublikowane</option>
          <option value="hidden">Ukryte</option>
        </select>
      </div>

      {/* ── Selection bar ───────────────────────────────────────── */}
      {selected.size > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", padding:"var(--space-3) var(--space-4)", background:"var(--color-accent-subtle)", border:"1px solid var(--color-accent-subtle-2)", borderRadius:"var(--radius-lg)", marginBottom:"var(--space-4)", flexWrap:"wrap" }}>
          <span style={{ fontSize:"var(--text-sm)", fontWeight:600, color:"var(--color-accent)" }}>{selected.size} zaznaczonych</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setSelected(new Set())}>Odznacz</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setSelected(new Set(filtered.map(s=>s.id)))}>Zaznacz wszystkie</button>
          <button className="btn btn-sm btn-ghost" onClick={() => selected.forEach(id => update(id, { published: false }))}>
            <EyeOff size={13}/> Ukryj
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => selected.forEach(id => update(id, { published: true }))}>
            <Eye size={13}/> Pokaż
          </button>
          <button className="btn btn-sm" onClick={deleteSelected} style={{ background:"var(--color-accent)", color:"#fff", border:"none", marginLeft:"auto" }}>
            <Trash2 size={13}/> Usuń zaznaczone
          </button>
        </div>
      )}

      {/* ── Cards grid ──────────────────────────────────────────── */}
      <div className="shows-grid">
        {filtered.map(show => (
          <div key={show.id} className={`show-card ${selected.has(show.id) ? "selected":""} ${!show.published ? "unpublished":""}`}>

            {/* Cover image */}
            <div className="show-cover">
              {show.coverImage
                ? <img src={show.coverImage} alt={show.name} loading="lazy"/>
                : <div style={{ width:"100%", height:"100%", background:"var(--color-surface-dynamic)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Images size={32} style={{ color:"var(--color-text-faint)" }}/>
                  </div>
              }
              <div className="cover-overlay"/>

              {/* Badges */}
              <div className="cover-badges">
                {show.featured && (
                  <span className="badge-pill pill-gold"><Star size={9} fill="#fff"/> Featured</span>
                )}
                {!show.published && (
                  <span className="badge-pill pill-red"><EyeOff size={9}/> Ukryty</span>
                )}
              </div>

              {/* Hover actions */}
              <div className="cover-actions">
                <button
                  className="icon-btn"
                  title={show.featured ? "Usuń wyróżnienie" : "Wyróżnij"}
                  onClick={() => update(show.id, { featured: !show.featured })}
                  style={{ background: show.featured ? "rgba(212,169,22,.9)" : "rgba(0,0,0,.55)", color: show.featured ? "#fff" : "rgba(255,255,255,.8)" }}
                >
                  <Star size={13} fill={show.featured ? "currentColor":"none"}/>
                </button>
                <button
                  className="icon-btn"
                  title={show.published ? "Ukryj" : "Opublikuj"}
                  onClick={() => update(show.id, { published: !show.published })}
                  style={{ background:"rgba(0,0,0,.55)", color:"rgba(255,255,255,.85)" }}
                >
                  {show.published ? <Eye size={13}/> : <EyeOff size={13}/>}
                </button>
                <button
                  className="icon-btn"
                  title="Edytuj"
                  onClick={() => openEdit(show)}
                  style={{ background:"rgba(0,0,0,.55)", color:"rgba(255,255,255,.85)" }}
                >
                  <Pencil size={13}/>
                </button>
                <button
                  className="icon-btn"
                  title="Usuń"
                  onClick={() => setDeleteModal(show.id)}
                  style={{ background:"rgba(204,31,31,.85)", color:"#fff" }}
                >
                  <Trash2 size={13}/>
                </button>
              </div>

              {/* Checkbox */}
              <div
                className={`cover-checkbox ${selected.has(show.id) ? "checked":""}`}
                onClick={() => toggle(show.id)}
              >
                {selected.has(show.id) && <Check size={12} color="#fff"/>}
              </div>
            </div>

            {/* Card body */}
            <div style={{ padding:"var(--space-4)" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"var(--space-2)", marginBottom:"var(--space-2)" }}>
                <h3 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"var(--text-base)", letterSpacing:"-0.02em", lineHeight:1.3 }}>
                  {show.name}
                </h3>
                <button
                  className="btn btn-icon btn-sm btn-subtle"
                  onClick={() => openEdit(show)}
                  title="Edytuj pokaz"
                  style={{ flexShrink:0 }}
                >
                  <Pencil size={13}/>
                </button>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-1)", marginBottom:"var(--space-3)" }}>
                <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", display:"flex", alignItems:"center", gap:"var(--space-1)" }}>
                  <MapPin size={11}/> {show.location}{show.country ? `, ${show.country}` : ""}
                </span>
                <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", display:"flex", alignItems:"center", gap:"var(--space-1)" }}>
                  <Calendar size={11}/> {show.date || show.year}
                </span>
                <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", display:"flex", alignItems:"center", gap:"var(--space-1)" }}>
                  <Images size={11}/> {show.photoCount} zdjęć
                </span>
              </div>

              {show.description && (
                <p style={{
                  fontSize:"var(--text-xs)", color:"var(--color-text-muted)",
                  overflow:"hidden", display:"-webkit-box",
                  WebkitLineClamp:2, WebkitBoxOrient:"vertical",
                  marginBottom:"var(--space-3)",
                }}>
                  {show.description}
                </p>
              )}

              {show.tags?.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"var(--space-1)" }}>
                  {show.tags.slice(0,4).map(t => (
                    <span key={t} className="tag-chip">{t}</span>
                  ))}
                  {show.tags.length > 4 && (
                    <span className="tag-chip" style={{ color:"var(--color-text-faint)" }}>
                      +{show.tags.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty state ──────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:"var(--space-20) var(--space-8)", color:"var(--color-text-muted)" }}>
          <Search size={36} style={{ margin:"0 auto var(--space-4)", color:"var(--color-text-faint)" }}/>
          <p style={{ fontWeight:600, fontSize:"var(--text-sm)" }}>Brak wyników</p>
          <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginTop:"var(--space-2)" }}>Zmień filtry lub dodaj nowy pokaz.</p>
          <button className="btn btn-subtle btn-sm" onClick={() => { setSearch(""); setFilterFeat("all"); setFilterPub("all"); }} style={{ marginTop:"var(--space-4)" }}>
            Wyczyść filtry
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          EDIT / NEW MODAL
      ══════════════════════════════════════════════════════════ */}
      {editShow && (
        <div className="modal-bg" onClick={() => setEditShow(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="modal-header">
              <h2 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-lg)", letterSpacing:"-0.02em" }}>
                {isNew ? "Nowy pokaz" : "Edytuj pokaz"}
              </h2>
              <button className="btn btn-icon btn-subtle btn-sm" onClick={() => setEditShow(null)}>
                <X size={16}/>
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">

              {/* Name */}
              <div>
                <label className="field-label">Nazwa pokazu *</label>
                <input
                  className="input"
                  placeholder="np. Radom Air Show 2025"
                  value={editShow.name}
                  onChange={e => setEditShow(p => p ? { ...p, name: e.target.value } : p)}
                />
              </div>

              {/* Location + country */}
              <div className="form-row">
                <div>
                  <label className="field-label">Lokalizacja *</label>
                  <input
                    className="input"
                    placeholder="np. Radom"
                    value={editShow.location}
                    onChange={e => setEditShow(p => p ? { ...p, location: e.target.value } : p)}
                  />
                </div>
                <div>
                  <label className="field-label">Kraj</label>
                  <select
                    style={{ width:"100%", padding:"var(--space-2) var(--space-3)", borderRadius:"var(--radius-sm)", border:"1.5px solid var(--color-border-strong)", background:"var(--color-surface)", color:"var(--color-text)", fontSize:"var(--text-sm)" }}
                    value={editShow.country}
                    onChange={e => setEditShow(p => p ? { ...p, country: e.target.value } : p)}
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Date + year */}
              <div className="form-row">
                <div>
                  <label className="field-label">Data</label>
                  <input
                    className="input"
                    type="date"
                    value={editShow.date}
                    onChange={e => {
                      const d = e.target.value;
                      const y = d ? new Date(d).getFullYear() : editShow.year;
                      setEditShow(p => p ? { ...p, date: d, year: y } : p);
                    }}
                  />
                </div>
                <div>
                  <label className="field-label">Rok</label>
                  <input
                    className="input"
                    type="number"
                    min={1950} max={2100}
                    value={editShow.year}
                    onChange={e => setEditShow(p => p ? { ...p, year: Number(e.target.value) } : p)}
                  />
                </div>
              </div>

              {/* Cover image URL */}
              <div>
                <label className="field-label">Zdjęcie okładkowe (URL)</label>
                <input
                  className="input"
                  placeholder="https://..."
                  value={editShow.coverImage}
                  onChange={e => setEditShow(p => p ? { ...p, coverImage: e.target.value } : p)}
                />
                {editShow.coverImage && (
                  <div style={{ marginTop:"var(--space-3)", borderRadius:"var(--radius-lg)", overflow:"hidden", aspectRatio:"16/7", background:"var(--color-surface-offset)" }}>
                    <img src={editShow.coverImage} alt="Preview" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} onError={e => (e.currentTarget.style.display="none")}/>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="field-label">Opis</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Krótki opis pokazu..."
                  value={editShow.description}
                  onChange={e => setEditShow(p => p ? { ...p, description: e.target.value } : p)}
                  style={{ resize:"vertical", fontFamily:"inherit" }}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="field-label">Tagi</label>
                <div style={{ display:"flex", gap:"var(--space-2)", marginBottom:"var(--space-3)", flexWrap:"wrap" }}>
                  {editShow.tags.map(t => (
                    <span key={t} className="tag-chip">
                      {t}
                      <button onClick={() => removeTag(t)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-faint)", display:"flex", padding:0, marginLeft:2 }}>
                        <X size={10}/>
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display:"flex", gap:"var(--space-2)" }}>
                  <input
                    className="input"
                    placeholder="Dodaj tag..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    style={{ flex:1 }}
                  />
                  <button className="btn btn-subtle btn-sm" onClick={addTag} disabled={!tagInput.trim()}>
                    <Plus size={14}/>
                  </button>
                </div>
              </div>

              {/* Toggles: featured + published */}
              <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-3)" }}>
                {/* Featured */}
                <div className="toggle-row">
                  <div>
                    <p style={{ fontSize:"var(--text-sm)", fontWeight:600 }}>Wyróżniony pokaz</p>
                    <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>Pojawi się na stronie głównej</p>
                  </div>
                  <button
                    className="toggle-switch"
                    onClick={() => setEditShow(p => p ? { ...p, featured: !p.featured } : p)}
                    style={{ background: editShow.featured ? "var(--color-gold)" : "var(--color-surface-dynamic)" }}
                    role="switch"
                    aria-checked={editShow.featured}
                  >
                    <div className="toggle-thumb" style={{ transform: editShow.featured ? "translateX(20px)" : "translateX(0)" }}/>
                  </button>
                </div>

                {/* Published */}
                <div className="toggle-row">
                  <div>
                    <p style={{ fontSize:"var(--text-sm)", fontWeight:600 }}>Opublikowany</p>
                    <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>Widoczny publicznie</p>
                  </div>
                  <button
                    className="toggle-switch"
                    onClick={() => setEditShow(p => p ? { ...p, published: !p.published } : p)}
                    style={{ background: editShow.published ? "var(--color-accent)" : "var(--color-surface-dynamic)" }}
                    role="switch"
                    aria-checked={editShow.published}
                  >
                    <div className="toggle-thumb" style={{ transform: editShow.published ? "translateX(20px)" : "translateX(0)" }}/>
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setEditShow(null)}>
                Anuluj
              </button>
              <button
                className="btn btn-primary"
                style={{ flex:2, opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer":"not-allowed" }}
                onClick={saveShow}
                disabled={!canSave}
              >
                {isNew ? "Dodaj pokaz" : "Zapisz zmiany"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Delete confirm modal ────────────────────────────────── */}
      {deleteModal && (
        <div className="modal-bg" onClick={() => setDeleteModal(null)}>
          <div style={{
            background:"var(--color-surface)", border:"1px solid var(--color-border)",
            borderRadius:"var(--radius-2xl)", padding:"var(--space-8)",
            maxWidth:360, width:"100%", boxShadow:"var(--shadow-xl)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ width:44, height:44, borderRadius:"var(--radius-xl)", background:"var(--color-accent-subtle)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"var(--space-4)", color:"var(--color-accent)" }}>
              <Trash2 size={20}/>
            </div>
            <h2 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-lg)", marginBottom:"var(--space-2)" }}>
              Usuń pokaz?
            </h2>
            <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)", marginBottom:"var(--space-2)" }}>
              Pokaz <strong>„{shows.find(s=>s.id===deleteModal)?.name}"</strong> zostanie trwale usunięty.
            </p>
            <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginBottom:"var(--space-6)" }}>
              Tej operacji nie można cofnąć.
            </p>
            <div style={{ display:"flex", gap:"var(--space-3)" }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setDeleteModal(null)}>Anuluj</button>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={() => deleteShow(deleteModal)}>Usuń</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}