"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, GripVertical,
  Save, Loader2, Image as ImageIcon,
  Type, BarChart2, Lightbulb, ChevronDown, ChevronUp, AlertCircle,
} from "lucide-react";
import type { FrameType } from "@/lib/supabase/types";

// ── Typy lokalne ─────────────────────────────────────────────
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
  _dirty?:  boolean;
  _saving?: boolean;
}

interface Story {
  id: string; title: string; subtitle: string | null;
  accent_color: string; published: boolean;
  story_frames: Frame[];
}

const FRAME_TYPES: { value: FrameType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "photo",  label: "Zdjęcie",     icon: <ImageIcon size={14}/>,  desc: "Zdjęcie z podpisem i nazwą samolotu" },
  { value: "burst",  label: "Seria",       icon: <ImageIcon size={14}/>,  desc: "Seria zdjęć — jak zdjęcie, ale oznaczona jako burst" },
  { value: "text",   label: "Tekst",       icon: <Type size={14}/>,       desc: "Duży cytat lub nagłówek na ciemnym tle" },
  { value: "stat",   label: "Statystyka",  icon: <BarChart2 size={14}/>,  desc: "Wielka liczba z opisem (np. 47 samolotów)" },
  { value: "fact",   label: "Ciekawostka", icon: <Lightbulb size={14}/>,  desc: "Ciekawy fakt w stylu cytatu" },
];

function FrameTypeIcon({ type }: { type: FrameType }) {
  return FRAME_TYPES.find(t => t.value === type)?.icon ?? <ImageIcon size={14}/>;
}

// ── Pojedyncza klatka — edytor ────────────────────────────────
function FrameEditor({
  frame, idx, total, onChange, onDelete, onMove,
}: {
  frame:    Frame;
  idx:      number;
  total:    number;
  onChange: (id: string, patch: Partial<Frame>) => void;
  onDelete: (id: string) => void;
  onMove:   (id: string, dir: -1 | 1) => void;
}) {
  const [open, setOpen] = useState(true);
  const f = (field: keyof Frame) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(frame.id, { [field]: e.target.value || null } as Partial<Frame>);

  return (
    <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", background: "var(--color-surface)", overflow: "hidden" }}>
      {/* Nagłówek klatki */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3) var(--space-4)", background: "var(--color-surface-offset)", cursor: "pointer", userSelect: "none" }}
        onClick={() => setOpen(o => !o)}
      >
        <GripVertical size={15} style={{ color: "var(--color-text-faint)", flexShrink: 0, cursor: "grab" }}/>
        <div style={{ width: 22, height: 22, borderRadius: "var(--radius-sm)", background: "var(--color-surface-dynamic)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
          <FrameTypeIcon type={frame.type}/>
        </div>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", minWidth: 24 }}>#{idx + 1}</span>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {frame.caption || frame.fact_text || frame.stat_value || `Klatka ${idx + 1}`}
        </span>
        {frame._dirty && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-warning)", background: "var(--color-warning-highlight)", padding: "1px 6px", borderRadius: 99, flexShrink: 0 }}>
            niezapisane
          </span>
        )}
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button className="fe-btn" disabled={idx === 0}         onClick={() => onMove(frame.id, -1)} title="W górę"><ChevronUp size={12}/></button>
          <button className="fe-btn" disabled={idx === total - 1} onClick={() => onMove(frame.id,  1)} title="W dół"><ChevronDown size={12}/></button>
          <button className="fe-btn danger" onClick={() => onDelete(frame.id)} title="Usuń"><Trash2 size={12}/></button>
        </div>
        {open
          ? <ChevronUp size={14} style={{ flexShrink: 0, color: "var(--color-text-faint)" }}/>
          : <ChevronDown size={14} style={{ flexShrink: 0, color: "var(--color-text-faint)" }}/>
        }
      </div>

      {open && (
        <div style={{ padding: "var(--space-5)", display: "grid", gap: "var(--space-4)" }}>
          {/* Typ + czas trwania */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)" }}>
            <div>
              <label className="fe-label">Typ klatki</label>
              <select className="fe-input" value={frame.type} onChange={e => onChange(frame.id, { type: e.target.value as FrameType })}>
                {FRAME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="fe-label">Czas trwania (s)</label>
              <input className="fe-input" type="number" min={2} max={30} value={frame.duration}
                onChange={e => onChange(frame.id, { duration: Number(e.target.value) })}/>
            </div>
            <div>
              <label className="fe-label">Znacznik czasu</label>
              <input className="fe-input" placeholder="np. 10:23, Start, Dzień 2"
                value={frame.timestamp_label ?? ""} onChange={f("timestamp_label")}/>
            </div>
          </div>

          {/* URL zdjęcia */}
          {(frame.type === "photo" || frame.type === "burst" || frame.type === "stat") && (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-3)" }}>
              <div>
                <label className="fe-label">URL zdjęcia</label>
                <input className="fe-input" placeholder="https://…" value={frame.image_src ?? ""} onChange={f("image_src")}/>
              </div>
              <div>
                <label className="fe-label">Alt tekst</label>
                <input className="fe-input" placeholder="Opis zdjęcia" value={frame.image_alt ?? ""} onChange={f("image_alt")}/>
              </div>
            </div>
          )}

          {/* Podgląd zdjęcia */}
          {frame.image_src && (
            <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", maxHeight: 160, background: "var(--color-surface-offset)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frame.image_src} alt="" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}/>
            </div>
          )}

          {/* Samolot */}
          {(frame.type === "photo" || frame.type === "burst") && (
            <div>
              <label className="fe-label">Samolot / obiekt</label>
              <input className="fe-input" placeholder="np. F-16 Block 52+" value={frame.aircraft ?? ""} onChange={f("aircraft")}/>
            </div>
          )}

          {/* Główna treść */}
          <div>
            <label className="fe-label">
              {frame.type === "stat" ? "Wartość statystyki *" :
               frame.type === "fact" ? "Treść ciekawostki *" : "Podpis / caption"}
            </label>
            {frame.type === "fact" ? (
              <textarea className="fe-input" rows={3} placeholder="Ciekawy fakt…"
                value={frame.fact_text ?? ""}
                onChange={e => onChange(frame.id, { fact_text: e.target.value || null })}
                style={{ resize: "vertical" }}/>
            ) : frame.type === "stat" ? (
              <input className="fe-input" placeholder="np. 47" value={frame.stat_value ?? ""} onChange={f("stat_value")}/>
            ) : (
              <textarea className="fe-input" rows={2} placeholder="Podpis klatki…"
                value={frame.caption ?? ""}
                onChange={e => onChange(frame.id, { caption: e.target.value || null })}
                style={{ resize: "vertical" }}/>
            )}
          </div>

          {/* Etykieta statystyki */}
          {frame.type === "stat" && (
            <div>
              <label className="fe-label">Etykieta statystyki</label>
              <input className="fe-input" placeholder="np. samolotów w pokazie" value={frame.stat_label ?? ""} onChange={f("stat_label")}/>
            </div>
          )}

          {/* Podpis dodatkowy */}
          {frame.type !== "stat" && (
            <div>
              <label className="fe-label">Podpis dodatkowy (subcaption)</label>
              <input className="fe-input" placeholder="Dodatkowy opis…" value={frame.subcaption ?? ""} onChange={f("subcaption")}/>
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
  const router = useRouter();

  const [story,   setStory]   = useState<Story | null>(null);
  const [frames,  setFrames]  = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [adding,  setAdding]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [saved,   setSaved]   = useState(false);
  const [meta, setMeta] = useState({
    title: "", subtitle: "", accent_color: "#cc1f1f", published: false,
  });

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/stories/${id}`);
    if (!res.ok) {
      router.push("/admin/stories");
      return;
    }
    const data: Story = await res.json();
    setStory(data);
    setMeta({ title: data.title, subtitle: data.subtitle ?? "", accent_color: data.accent_color, published: data.published });
    setFrames((data.story_frames ?? []).sort((a, b) => a.sort_order - b.sort_order));
    setLoading(false);
  }

  function updateFrame(fid: string, patch: Partial<Frame>) {
    setFrames(prev => prev.map(f => f.id === fid ? { ...f, ...patch, _dirty: true } : f));
  }

  function moveFrame(fid: string, dir: -1 | 1) {
    setFrames(prev => {
      const arr = [...prev];
      const i   = arr.findIndex(f => f.id === fid);
      const j   = i + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr.map((f, idx) => ({ ...f, sort_order: idx, _dirty: true }));
    });
  }

  async function deleteFrame(fid: string) {
    if (!confirm("Usunąć klatkę?")) return;
    const res = await fetch(`/api/story-frames/${fid}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Nie udało się usunąć klatki");
      return;
    }
    setFrames(prev => prev.filter(f => f.id !== fid));
  }

  async function addFrame(type: FrameType) {
    setAdding(true);
    setError(null);
    const res = await fetch("/api/story-frames", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        story_id:   id,
        type,
        sort_order: frames.length,
        duration:   5,
      }),
    });
    if (res.ok) {
      const [created] = await res.json();
      setFrames(prev => [...prev, { ...created, _dirty: false }]);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? `Błąd ${res.status} — sprawdź czy jesteś zalogowany`);
    }
    setAdding(false);
  }

  async function saveAll() {
    setSaving(true);
    setError(null);
    setSaved(false);

    // 1. Meta relacji
    const metaRes = await fetch(`/api/stories/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        title:        meta.title,
        subtitle:     meta.subtitle || null,
        accent_color: meta.accent_color,
        published:    meta.published,
      }),
    });

    if (!metaRes.ok) {
      const body = await metaRes.json().catch(() => ({}));
      setError(body.error ?? `Błąd ${metaRes.status} przy zapisie relacji`);
      setSaving(false);
      return;
    }

    // 2. Zmienione klatki (równolegle)
    const dirty = frames.filter(f => f._dirty);
    const results = await Promise.all(dirty.map(f =>
      fetch(`/api/story-frames/${f.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          type:            f.type,
          image_src:       f.image_src,
          image_alt:       f.image_alt,
          caption:         f.caption,
          subcaption:      f.subcaption,
          aircraft:        f.aircraft,
          timestamp_label: f.timestamp_label,
          stat_value:      f.stat_value,
          stat_label:      f.stat_label,
          fact_text:       f.fact_text,
          sort_order:      f.sort_order,
          duration:        f.duration,
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

  const dirtyCount = frames.filter(f => f._dirty).length;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--color-text-faint)" }}/>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
        .fe-label { font-size:var(--text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--color-text-faint); margin-bottom:var(--space-1); display:block }
        .fe-input { width:100%; padding:var(--space-2) var(--space-3); border-radius:var(--radius-md); border:1px solid var(--color-border); background:var(--color-surface-offset); font-size:var(--text-sm); color:var(--color-text); outline:none; transition:border-color .15s,box-shadow .15s }
        .fe-input:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px oklch(from var(--color-primary) l c h / .15) }
        .fe-btn { display:inline-flex; align-items:center; justify-content:center; padding:var(--space-1) var(--space-2); border-radius:var(--radius-sm); border:1px solid var(--color-border); background:var(--color-surface); color:var(--color-text); font-size:var(--text-xs); cursor:pointer; transition:background .15s }
        .fe-btn:disabled { opacity:.35; cursor:not-allowed }
        .fe-btn:hover:not(:disabled) { background:var(--color-surface-offset) }
        .fe-btn.danger:hover:not(:disabled) { background:var(--color-error-highlight); color:var(--color-error); border-color:var(--color-error) }
        .fe-btn.primary { background:var(--color-primary); color:#fff; border-color:transparent; padding:var(--space-2) var(--space-4); font-weight:600; gap:var(--space-2) }
        .fe-btn.primary:hover:not(:disabled) { background:var(--color-primary-hover) }
        .fe-page { max-width:var(--content-default); margin:0 auto; padding:var(--space-8) }
        @media(max-width:640px) { .fe-page { padding:var(--space-5) } }
        .fe-alert { display:flex; align-items:center; gap:var(--space-3); padding:var(--space-3) var(--space-4); border-radius:var(--radius-lg); font-size:var(--text-sm); font-weight:500; margin-bottom:var(--space-5); animation:slideDown .2s ease }
        .fe-alert.error { background:rgba(161,44,123,.08); border:1px solid rgba(161,44,123,.25); color:#a12c7b }
        .fe-alert.success { background:rgba(67,122,34,.08); border:1px solid rgba(67,122,34,.25); color:#437a22 }
      `}</style>

      <div className="fe-page">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
          <button className="fe-btn" onClick={() => router.push("/admin/stories")} style={{ gap: "var(--space-2)", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={14}/> Relacje
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-xl)", letterSpacing: "-0.03em" }}>
              {story?.title}
            </h1>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginTop: 2 }}>
              {frames.length} klatek
              {dirtyCount > 0 && (
                <span style={{ color: "var(--color-warning)", marginLeft: "var(--space-2)" }}>· {dirtyCount} niezapisanych</span>
              )}
            </p>
          </div>
          <button className="fe-btn primary" onClick={saveAll} disabled={saving}>
            {saving
              ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }}/> Zapisywanie…</>
              : <><Save size={14}/> Zapisz wszystko</>
            }
          </button>
        </div>

        {/* Alerty */}
        {error && (
          <div className="fe-alert error">
            <AlertCircle size={16} style={{ flexShrink: 0 }}/>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex" }}>✕</button>
          </div>
        )}
        {saved && (
          <div className="fe-alert success">
            <span>✓</span>
            <span>Zapisano wszystkie zmiany!</span>
          </div>
        )}

        {/* Meta relacji */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
          <p className="fe-label" style={{ marginBottom: "var(--space-4)" }}>Ustawienia relacji</p>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr auto auto", gap: "var(--space-4)", alignItems: "end" }}>
            <div>
              <label className="fe-label">Tytuł *</label>
              <input className="fe-input" value={meta.title}
                onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}/>
            </div>
            <div>
              <label className="fe-label">Podtytuł</label>
              <input className="fe-input" value={meta.subtitle}
                onChange={e => setMeta(m => ({ ...m, subtitle: e.target.value }))}/>
            </div>
            <div>
              <label className="fe-label">Kolor akcentu</label>
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                <input type="color" value={meta.accent_color}
                  onChange={e => setMeta(m => ({ ...m, accent_color: e.target.value }))}
                  style={{ width: 40, height: 38, border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 2, cursor: "pointer", background: "none" }}/>
                <input className="fe-input" value={meta.accent_color}
                  style={{ fontFamily: "monospace", fontSize: 12, width: 90 }}
                  onChange={e => setMeta(m => ({ ...m, accent_color: e.target.value }))}/>
              </div>
            </div>
            <div>
              <label className="fe-label">Status</label>
              <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", height: 38 }}>
                <input type="checkbox" checked={meta.published}
                  onChange={e => setMeta(m => ({ ...m, published: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: "pointer" }}/>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>Opublikowana</span>
              </label>
            </div>
          </div>
        </div>

        {/* Klatki */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          {frames.map((frame, i) => (
            <FrameEditor
              key={frame.id}
              frame={frame}
              idx={i}
              total={frames.length}
              onChange={updateFrame}
              onDelete={deleteFrame}
              onMove={moveFrame}
            />
          ))}
          {frames.length === 0 && (
            <div style={{ padding: "var(--space-12)", textAlign: "center", border: "2px dashed var(--color-border)", borderRadius: "var(--radius-xl)", color: "var(--color-text-faint)" }}>
              <ImageIcon size={32} style={{ margin: "0 auto var(--space-3)", opacity: .3 }}/>
              <p style={{ fontSize: "var(--text-sm)" }}>Brak klatek. Dodaj pierwszą poniżej.</p>
            </div>
          )}
        </div>

        {/* Dodaj klatkę */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "var(--space-5)" }}>
          <p className="fe-label" style={{ marginBottom: "var(--space-3)" }}>Dodaj klatkę</p>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            {FRAME_TYPES.map(t => (
              <button
                key={t.value}
                className="fe-btn"
                onClick={() => addFrame(t.value)}
                disabled={adding}
                style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-4)" }}
                title={t.desc}
              >
                {adding ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }}/> : t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}