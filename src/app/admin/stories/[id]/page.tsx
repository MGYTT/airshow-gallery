"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Trash2, GripVertical, Save, Play,
  Loader2, Image as ImageIcon, Type, BarChart2,
  Lightbulb, ChevronDown, ChevronUp, AlertCircle, FolderOpen,
} from "lucide-react";
import StoryPlayer from "@/components/stories/StoryPlayer";
import MediaPicker from "@/components/admin/MediaPicker";
import { mapStory } from "@/lib/supabase/types";
import type { DbStory, FrameType } from "@/lib/supabase/types";

// ── Typy ─────────────────────────────────────────────────────
interface Frame {
  id:              string;
  story_id:        string;
  type:            FrameType;
  image_src:       string | null;
  image_alt:       string | null;
  caption:         string | null;
  subcaption:      string | null;
  aircraft:        string | null;
  timestamp_label: string | null;
  stat_value:      string | null;
  stat_label:      string | null;
  fact_text:       string | null;
  sort_order:      number;
  duration:        number;
  _dirty?: boolean;
}

// Opisuje który picker jest otwarty:
// "cover" = cover image relacji
// `frame:${id}` = image_src konkretnej klatki
type PickerTarget = "cover" | `frame:${string}` | null;

const FRAME_TYPES: { value: FrameType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "photo",  label: "Zdjęcie",     icon: <ImageIcon size={13}/>, desc: "Zdjęcie z podpisem i nazwą samolotu" },
  { value: "burst",  label: "Seria",       icon: <ImageIcon size={13}/>, desc: "Seria zdjęć" },
  { value: "text",   label: "Tekst",       icon: <Type size={13}/>,      desc: "Duży cytat lub nagłówek" },
  { value: "stat",   label: "Statystyka",  icon: <BarChart2 size={13}/>, desc: "Wielka liczba z opisem" },
  { value: "fact",   label: "Ciekawostka", icon: <Lightbulb size={13}/>, desc: "Ciekawy fakt" },
];

// ── Przycisk otwierający picker ───────────────────────────────
function PickBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      title="Wybierz z biblioteki"
      style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0 var(--space-3)", height:36, borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)", background:"var(--color-surface-offset)", cursor:"pointer", color:"var(--color-text-muted)", flexShrink:0, transition:"background .15s,color .15s,border-color .15s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)"; (e.currentTarget as HTMLElement).style.color = "var(--color-primary)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"; }}
    >
      <FolderOpen size={14}/>
    </button>
  );
}

// ── Edytor pojedynczej klatki ─────────────────────────────────
function FrameEditor({ frame, idx, total, onChange, onDelete, onMove, onOpenPicker }: {
  frame:         Frame;
  idx:           number;
  total:         number;
  onChange:      (id: string, patch: Partial<Frame>) => void;
  onDelete:      (id: string) => void;
  onMove:        (id: string, dir: -1 | 1) => void;
  onOpenPicker:  (frameId: string) => void;
}) {
  const [open, setOpen] = useState(true);

  const set = (field: keyof Frame) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(frame.id, { [field]: e.target.value || null } as Partial<Frame>);

  const typeLabel = FRAME_TYPES.find(t => t.value === frame.type)?.icon;
  const hasImage  = frame.type === "photo" || frame.type === "burst" || frame.type === "stat";

  return (
    <div style={{ border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", background:"var(--color-surface)", overflow:"hidden" }}>
      {/* Nagłówek klatki */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", padding:"var(--space-3) var(--space-4)", background:"var(--color-surface-offset)", cursor:"pointer", userSelect:"none" }}
      >
        <GripVertical size={14} style={{ color:"var(--color-text-faint)", cursor:"grab", flexShrink:0 }}/>
        <div style={{ width:22, height:22, borderRadius:"var(--radius-sm)", background:"var(--color-surface-dynamic)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-text-muted)", flexShrink:0 }}>
          {typeLabel}
        </div>
        <span style={{ fontSize:"var(--text-xs)", fontWeight:700, color:"var(--color-text-faint)", minWidth:20 }}>#{idx+1}</span>
        <span style={{ fontSize:"var(--text-sm)", fontWeight:600, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {frame.caption || frame.fact_text || frame.stat_value || `Klatka ${idx+1}`}
        </span>
        {frame._dirty && (
          <span style={{ fontSize:9, fontWeight:700, color:"var(--color-warning)", background:"var(--color-warning-highlight)", padding:"1px 6px", borderRadius:99, flexShrink:0 }}>
            niezapisane
          </span>
        )}
        {/* Miniatura jeśli jest obrazek */}
        {frame.image_src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={frame.image_src} alt=""
            style={{ width:28, height:28, borderRadius:"var(--radius-sm)", objectFit:"cover", border:"1px solid var(--color-border)", flexShrink:0 }}/>
        )}
        <div style={{ display:"flex", gap:2 }} onClick={e => e.stopPropagation()}>
          <button className="fe-btn" disabled={idx === 0}        onClick={() => onMove(frame.id, -1)}><ChevronUp size={12}/></button>
          <button className="fe-btn" disabled={idx === total-1} onClick={() => onMove(frame.id,  1)}><ChevronDown size={12}/></button>
          <button className="fe-btn danger" onClick={() => onDelete(frame.id)}><Trash2 size={12}/></button>
        </div>
        {open
          ? <ChevronUp   size={13} style={{ flexShrink:0, color:"var(--color-text-faint)" }}/>
          : <ChevronDown size={13} style={{ flexShrink:0, color:"var(--color-text-faint)" }}/>
        }
      </div>

      {open && (
        <div style={{ padding:"var(--space-5)", display:"grid", gap:"var(--space-4)" }}>

          {/* Wiersz 1: typ, czas, znacznik */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"var(--space-3)" }}>
            <div>
              <label className="fe-label">Typ klatki</label>
              <select className="fe-input" value={frame.type}
                onChange={e => onChange(frame.id, { type: e.target.value as FrameType })}>
                {FRAME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="fe-label">Czas (s)</label>
              <input className="fe-input" type="number" min={2} max={30} value={frame.duration}
                onChange={e => onChange(frame.id, { duration: Number(e.target.value) })}/>
            </div>
            <div>
              <label className="fe-label">Znacznik czasu</label>
              <input className="fe-input" placeholder="np. 10:23, Start…"
                value={frame.timestamp_label ?? ""} onChange={set("timestamp_label")}/>
            </div>
          </div>

          {/* URL zdjęcia */}
          {hasImage && (
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"var(--space-3)" }}>
              <div>
                <label className="fe-label">Zdjęcie</label>
                <div style={{ display:"flex", gap:"var(--space-2)" }}>
                  <input className="fe-input" placeholder="https://… lub wybierz z biblioteki"
                    value={frame.image_src ?? ""}
                    onChange={e => onChange(frame.id, { image_src: e.target.value || null })}/>
                  <PickBtn onClick={() => onOpenPicker(frame.id)}/>
                </div>
              </div>
              <div>
                <label className="fe-label">Alt tekst</label>
                <input className="fe-input" placeholder="Opis" value={frame.image_alt ?? ""} onChange={set("image_alt")}/>
              </div>
            </div>
          )}

          {/* Podgląd zdjęcia */}
          {frame.image_src && (
            <div style={{ borderRadius:"var(--radius-lg)", overflow:"hidden", height:140, background:"var(--color-surface-offset)", border:"1px solid var(--color-border)", position:"relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frame.image_src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
              <button
                onClick={() => onChange(frame.id, { image_src: null })}
                title="Usuń zdjęcie"
                style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,.6)", border:"none", borderRadius:"50%", width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", fontSize:14, lineHeight:1 }}
              >×</button>
            </div>
          )}

          {/* Samolot */}
          {(frame.type === "photo" || frame.type === "burst") && (
            <div>
              <label className="fe-label">Samolot / obiekt</label>
              <input className="fe-input" placeholder="np. F-16 Block 52+"
                value={frame.aircraft ?? ""} onChange={set("aircraft")}/>
            </div>
          )}

          {/* Główna treść */}
          <div>
            <label className="fe-label">
              {frame.type === "stat" ? "Wartość *" : frame.type === "fact" ? "Treść ciekawostki *" : "Podpis / caption"}
            </label>
            {frame.type === "fact" ? (
              <textarea className="fe-input" rows={3} placeholder="Ciekawy fakt…"
                value={frame.fact_text ?? ""}
                onChange={e => onChange(frame.id, { fact_text: e.target.value || null })}
                style={{ resize:"vertical" }}/>
            ) : frame.type === "stat" ? (
              <input className="fe-input" placeholder="np. 47"
                value={frame.stat_value ?? ""} onChange={set("stat_value")}/>
            ) : (
              <textarea className="fe-input" rows={2} placeholder="Podpis klatki…"
                value={frame.caption ?? ""}
                onChange={e => onChange(frame.id, { caption: e.target.value || null })}
                style={{ resize:"vertical" }}/>
            )}
          </div>

          {/* Etykieta stat */}
          {frame.type === "stat" && (
            <div>
              <label className="fe-label">Etykieta</label>
              <input className="fe-input" placeholder="np. samolotów w pokazie"
                value={frame.stat_label ?? ""} onChange={set("stat_label")}/>
            </div>
          )}

          {/* Subcaption */}
          {frame.type !== "stat" && (
            <div>
              <label className="fe-label">Podpis dodatkowy</label>
              <input className="fe-input" placeholder="Dodatkowy opis…"
                value={frame.subcaption ?? ""} onChange={set("subcaption")}/>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── PAGE ─────────────────────────────────────────────────────
export default function StoryEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();

  const [story,   setStory]   = useState<DbStory | null>(null);
  const [frames,  setFrames]  = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [adding,  setAdding]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [saved,   setSaved]   = useState(false);
  const [preview, setPreview] = useState(false);

  // Który picker jest otwarty
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const [meta, setMeta] = useState({
    title: "", subtitle: "", cover_image: "", accent_color: "#cc1f1f", published: false,
  });

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/stories/${id}`, { credentials: "include" });
    if (!res.ok) { router.push("/admin/stories"); return; }
    const data: DbStory = await res.json();
    setStory(data);
    setMeta({
      title:        data.title,
      subtitle:     data.subtitle    ?? "",
      cover_image:  data.cover_image ?? "",
      accent_color: data.accent_color,
      published:    data.published,
    });
    setFrames((data.story_frames ?? []).sort((a, b) => a.sort_order - b.sort_order));
    setLoading(false);
  }

  // Obsługa wyboru z pickera
  function handlePickerSelect(url: string) {
    if (pickerTarget === "cover") {
      setMeta(m => ({ ...m, cover_image: url }));
    } else if (pickerTarget?.startsWith("frame:")) {
      const frameId = pickerTarget.slice(6);
      updateFrame(frameId, { image_src: url });
    }
    setPickerTarget(null);
  }

  function updateFrame(fid: string, patch: Partial<Frame>) {
    setFrames(prev => prev.map(f => f.id === fid ? { ...f, ...patch, _dirty: true } : f));
  }

  function moveFrame(fid: string, dir: -1 | 1) {
    setFrames(prev => {
      const arr = [...prev];
      const i = arr.findIndex(f => f.id === fid);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr.map((f, idx) => ({ ...f, sort_order: idx, _dirty: true }));
    });
  }

  async function deleteFrame(fid: string) {
    if (!confirm("Usunąć klatkę?")) return;
    const res = await fetch(`/api/story-frames/${fid}`, { method:"DELETE", credentials:"include" });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Nie udało się usunąć klatki");
      return;
    }
    setFrames(prev => prev.filter(f => f.id !== fid));
  }

  async function addFrame(type: FrameType) {
    setAdding(true);
    setError(null);
    const res = await fetch("/api/story-frames", {
      method:      "POST",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({ story_id: id, type, sort_order: frames.length, duration: 5 }),
    });
    if (res.ok) {
      const created = await res.json();
      const frame   = Array.isArray(created) ? created[0] : created;
      setFrames(prev => [...prev, { ...frame, _dirty: false }]);
    } else {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? `Błąd ${res.status}`);
    }
    setAdding(false);
  }

  async function saveAll() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const metaRes = await fetch(`/api/stories/${id}`, {
      method:      "PATCH",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({
        title:        meta.title,
        subtitle:     meta.subtitle    || null,
        cover_image:  meta.cover_image || null,
        accent_color: meta.accent_color,
        published:    meta.published,
      }),
    });

    if (!metaRes.ok) {
      const b = await metaRes.json().catch(() => ({}));
      setError(b.error ?? `Błąd ${metaRes.status} przy zapisie relacji`);
      setSaving(false);
      return;
    }

    const dirty   = frames.filter(f => f._dirty);
    const results = await Promise.all(dirty.map(f =>
      fetch(`/api/story-frames/${f.id}`, {
        method:      "PATCH",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({
          type: f.type, image_src: f.image_src, image_alt: f.image_alt,
          caption: f.caption, subcaption: f.subcaption, aircraft: f.aircraft,
          timestamp_label: f.timestamp_label, stat_value: f.stat_value,
          stat_label: f.stat_label, fact_text: f.fact_text,
          sort_order: f.sort_order, duration: f.duration,
        }),
      })
    ));

    const failed = results.filter(r => !r.ok);
    if (failed.length > 0) {
      setError(`${failed.length} klatek nie udało się zapisać`);
    } else {
      setFrames(prev => prev.map(f => ({ ...f, _dirty: false })));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  function buildPreview() {
    if (!story) return null;
    return mapStory({
      ...story,
      title:        meta.title,
      subtitle:     meta.subtitle    || null,
      cover_image:  meta.cover_image || null,
      accent_color: meta.accent_color,
      published:    meta.published,
      story_frames: frames.map(f => ({
        id: f.id, story_id: f.story_id, type: f.type,
        image_src: f.image_src, image_alt: f.image_alt,
        caption: f.caption, subcaption: f.subcaption, aircraft: f.aircraft,
        timestamp_label: f.timestamp_label, stat_value: f.stat_value,
        stat_label: f.stat_label, fact_text: f.fact_text,
        sort_order: f.sort_order, duration: f.duration,
      })),
    });
  }

  const dirtyCount  = frames.filter(f => f._dirty).length;
  const previewData = buildPreview();

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}>
      <Loader2 size={28} style={{ animation:"spin 1s linear infinite", color:"var(--color-text-faint)" }}/>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .fe-label{font-size:var(--text-xs);font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--color-text-faint);margin-bottom:var(--space-1);display:block}
        .fe-input{width:100%;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-surface-offset);font-size:var(--text-sm);color:var(--color-text);outline:none;transition:border-color .15s,box-shadow .15s}
        .fe-input:focus{border-color:var(--color-primary);box-shadow:0 0 0 3px oklch(from var(--color-primary) l c h / .15)}
        .fe-btn{display:inline-flex;align-items:center;justify-content:center;padding:var(--space-1) var(--space-2);border-radius:var(--radius-sm);border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text);font-size:var(--text-xs);cursor:pointer;transition:background .15s,color .15s,border-color .15s}
        .fe-btn:disabled{opacity:.35;cursor:not-allowed}
        .fe-btn:hover:not(:disabled){background:var(--color-surface-offset)}
        .fe-btn.danger:hover:not(:disabled){background:var(--color-error-highlight);color:var(--color-error);border-color:var(--color-error)}
        .fe-btn.primary{background:var(--color-primary);color:#fff;border-color:transparent;padding:var(--space-2) var(--space-5);font-weight:700;gap:var(--space-2);font-size:var(--text-sm)}
        .fe-btn.primary:hover:not(:disabled){background:var(--color-primary-hover)}
        .fe-btn.ghost{background:transparent;border-color:var(--color-border);color:var(--color-text-muted);padding:var(--space-2) var(--space-4);font-weight:600;gap:var(--space-2);font-size:var(--text-sm)}
        .fe-btn.ghost:hover:not(:disabled){background:var(--color-surface-offset);color:var(--color-text)}
        .fe-page{max-width:var(--content-default);margin:0 auto;padding:var(--space-8)}
        @media(max-width:640px){.fe-page{padding:var(--space-4)}}
        .fe-alert{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);font-size:var(--text-sm);font-weight:500;margin-bottom:var(--space-5);animation:fadeIn .2s ease}
        .fe-alert.err{background:rgba(161,44,123,.08);border:1px solid rgba(161,44,123,.25);color:#a12c7b}
        .fe-alert.ok{background:rgba(67,122,34,.08);border:1px solid rgba(67,122,34,.25);color:#437a22}
        .fe-section{background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-xl);padding:var(--space-6);margin-bottom:var(--space-6)}
        .fe-add-types{display:flex;gap:var(--space-3);flex-wrap:wrap}
        .fe-add-btn{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-4);border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-surface-offset);font-size:var(--text-sm);font-weight:600;cursor:pointer;color:var(--color-text);transition:background .15s,border-color .15s}
        .fe-add-btn:hover:not(:disabled){background:var(--color-surface-dynamic);border-color:var(--color-primary)}
        .fe-add-btn:disabled{opacity:.4;cursor:not-allowed}
      `}</style>

      <div className="fe-page">
        {/* ── Header ── */}
        <div style={{ display:"flex", alignItems:"center", gap:"var(--space-4)", marginBottom:"var(--space-6)", flexWrap:"wrap" }}>
          <button className="fe-btn" onClick={() => router.push("/admin/stories")}
            style={{ gap:"var(--space-2)", display:"flex", alignItems:"center", padding:"var(--space-2) var(--space-3)" }}>
            <ArrowLeft size={13}/> Relacje
          </button>
          <div style={{ flex:1 }}>
            <h1 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)", letterSpacing:"-0.03em" }}>
              {story?.title}
            </h1>
            <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginTop:2 }}>
              {frames.length} klatek
              {dirtyCount > 0 && (
                <span style={{ color:"var(--color-warning)", marginLeft:"var(--space-2)" }}>
                  · {dirtyCount} niezapisanych zmian
                </span>
              )}
            </p>
          </div>
          <div style={{ display:"flex", gap:"var(--space-2)" }}>
            <button className="fe-btn ghost"
              disabled={!previewData || frames.length === 0}
              onClick={() => setPreview(true)}
              title={frames.length === 0 ? "Dodaj klatki aby zobaczyć podgląd" : "Podgląd relacji"}>
              <Play size={14}/> Podgląd
            </button>
            <button className="fe-btn primary" onClick={saveAll} disabled={saving}>
              {saving
                ? <><Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/> Zapisywanie…</>
                : <><Save size={14}/> Zapisz wszystko</>
              }
            </button>
          </div>
        </div>

        {/* Alerty */}
        {error && (
          <div className="fe-alert err">
            <AlertCircle size={15} style={{ flexShrink:0 }}/>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"inherit" }}>✕</button>
          </div>
        )}
        {saved && <div className="fe-alert ok">✓ Zapisano wszystkie zmiany!</div>}

        {/* ── Ustawienia relacji ── */}
        <div className="fe-section">
          <p style={{ fontWeight:700, fontSize:"var(--text-sm)", color:"var(--color-text-muted)", marginBottom:"var(--space-5)" }}>
            Ustawienia relacji
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"var(--space-4)", marginBottom:"var(--space-4)" }}>
            <div>
              <label className="fe-label">Tytuł *</label>
              <input className="fe-input" value={meta.title}
                onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}/>
            </div>
            <div>
              <label className="fe-label">Podtytuł</label>
              <input className="fe-input" placeholder="np. NATO Days 2025"
                value={meta.subtitle}
                onChange={e => setMeta(m => ({ ...m, subtitle: e.target.value }))}/>
            </div>
            <div>
              <label className="fe-label">Cover Image</label>
              <div style={{ display:"flex", gap:"var(--space-2)" }}>
                <input className="fe-input" placeholder="https://… lub wybierz z biblioteki"
                  value={meta.cover_image}
                  onChange={e => setMeta(m => ({ ...m, cover_image: e.target.value }))}/>
                <PickBtn onClick={() => setPickerTarget("cover")}/>
              </div>
            </div>
          </div>

          {/* Podgląd covera */}
          {meta.cover_image && (
            <div style={{ borderRadius:"var(--radius-lg)", overflow:"hidden", height:120, background:"var(--color-surface-offset)", marginBottom:"var(--space-4)", border:"1px solid var(--color-border)", position:"relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={meta.cover_image} alt="Cover"
                style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
              <button
                onClick={() => setMeta(m => ({ ...m, cover_image: "" }))}
                title="Usuń cover"
                style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,.6)", border:"none", borderRadius:"50%", width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", fontSize:14, lineHeight:1 }}
              >×</button>
            </div>
          )}

          {/* Kolor + publikacja */}
          <div style={{ display:"flex", gap:"var(--space-6)", alignItems:"center", flexWrap:"wrap" }}>
            <div>
              <label className="fe-label">Kolor akcentu</label>
              <div style={{ display:"flex", gap:"var(--space-2)", alignItems:"center" }}>
                <input type="color" value={meta.accent_color}
                  onChange={e => setMeta(m => ({ ...m, accent_color: e.target.value }))}
                  style={{ width:40, height:36, border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", padding:2, cursor:"pointer", background:"none" }}/>
                <input className="fe-input" value={meta.accent_color}
                  style={{ fontFamily:"monospace", fontSize:12, width:88 }}
                  onChange={e => setMeta(m => ({ ...m, accent_color: e.target.value }))}/>
              </div>
            </div>
            <div>
              <label className="fe-label">Status publikacji</label>
              <label style={{ display:"flex", alignItems:"center", gap:"var(--space-2)", cursor:"pointer", height:36 }}>
                <input type="checkbox" checked={meta.published}
                  onChange={e => setMeta(m => ({ ...m, published: e.target.checked }))}
                  style={{ width:16, height:16, accentColor:"var(--color-primary)", cursor:"pointer" }}/>
                <span style={{ fontSize:"var(--text-sm)", fontWeight:600, color: meta.published ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {meta.published ? "✓ Opublikowana — widoczna publicznie" : "Szkic — niewidoczna publicznie"}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Klatki ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)", marginBottom:"var(--space-6)" }}>
          {frames.length === 0 ? (
            <div style={{ padding:"var(--space-12)", textAlign:"center", border:"2px dashed var(--color-border)", borderRadius:"var(--radius-xl)", color:"var(--color-text-faint)" }}>
              <ImageIcon size={28} style={{ margin:"0 auto var(--space-3)", opacity:.3 }}/>
              <p style={{ fontSize:"var(--text-sm)" }}>Brak klatek — dodaj pierwszą poniżej.</p>
            </div>
          ) : frames.map((frame, i) => (
            <FrameEditor
              key={frame.id}
              frame={frame} idx={i} total={frames.length}
              onChange={updateFrame}
              onDelete={deleteFrame}
              onMove={moveFrame}
              onOpenPicker={frameId => setPickerTarget(`frame:${frameId}`)}
            />
          ))}
        </div>

        {/* ── Dodaj klatkę ── */}
        <div className="fe-section" style={{ marginBottom:0 }}>
          <p className="fe-label" style={{ marginBottom:"var(--space-3)" }}>Dodaj klatkę</p>
          <div className="fe-add-types">
            {FRAME_TYPES.map(t => (
              <button key={t.value} className="fe-add-btn" disabled={adding}
                onClick={() => addFrame(t.value)} title={t.desc}>
                {adding
                  ? <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/>
                  : t.icon
                }
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MediaPicker ── */}
      {pickerTarget && (
        <MediaPicker
          accept="image"
          title={pickerTarget === "cover" ? "Wybierz cover relacji" : "Wybierz zdjęcie klatki"}
          onSelect={handlePickerSelect}
          onClose={() => setPickerTarget(null)}
        />
      )}

      {/* ── StoryPlayer podgląd ── */}
      {preview && previewData && frames.length > 0 && (
        <StoryPlayer
          stories={[previewData]}
          initialIndex={0}
          onClose={() => setPreview(false)}
        />
      )}
    </>
  );
}