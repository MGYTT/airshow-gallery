"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Search, Star, Trash2, Check, X, Plus,
  Eye, EyeOff, MapPin, Calendar, Images,
  Pencil, Loader2, AlertCircle, Upload, Link2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────
interface Show {
  id:          string;
  name:        string;
  date:        string;
  year:        number;
  location:    string;
  country:     string;
  description: string;
  coverImage:  string;
  featured:    boolean;
  published:   boolean;
  tags:        string[];
  photoCount:  number;
}

const COUNTRIES = ["Polska","Niemcy","Francja","Wielka Brytania","USA","Czechy","Słowacja","Inne"];
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

function adminHeaders(json = true) {
  const h: Record<string, string> = { "x-admin-secret": ADMIN_SECRET };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

function slugify(name: string) {
  return name.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e")
    .replace(/ł/g,"l").replace(/ń/g,"n").replace(/ó/g,"o")
    .replace(/ś/g,"s").replace(/ź|ż/g,"z")
    .replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"").slice(0,40);
}

const EMPTY: Omit<Show,"id"|"photoCount"> = {
  name:"", date:"", year: new Date().getFullYear(),
  location:"", country:"Polska", description:"",
  coverImage:"", featured:false, published:true, tags:[],
};

function parseCountry(location: string): { loc: string; country: string } {
  const parts = location.split(",").map(s => s.trim());
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const known = COUNTRIES.includes(last);
    return {
      loc:     known ? parts.slice(0, -1).join(", ") : location,
      country: known ? last : "Polska",
    };
  }
  return { loc: location, country: "Polska" };
}

function mapApiShow(s: Record<string, unknown>): Show {
  const { loc, country } = parseCountry(s.location as string);
  return {
    id:          s.id          as string,
    name:        s.name        as string,
    date:        s.date        as string,
    year:        s.year        as number,
    location:    loc,
    country,
    description: (s.description as string) ?? "",
    coverImage:  (s.coverImage  as string) ?? "",
    featured:    Boolean(s.featured),
    published:   Boolean(s.published),
    tags:        (s.tags as string[]) ?? [],
    photoCount:  (s.photoCount as number) ?? 0,
  };
}

// ═══════════════════════════════════════════════════════════════
export default function AdminShows() {
  const [shows, setShows]       = useState<Show[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

  const [search, setSearch]         = useState("");
  const [filterFeat, setFilterFeat] = useState<"all"|"featured"|"normal">("all");
  const [filterPub, setFilterPub]   = useState<"all"|"published"|"hidden">("all");
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [editShow, setEditShow]     = useState<Show | null>(null);
  const [isNew, setIsNew]           = useState(false);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [tagInput, setTagInput]     = useState("");

  // Cover image upload state
  const [coverTab, setCoverTab]         = useState<"url"|"upload">("upload");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverDragOver, setCoverDragOver]   = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch ───────────────────────────────────────────────────
  const loadShows = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/shows?all=true", { headers: adminHeaders(false) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setShows(data.map(mapApiShow));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadShows(); }, [loadShows]);

  // ── Filter ──────────────────────────────────────────────────
  const filtered = useMemo(() => shows.filter(s => {
    const q = search.toLowerCase();
    const mQ = !q || s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q));
    const mF = filterFeat === "all" || (filterFeat === "featured" ? s.featured : !s.featured);
    const mP = filterPub  === "all" || (filterPub  === "published" ? s.published : !s.published);
    return mQ && mF && mP;
  }), [shows, search, filterFeat, filterPub]);

  // ── Cover image upload ──────────────────────────────────────
  async function uploadCover(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Cover musi być plikiem graficznym (JPG, PNG, WebP)"); return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Cover za duży (max 20MB)"); return;
    }

    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append("file",   file);
      fd.append("showId", "covers"); // osobny folder w Storage
      fd.append("alt",    editShow?.name ?? "cover");

      const res = await fetch("/api/upload/cover", {
        method: "POST",
        body: fd,
        // Uwierzytelnienie przez cookie (admin_session) — tak jak obecny /api/upload
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Błąd uploadu");
      }

      const { url } = await res.json();
      setEditShow(p => p ? { ...p, coverImage: url } : p);
    } catch (e) {
      setError(`Upload covera: ${e}`);
    } finally {
      setCoverUploading(false);
    }
  }

  function handleCoverFile(file: File | null | undefined) {
    if (file) uploadCover(file);
  }

  // ── API mutations ───────────────────────────────────────────
  async function apiPatch(id: string, patch: Partial<Show>) {
    setShows(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    try {
      const body = { ...patch } as Record<string, unknown>;
      if (patch.location !== undefined || patch.country !== undefined) {
        const show = shows.find(s => s.id === id)!;
        const loc  = patch.location ?? show.location;
        const ctr  = patch.country  ?? show.country;
        body.location = `${loc}, ${ctr}`;
        delete body.country;
      }
      const res = await fetch(`/api/shows/${id}`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    } catch (e) {
      setError(`Błąd zapisu: ${e}`);
      await loadShows();
    }
  }

  async function apiDelete(id: string) {
    setShows(prev => prev.filter(s => s.id !== id));
    setDeleteModal(null);
    try {
      const res = await fetch(`/api/shows/${id}`, {
        method: "DELETE", headers: adminHeaders(false),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    } catch (e) {
      setError(`Błąd usuwania: ${e}`);
      await loadShows();
    }
  }

  async function apiDeleteMany(ids: Set<string>) {
    setShows(prev => prev.filter(s => !ids.has(s.id)));
    setSelected(new Set());
    try {
      await Promise.all([...ids].map(id =>
        fetch(`/api/shows/${id}`, { method: "DELETE", headers: adminHeaders(false) })
      ));
    } catch (e) {
      setError(`Błąd usuwania: ${e}`);
      await loadShows();
    }
  }

  // ── Save ─────────────────────────────────────────────────────
  async function saveShow() {
    if (!editShow) return;
    setSaving(true);
    try {
      const locationFull = `${editShow.location}, ${editShow.country}`;
      const payload = {
        name:        editShow.name,
        location:    locationFull,
        date:        editShow.date,
        year:        editShow.year,
        description: editShow.description,
        coverImage:  editShow.coverImage,
        tags:        editShow.tags,
        featured:    editShow.featured,
        published:   editShow.published,
      };

      if (isNew) {
        const id = slugify(editShow.name) || `show-${Date.now()}`;
        const res = await fetch("/api/shows", {
          method: "POST",
          headers: adminHeaders(),
          body: JSON.stringify({ id, ...payload }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const created = await res.json();
        setShows(prev => [mapApiShow(created), ...prev]);
      } else {
        const res = await fetch(`/api/shows/${editShow.id}`, {
          method: "PATCH",
          headers: adminHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const updated = await res.json();
        setShows(prev => prev.map(s => s.id === editShow.id ? mapApiShow(updated) : s));
      }
      setEditShow(null);
    } catch (e) {
      setError(`Błąd zapisu: ${e}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Tags ─────────────────────────────────────────────────────
  function addTag() {
    const t = tagInput.trim();
    if (!t || !editShow || editShow.tags.includes(t)) return;
    setEditShow(p => p ? { ...p, tags: [...p.tags, t] } : p);
    setTagInput("");
  }
  function removeTag(tag: string) {
    setEditShow(p => p ? { ...p, tags: p.tags.filter(t => t !== tag) } : p);
  }

  function openNew() {
    setEditShow({ ...EMPTY, id: "", photoCount: 0 });
    setTagInput(""); setCoverTab("upload"); setIsNew(true);
  }
  function openEdit(show: Show) {
    setEditShow({ ...show }); setTagInput(""); setCoverTab(show.coverImage ? "url" : "upload"); setIsNew(false);
  }
  function toggle(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  const canSave = editShow && editShow.name.trim() && editShow.location.trim();

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"40dvh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"var(--space-4)", color:"var(--color-text-faint)" }}>
      <Loader2 size={28} style={{ animation:"spin 1s linear infinite" }}/>
      <p style={{ fontSize:"var(--text-sm)" }}>Ładowanie pokazów…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .shows-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr)); gap:var(--space-4); }
        .show-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-xl); overflow:hidden; transition:box-shadow .2s,border-color .2s,transform .2s; position:relative; }
        .show-card:hover { box-shadow:var(--shadow-md); transform:translateY(-2px); }
        .show-card.selected { border-color:var(--color-accent); }
        .show-card.unpublished { opacity:0.6; }
        .show-cover { aspect-ratio:16/7; background:var(--color-surface-offset); position:relative; overflow:hidden; }
        .show-cover img { width:100%;height:100%;object-fit:cover;display:block; }
        .cover-overlay { position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.6) 0%,transparent 55%); }
        .cover-badges { position:absolute;top:var(--space-3);left:var(--space-3);display:flex;gap:var(--space-2);flex-wrap:wrap; }
        .cover-actions { position:absolute;top:var(--space-3);right:var(--space-3);display:flex;gap:var(--space-2);opacity:0;transition:opacity .2s; }
        .show-card:hover .cover-actions { opacity:1; }
        .cover-checkbox { position:absolute;bottom:var(--space-3);right:var(--space-3);width:22px;height:22px;border-radius:var(--radius-sm);border:2px solid rgba(255,255,255,.7);background:rgba(0,0,0,.3);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s,border-color .15s; }
        .cover-checkbox.checked { background:var(--color-accent);border-color:var(--color-accent); }
        .badge-pill { font-size:10px;font-weight:700;padding:2px 8px;border-radius:var(--radius-full);display:inline-flex;align-items:center;gap:3px; }
        .pill-gold { background:var(--color-gold);color:#fff; }
        .pill-red  { background:rgba(204,31,31,.85);color:#fff; }
        .icon-btn  { width:30px;height:30px;border-radius:var(--radius-md);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(6px);transition:background .15s; }
        .filter-sel { padding:var(--space-2) var(--space-8) var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1.5px solid var(--color-border);background:var(--color-surface);color:var(--color-text);font-size:var(--text-sm);cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;min-height:36px; }
        .modal-bg { position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:var(--space-4); }
        .modal-sheet { background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-xl);width:100%;max-width:560px;max-height:90dvh;overflow-y:auto;box-shadow:var(--shadow-xl);display:flex;flex-direction:column; }
        .modal-header { padding:var(--space-5) var(--space-6);border-bottom:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--color-surface);z-index:2; }
        .modal-body   { padding:var(--space-6);display:flex;flex-direction:column;gap:var(--space-5); }
        .modal-footer { padding:var(--space-4) var(--space-6);border-top:1px solid var(--color-border);display:flex;gap:var(--space-3);position:sticky;bottom:0;background:var(--color-surface); }
        .field-label  { display:block;font-size:var(--text-xs);font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--color-text-faint);margin-bottom:var(--space-2); }
        .form-row { display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4); }
        @media(max-width:500px){ .form-row { grid-template-columns:1fr; } }
        .tag-chip { display:inline-flex;align-items:center;gap:var(--space-1);padding:3px 10px;border-radius:var(--radius-full);font-size:11px;font-weight:600;background:var(--color-surface-offset);border:1px solid var(--color-border);color:var(--color-text-muted); }
        .toggle-row { display:flex;align-items:center;justify-content:space-between;padding:var(--space-4);background:var(--color-surface-offset);border-radius:var(--radius-lg);border:1px solid var(--color-border); }
        .toggle-sw { width:44px;height:24px;border-radius:var(--radius-full);position:relative;cursor:pointer;border:none;transition:background .2s; }
        .toggle-th { position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:var(--radius-full);background:#fff;transition:transform .2s cubic-bezier(.16,1,.3,1);box-shadow:0 1px 3px rgba(0,0,0,.3); }

        /* ── Cover upload ── */
        .cover-tabs { display:flex; gap:2px; padding:2px; background:var(--color-surface-offset); border-radius:var(--radius-lg); width:fit-content; margin-bottom:var(--space-3); }
        .cover-tab  { padding:var(--space-1) var(--space-4); border-radius:calc(var(--radius-md) - 1px); font-size:var(--text-xs); font-weight:700; cursor:pointer; border:none; background:none; color:var(--color-text-muted); transition:background .15s,color .15s; display:inline-flex; align-items:center; gap:var(--space-2); }
        .cover-tab.on { background:var(--color-surface); color:var(--color-text); box-shadow:var(--shadow-sm); }

        .cover-dropzone { border:2px dashed var(--color-border); border-radius:var(--radius-lg); padding:var(--space-8) var(--space-6); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:var(--space-3); cursor:pointer; transition:border-color .15s,background .15s; text-align:center; }
        .cover-dropzone:hover, .cover-dropzone.drag { border-color:var(--color-accent); background:var(--color-accent-subtle); }
        .cover-dropzone-icon { width:40px; height:40px; border-radius:var(--radius-lg); background:var(--color-surface-offset); display:flex; align-items:center; justify-content:center; color:var(--color-accent); }
        .cover-dropzone p { font-size:var(--text-xs); color:var(--color-text-muted); line-height:1.6; }
        .cover-dropzone strong { color:var(--color-text); font-weight:700; }

        .cover-preview { position:relative; border-radius:var(--radius-lg); overflow:hidden; aspect-ratio:16/7; background:var(--color-surface-offset); }
        .cover-preview img { width:100%; height:100%; object-fit:cover; display:block; }
        .cover-preview-remove { position:absolute; top:var(--space-2); right:var(--space-2); background:rgba(0,0,0,.7); border:none; border-radius:var(--radius-full); width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff; transition:background .15s; }
        .cover-preview-remove:hover { background:rgba(239,68,68,.9); }
        .cover-uploading { display:flex; align-items:center; justify-content:center; gap:var(--space-3); padding:var(--space-6); color:var(--color-text-muted); font-size:var(--text-sm); }

        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {/* ── Error banner ── */}
      {error && (
        <div style={{ display:"flex",alignItems:"center",gap:"var(--space-3)",padding:"var(--space-3) var(--space-4)",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.25)",borderRadius:"var(--radius-lg)",marginBottom:"var(--space-4)",fontSize:"var(--text-xs)",color:"#ef4444",fontWeight:600 }}>
          <AlertCircle size={14}/>{error}
          <button onClick={() => setError(null)} style={{ marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"#ef4444",display:"flex" }}><X size={13}/></button>
        </div>
      )}

      {/* ── Page header ── */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"var(--space-6)",flexWrap:"wrap",gap:"var(--space-3)" }}>
        <div>
          <h1 style={{ fontFamily:"var(--font-display)",fontWeight:900,fontSize:"var(--text-xl)",letterSpacing:"-0.03em" }}>Pokazy lotnicze</h1>
          <p style={{ fontSize:"var(--text-sm)",color:"var(--color-text-muted)" }}>
            {shows.length} pokazów · {shows.filter(s=>s.featured).length} wyróżnione · {shows.filter(s=>!s.published).length} ukryte
          </p>
        </div>
        <div style={{ display:"flex",gap:"var(--space-2)" }}>
          <button onClick={loadShows} style={{ display:"flex",alignItems:"center",gap:"var(--space-2)",padding:"var(--space-2) var(--space-4)",borderRadius:"var(--radius-md)",border:"1px solid var(--color-border)",background:"transparent",cursor:"pointer",color:"var(--color-text-muted)",fontSize:"var(--text-sm)",fontWeight:600 }}>Odśwież</button>
          <button onClick={openNew} style={{ display:"flex",alignItems:"center",gap:"var(--space-2)",padding:"var(--space-2) var(--space-4)",borderRadius:"var(--radius-md)",background:"var(--color-accent)",color:"#fff",border:"none",cursor:"pointer",fontSize:"var(--text-sm)",fontWeight:700 }}>
            <Plus size={15}/> Nowy pokaz
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display:"flex",alignItems:"center",gap:"var(--space-3)",flexWrap:"wrap",marginBottom:"var(--space-5)" }}>
        <div style={{ position:"relative",flex:1,minWidth:200 }}>
          <Search size={14} style={{ position:"absolute",left:"var(--space-3)",top:"50%",transform:"translateY(-50%)",color:"var(--color-text-faint)",pointerEvents:"none" }}/>
          <input className="input" placeholder="Szukaj…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:"var(--space-10)",fontSize:"var(--text-sm)" }}/>
          {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:"var(--space-3)",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--color-text-faint)",display:"flex" }}><X size={13}/></button>}
        </div>
        <select className="filter-sel" value={filterFeat} onChange={e=>setFilterFeat(e.target.value as "all"|"featured"|"normal")}>
          <option value="all">Wszystkie</option>
          <option value="featured">Wyróżnione</option>
          <option value="normal">Zwykłe</option>
        </select>
        <select className="filter-sel" value={filterPub} onChange={e=>setFilterPub(e.target.value as "all"|"published"|"hidden")}>
          <option value="all">Widoczność: wszystkie</option>
          <option value="published">Opublikowane</option>
          <option value="hidden">Ukryte</option>
        </select>
      </div>

      {/* ── Selection bar ── */}
      {selected.size > 0 && (
        <div style={{ display:"flex",alignItems:"center",gap:"var(--space-3)",padding:"var(--space-3) var(--space-4)",background:"var(--color-accent-subtle)",border:"1px solid var(--color-border)",borderRadius:"var(--radius-lg)",marginBottom:"var(--space-4)",flexWrap:"wrap" }}>
          <span style={{ fontSize:"var(--text-sm)",fontWeight:600,color:"var(--color-accent)" }}>{selected.size} zaznaczonych</span>
          <button onClick={()=>setSelected(new Set())} style={{ fontSize:"var(--text-xs)",background:"none",border:"none",cursor:"pointer",color:"var(--color-text-muted)" }}>Odznacz</button>
          <button onClick={()=>setSelected(new Set(filtered.map(s=>s.id)))} style={{ fontSize:"var(--text-xs)",background:"none",border:"none",cursor:"pointer",color:"var(--color-text-muted)" }}>Zaznacz wszystkie</button>
          <button onClick={()=>selected.forEach(id=>apiPatch(id,{published:false}))} style={{ display:"flex",alignItems:"center",gap:4,fontSize:"var(--text-xs)",background:"none",border:"none",cursor:"pointer",color:"var(--color-text-muted)" }}><EyeOff size={12}/>Ukryj</button>
          <button onClick={()=>selected.forEach(id=>apiPatch(id,{published:true}))}  style={{ display:"flex",alignItems:"center",gap:4,fontSize:"var(--text-xs)",background:"none",border:"none",cursor:"pointer",color:"var(--color-text-muted)" }}><Eye  size={12}/>Pokaż</button>
          <button onClick={()=>apiDeleteMany(selected)} style={{ display:"flex",alignItems:"center",gap:4,padding:"var(--space-2) var(--space-3)",borderRadius:"var(--radius-md)",background:"var(--color-accent)",color:"#fff",border:"none",cursor:"pointer",fontSize:"var(--text-xs)",fontWeight:700,marginLeft:"auto" }}>
            <Trash2 size={12}/> Usuń zaznaczone
          </button>
        </div>
      )}

      {/* ── Cards grid ── */}
      <div className="shows-grid">
        {filtered.map(show => (
          <div key={show.id} className={`show-card ${selected.has(show.id)?"selected":""} ${!show.published?"unpublished":""}`}>
            <div className="show-cover">
              {show.coverImage
                ? <img src={show.coverImage} alt={show.name} loading="lazy"/>
                : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"var(--space-2)" }}>
                    <Images size={28} style={{ color:"var(--color-text-faint)" }}/>
                    <span style={{ fontSize:10,color:"var(--color-text-faint)",fontWeight:600 }}>Brak miniatury</span>
                  </div>
              }
              <div className="cover-overlay"/>
              <div className="cover-badges">
                {show.featured   && <span className="badge-pill pill-gold"><Star size={9} fill="#fff"/> Featured</span>}
                {!show.published && <span className="badge-pill pill-red"><EyeOff size={9}/> Ukryty</span>}
              </div>
              <div className="cover-actions">
                <button className="icon-btn" title={show.featured?"Usuń wyróżnienie":"Wyróżnij"} onClick={()=>apiPatch(show.id,{featured:!show.featured})} style={{ background:show.featured?"rgba(212,169,22,.9)":"rgba(0,0,0,.55)",color:"#fff" }}><Star size={13} fill={show.featured?"currentColor":"none"}/></button>
                <button className="icon-btn" title={show.published?"Ukryj":"Opublikuj"} onClick={()=>apiPatch(show.id,{published:!show.published})} style={{ background:"rgba(0,0,0,.55)",color:"#fff" }}>{show.published?<Eye size={13}/>:<EyeOff size={13}/>}</button>
                <button className="icon-btn" title="Edytuj" onClick={()=>openEdit(show)} style={{ background:"rgba(0,0,0,.55)",color:"#fff" }}><Pencil size={13}/></button>
                <button className="icon-btn" title="Usuń" onClick={()=>setDeleteModal(show.id)} style={{ background:"rgba(204,31,31,.85)",color:"#fff" }}><Trash2 size={13}/></button>
              </div>
              <div className={`cover-checkbox ${selected.has(show.id)?"checked":""}`} onClick={()=>toggle(show.id)}>
                {selected.has(show.id)&&<Check size={12} color="#fff"/>}
              </div>
            </div>
            <div style={{ padding:"var(--space-4)" }}>
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"var(--space-2)",marginBottom:"var(--space-2)" }}>
                <h3 style={{ fontFamily:"var(--font-display)",fontWeight:800,fontSize:"var(--text-base)",letterSpacing:"-0.02em",lineHeight:1.3 }}>{show.name}</h3>
                <button onClick={()=>openEdit(show)} style={{ flexShrink:0,background:"none",border:"none",cursor:"pointer",color:"var(--color-text-faint)",display:"flex",padding:"var(--space-1)" }}><Pencil size={13}/></button>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-1)",marginBottom:"var(--space-3)" }}>
                <span style={{ fontSize:"var(--text-xs)",color:"var(--color-text-faint)",display:"flex",alignItems:"center",gap:"var(--space-1)" }}><MapPin size={11}/>{show.location}{show.country?`, ${show.country}`:""}</span>
                <span style={{ fontSize:"var(--text-xs)",color:"var(--color-text-faint)",display:"flex",alignItems:"center",gap:"var(--space-1)" }}><Calendar size={11}/>{show.date||show.year}</span>
                <span style={{ fontSize:"var(--text-xs)",color:"var(--color-text-faint)",display:"flex",alignItems:"center",gap:"var(--space-1)" }}><Images size={11}/>{show.photoCount} zdjęć</span>
              </div>
              {show.description&&<p style={{ fontSize:"var(--text-xs)",color:"var(--color-text-muted)",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",marginBottom:"var(--space-3)" }}>{show.description}</p>}
              {show.tags?.length>0&&(
                <div style={{ display:"flex",flexWrap:"wrap",gap:"var(--space-1)" }}>
                  {show.tags.slice(0,4).map(t=><span key={t} className="tag-chip">{t}</span>)}
                  {show.tags.length>4&&<span className="tag-chip" style={{ color:"var(--color-text-faint)" }}>+{show.tags.length-4}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {filtered.length===0&&!loading&&(
        <div style={{ textAlign:"center",padding:"var(--space-20) var(--space-8)",color:"var(--color-text-muted)" }}>
          <Search size={36} style={{ margin:"0 auto var(--space-4)",color:"var(--color-text-faint)" }}/>
          <p style={{ fontWeight:600,fontSize:"var(--text-sm)" }}>Brak wyników</p>
          <p style={{ fontSize:"var(--text-xs)",color:"var(--color-text-faint)",marginTop:"var(--space-2)" }}>Zmień filtry lub dodaj nowy pokaz.</p>
          <button onClick={()=>{setSearch("");setFilterFeat("all");setFilterPub("all");}} style={{ marginTop:"var(--space-4)",padding:"var(--space-2) var(--space-4)",borderRadius:"var(--radius-md)",border:"1px solid var(--color-border)",background:"transparent",cursor:"pointer",fontSize:"var(--text-sm)" }}>Wyczyść filtry</button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL EDYCJI / NOWY POKAZ
      ══════════════════════════════════════════ */}
      {editShow && (
        <div className="modal-bg" onClick={()=>setEditShow(null)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontFamily:"var(--font-display)",fontWeight:900,fontSize:"var(--text-lg)",letterSpacing:"-0.02em" }}>{isNew?"Nowy pokaz":"Edytuj pokaz"}</h2>
              <button onClick={()=>setEditShow(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--color-text-faint)",display:"flex",padding:"var(--space-1)" }}><X size={16}/></button>
            </div>

            <div className="modal-body">

              {/* Nazwa */}
              <div>
                <label className="field-label">Nazwa pokazu *</label>
                <input className="input" placeholder="np. Radom Air Show 2025" value={editShow.name} onChange={e=>setEditShow(p=>p?{...p,name:e.target.value}:p)}/>
              </div>

              {/* Lokalizacja + kraj */}
              <div className="form-row">
                <div>
                  <label className="field-label">Lokalizacja *</label>
                  <input className="input" placeholder="np. Radom" value={editShow.location} onChange={e=>setEditShow(p=>p?{...p,location:e.target.value}:p)}/>
                </div>
                <div>
                  <label className="field-label">Kraj</label>
                  <select style={{ width:"100%",padding:"var(--space-2) var(--space-3)",borderRadius:"var(--radius-sm)",border:"1.5px solid var(--color-border)",background:"var(--color-surface)",color:"var(--color-text)",fontSize:"var(--text-sm)",minHeight:38 }} value={editShow.country} onChange={e=>setEditShow(p=>p?{...p,country:e.target.value}:p)}>
                    {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Data + rok */}
              <div className="form-row">
                <div>
                  <label className="field-label">Data</label>
                  <input className="input" type="date" value={editShow.date} onChange={e=>{const d=e.target.value;const y=d?new Date(d).getFullYear():editShow.year;setEditShow(p=>p?{...p,date:d,year:y}:p);}}/>
                </div>
                <div>
                  <label className="field-label">Rok</label>
                  <input className="input" type="number" min={1950} max={2100} value={editShow.year} onChange={e=>setEditShow(p=>p?{...p,year:Number(e.target.value)}:p)}/>
                </div>
              </div>

              {/* ── COVER IMAGE — upload lub URL ── */}
              <div>
                <label className="field-label">Miniatura pokazu</label>

                {/* Przełącznik Upload / URL */}
                <div className="cover-tabs">
                  <button className={`cover-tab ${coverTab==="upload"?"on":""}`} onClick={()=>setCoverTab("upload")}>
                    <Upload size={12}/> Prześlij plik
                  </button>
                  <button className={`cover-tab ${coverTab==="url"?"on":""}`} onClick={()=>setCoverTab("url")}>
                    <Link2 size={12}/> Wklej URL
                  </button>
                </div>

                {/* Podgląd jeśli jest już cover */}
                {editShow.coverImage && (
                  <div className="cover-preview" style={{ marginBottom:"var(--space-3)" }}>
                    <img
                      src={editShow.coverImage}
                      alt="Miniatura pokazu"
                      onError={e=>(e.currentTarget.style.display="none")}
                    />
                    <button
                      className="cover-preview-remove"
                      title="Usuń miniaturę"
                      onClick={()=>setEditShow(p=>p?{...p,coverImage:""}:p)}
                    >
                      <X size={13}/>
                    </button>
                  </div>
                )}

                {/* ── TAB: UPLOAD ── */}
                {coverTab === "upload" && (
                  <>
                    {coverUploading ? (
                      <div className="cover-uploading">
                        <Loader2 size={18} style={{ animation:"spin 1s linear infinite",color:"var(--color-accent)" }}/>
                        Przesyłanie miniatury…
                      </div>
                    ) : (
                      <div
                        className={`cover-dropzone ${coverDragOver?"drag":""}`}
                        onClick={()=>coverInputRef.current?.click()}
                        onDragOver={e=>{e.preventDefault();setCoverDragOver(true);}}
                        onDragLeave={()=>setCoverDragOver(false)}
                        onDrop={e=>{
                          e.preventDefault();
                          setCoverDragOver(false);
                          handleCoverFile(e.dataTransfer.files[0]);
                        }}
                      >
                        <div className="cover-dropzone-icon">
                          <Upload size={18}/>
                        </div>
                        <p>
                          <strong>Kliknij lub przeciągnij</strong> zdjęcie tutaj<br/>
                          JPG, PNG, WebP · max 20 MB
                        </p>
                      </div>
                    )}
                    {/* Ukryty input */}
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      style={{ display:"none" }}
                      onChange={e=>handleCoverFile(e.target.files?.[0])}
                    />
                  </>
                )}

                {/* ── TAB: URL ── */}
                {coverTab === "url" && (
                  <input
                    className="input"
                    placeholder="https://…"
                    value={editShow.coverImage}
                    onChange={e=>setEditShow(p=>p?{...p,coverImage:e.target.value}:p)}
                  />
                )}
              </div>

              {/* Opis */}
              <div>
                <label className="field-label">Opis</label>
                <textarea className="input" rows={3} placeholder="Krótki opis pokazu…" value={editShow.description} onChange={e=>setEditShow(p=>p?{...p,description:e.target.value}:p)} style={{ resize:"vertical",fontFamily:"inherit" }}/>
              </div>

              {/* Tagi */}
              <div>
                <label className="field-label">Tagi</label>
                <div style={{ display:"flex",gap:"var(--space-2)",marginBottom:"var(--space-3)",flexWrap:"wrap" }}>
                  {editShow.tags.map(t=>(
                    <span key={t} className="tag-chip">{t}
                      <button onClick={()=>removeTag(t)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--color-text-faint)",display:"flex",padding:0,marginLeft:2 }}><X size={10}/></button>
                    </span>
                  ))}
                </div>
                <div style={{ display:"flex",gap:"var(--space-2)" }}>
                  <input className="input" placeholder="Dodaj tag…" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addTag();}}} style={{ flex:1 }}/>
                  <button onClick={addTag} disabled={!tagInput.trim()} style={{ padding:"var(--space-2) var(--space-4)",borderRadius:"var(--radius-md)",border:"1px solid var(--color-border)",background:"var(--color-surface-offset)",cursor:"pointer",display:"flex",alignItems:"center" }}><Plus size={14}/></button>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-3)" }}>
                <div className="toggle-row">
                  <div><p style={{ fontSize:"var(--text-sm)",fontWeight:600 }}>Wyróżniony pokaz</p><p style={{ fontSize:"var(--text-xs)",color:"var(--color-text-faint)" }}>Pojawi się na stronie głównej</p></div>
                  <button className="toggle-sw" role="switch" aria-checked={editShow.featured} onClick={()=>setEditShow(p=>p?{...p,featured:!p.featured}:p)} style={{ background:editShow.featured?"var(--color-gold)":"var(--color-surface-dynamic)" }}>
                    <div className="toggle-th" style={{ transform:editShow.featured?"translateX(20px)":"translateX(0)" }}/>
                  </button>
                </div>
                <div className="toggle-row">
                  <div><p style={{ fontSize:"var(--text-sm)",fontWeight:600 }}>Opublikowany</p><p style={{ fontSize:"var(--text-xs)",color:"var(--color-text-faint)" }}>Widoczny publicznie</p></div>
                  <button className="toggle-sw" role="switch" aria-checked={editShow.published} onClick={()=>setEditShow(p=>p?{...p,published:!p.published}:p)} style={{ background:editShow.published?"var(--color-accent)":"var(--color-surface-dynamic)" }}>
                    <div className="toggle-th" style={{ transform:editShow.published?"translateX(20px)":"translateX(0)" }}/>
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={()=>setEditShow(null)} style={{ flex:1,padding:"var(--space-3)",borderRadius:"var(--radius-md)",border:"1px solid var(--color-border)",background:"transparent",cursor:"pointer",fontSize:"var(--text-sm)",fontWeight:600 }}>Anuluj</button>
              <button onClick={saveShow} disabled={!canSave||saving} style={{ flex:2,padding:"var(--space-3)",borderRadius:"var(--radius-md)",background:canSave&&!saving?"var(--color-accent)":"var(--color-surface-dynamic)",color:canSave&&!saving?"#fff":"var(--color-text-faint)",border:"none",cursor:canSave&&!saving?"pointer":"not-allowed",fontSize:"var(--text-sm)",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:"var(--space-2)" }}>
                {saving&&<Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/>}
                {isNew?"Dodaj pokaz":"Zapisz zmiany"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete modal ── */}
      {deleteModal && (
        <div className="modal-bg" onClick={()=>setDeleteModal(null)}>
          <div style={{ background:"var(--color-surface)",border:"1px solid var(--color-border)",borderRadius:"var(--radius-xl)",padding:"var(--space-8)",maxWidth:360,width:"100%",boxShadow:"var(--shadow-xl)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:44,height:44,borderRadius:"var(--radius-xl)",background:"rgba(239,68,68,.1)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"var(--space-4)",color:"#ef4444" }}><Trash2 size={20}/></div>
            <h2 style={{ fontFamily:"var(--font-display)",fontWeight:900,fontSize:"var(--text-lg)",marginBottom:"var(--space-2)" }}>Usuń pokaz?</h2>
            <p style={{ fontSize:"var(--text-sm)",color:"var(--color-text-muted)",marginBottom:"var(--space-2)" }}>
              Pokaz <strong>„{shows.find(s=>s.id===deleteModal)?.name}"</strong> zostanie trwale usunięty z bazy danych.
            </p>
            <p style={{ fontSize:"var(--text-xs)",color:"var(--color-text-faint)",marginBottom:"var(--space-6)" }}>Tej operacji nie można cofnąć.</p>
            <div style={{ display:"flex",gap:"var(--space-3)" }}>
              <button onClick={()=>setDeleteModal(null)} style={{ flex:1,padding:"var(--space-3)",borderRadius:"var(--radius-md)",border:"1px solid var(--color-border)",background:"transparent",cursor:"pointer",fontSize:"var(--text-sm)",fontWeight:600 }}>Anuluj</button>
              <button onClick={()=>apiDelete(deleteModal)} style={{ flex:1,padding:"var(--space-3)",borderRadius:"var(--radius-md)",background:"#ef4444",color:"#fff",border:"none",cursor:"pointer",fontSize:"var(--text-sm)",fontWeight:700 }}>Usuń</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}