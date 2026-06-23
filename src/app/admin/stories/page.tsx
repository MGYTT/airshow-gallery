"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, Eye, EyeOff,
  Loader2, AlertCircle, Play, Images, GripVertical,
} from "lucide-react";
import StoryPlayer from "@/components/stories/StoryPlayer";
import { mapStory } from "@/lib/supabase/types";
import type { DbStory, MappedStory } from "@/lib/supabase/types";

interface AirShow { id: string; name: string; year: number; }

export default function AdminStoriesPage() {
  const [stories,  setStories]  = useState<DbStory[]>([]);
  const [shows,    setShows]    = useState<AirShow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);
  const [preview,  setPreview]  = useState<MappedStory | null>(null);

  const [form, setForm] = useState({
    show_id: "", title: "", subtitle: "", accent_color: "#cc1f1f",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [sr, sr2] = await Promise.all([
        fetch("/api/stories?all=true", { credentials: "include" }),
        fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/air_shows?select=id,name,year&order=year.desc`,
          { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` } }
        ),
      ]);
      if (!sr.ok) {
        const b = await sr.json().catch(() => ({}));
        throw new Error(b.error ?? `Błąd ${sr.status} — upewnij się że jesteś zalogowany`);
      }
      setStories(await sr.json());
      if (sr2.ok) setShows(await sr2.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(story: DbStory) {
    setToggling(story.id);
    setError(null);
    const res = await fetch(`/api/stories/${story.id}`, {
      method:      "PATCH",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({ published: !story.published }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Nie udało się zmienić statusu");
    } else {
      const updated = !story.published;
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, published: updated } : s));
      flash(updated ? "✓ Relacja opublikowana!" : "✓ Cofnięto do szkicu");
    }
    setToggling(null);
  }

  async function deleteStory(id: string) {
    if (!confirm("Usunąć relację wraz ze wszystkimi klatkami?")) return;
    setDeleting(id);
    const res = await fetch(`/api/stories/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Nie udało się usunąć");
    } else {
      setStories(prev => prev.filter(s => s.id !== id));
    }
    setDeleting(null);
  }

  async function createStory(e: React.FormEvent) {
    e.preventDefault();
    if (!form.show_id || !form.title.trim()) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/stories", {
      method:      "POST",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({
        show_id:      form.show_id,
        title:        form.title.trim(),
        subtitle:     form.subtitle.trim() || null,
        accent_color: form.accent_color,
        published:    false,
      }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? `Błąd ${res.status}`);
    } else {
      setForm({ show_id: "", title: "", subtitle: "", accent_color: "#cc1f1f" });
      flash("✓ Relacja utworzona! Kliknij ołówek aby dodać klatki.");
      await load();
    }
    setCreating(false);
  }

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  }

  const showName = (id: string) => shows.find(s => s.id === id)?.name ?? "—";

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .as-page{padding:var(--space-8);max-width:var(--content-wide);margin:0 auto}
        .as-label{font-size:var(--text-xs);font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--color-text-faint);margin-bottom:var(--space-1);display:block}
        .as-input{width:100%;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-surface-offset);font-size:var(--text-sm);color:var(--color-text);outline:none;transition:border-color .15s,box-shadow .15s}
        .as-input:focus{border-color:var(--color-primary);box-shadow:0 0 0 3px oklch(from var(--color-primary) l c h / .12)}
        .as-btn{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);font-size:var(--text-xs);font-weight:600;border:1px solid var(--color-border);cursor:pointer;background:var(--color-surface);color:var(--color-text);transition:background .15s,color .15s,border-color .15s;white-space:nowrap;text-decoration:none}
        .as-btn:hover{background:var(--color-surface-offset)}
        .as-btn:disabled{opacity:.45;cursor:not-allowed}
        .as-btn.primary{background:var(--color-primary);color:#fff;border-color:transparent}
        .as-btn.primary:hover:not(:disabled){background:var(--color-primary-hover)}
        .as-btn.danger:hover{background:rgba(161,44,123,.1);color:#a12c7b;border-color:#a12c7b}
        .as-btn.pub-on{background:rgba(67,122,34,.1);color:#437a22;border-color:rgba(67,122,34,.3)}
        .as-btn.pub-on:hover{background:rgba(67,122,34,.2)}
        .as-btn.icon{padding:var(--space-2);width:32px;height:32px;justify-content:center}
        .as-card{background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-xl);overflow:hidden;margin-top:var(--space-6)}
        .as-form{padding:var(--space-5) var(--space-6);border-bottom:1px solid var(--color-divider);display:grid;grid-template-columns:1.2fr 2fr 1.5fr auto auto;gap:var(--space-3);align-items:end}
        @media(max-width:900px){.as-form{grid-template-columns:1fr 1fr}}
        @media(max-width:560px){.as-form{grid-template-columns:1fr}}
        .as-thead{display:grid;grid-template-columns:28px 44px 1fr 140px 56px 56px 90px 110px;gap:var(--space-3);padding:var(--space-2) var(--space-5);border-bottom:2px solid var(--color-divider)}
        .as-row{display:grid;grid-template-columns:28px 44px 1fr 140px 56px 56px 90px 110px;gap:var(--space-3);align-items:center;padding:var(--space-3) var(--space-5);border-bottom:1px solid var(--color-divider);transition:background .12s}
        .as-row:last-child{border-bottom:none}
        .as-row:hover{background:var(--color-surface-offset)}
        @media(max-width:1000px){.as-thead{display:none}.as-row{grid-template-columns:44px 1fr auto}}
        .as-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
        .as-badge.pub{background:rgba(67,122,34,.12);color:#437a22}
        .as-badge.draft{background:var(--color-surface-offset);color:var(--color-text-faint);border:1px solid var(--color-border)}
        .as-cover{width:40px;height:40px;border-radius:var(--radius-md);object-fit:cover;border:1px solid var(--color-border);flex-shrink:0}
        .as-cover-ph{width:40px;height:40px;border-radius:var(--radius-md);background:var(--color-surface-offset);border:1px solid var(--color-border);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px}
        .as-actions{display:flex;gap:4px;align-items:center}
        .as-alert{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);font-size:var(--text-sm);font-weight:500;margin-bottom:var(--space-5);animation:fadeIn .2s ease}
        .as-alert.err{background:rgba(161,44,123,.08);border:1px solid rgba(161,44,123,.25);color:#a12c7b}
        .as-alert.ok{background:rgba(67,122,34,.08);border:1px solid rgba(67,122,34,.25);color:#437a22}
        .as-empty{padding:var(--space-16);text-align:center;color:var(--color-text-faint);font-size:var(--text-sm)}
        .as-accent{width:10px;height:10px;border-radius:50%;flex-shrink:0;border:1px solid rgba(0,0,0,.08)}
      `}</style>

      <div className="as-page">
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"var(--space-4)", marginBottom:"var(--space-2)" }}>
          <div>
            <h1 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)", letterSpacing:"-0.03em" }}>Relacje</h1>
            <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)", marginTop:"var(--space-1)" }}>
              {stories.length} relacji · {stories.filter(s => s.published).length} opublikowanych
            </p>
          </div>
          <Link href="/admin" className="as-btn">← Panel admina</Link>
        </div>

        {/* Alerty */}
        {error && (
          <div className="as-alert err">
            <AlertCircle size={15} style={{ flexShrink:0 }}/>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"inherit" }}>✕</button>
          </div>
        )}
        {success && <div className="as-alert ok">{success}</div>}

        <div className="as-card">
          {/* Formularz nowej relacji */}
          <form className="as-form" onSubmit={createStory}>
            <div>
              <label className="as-label">Pokaz *</label>
              <select className="as-input" value={form.show_id}
                onChange={e => setForm(f => ({ ...f, show_id: e.target.value }))} required>
                <option value="">Wybierz…</option>
                {shows.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
              </select>
            </div>
            <div>
              <label className="as-label">Tytuł relacji *</label>
              <input className="as-input" placeholder="np. Dzień 1 — przeloty"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required/>
            </div>
            <div>
              <label className="as-label">Podtytuł</label>
              <input className="as-input" placeholder="np. NATO Days 2025"
                value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}/>
            </div>
            <div>
              <label className="as-label">Kolor</label>
              <input type="color" value={form.accent_color}
                onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))}
                style={{ width:42, height:38, border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", padding:2, cursor:"pointer", background:"none" }}/>
            </div>
            <div style={{ paddingTop:20 }}>
              <button type="submit" className="as-btn primary" disabled={creating || !form.show_id || !form.title.trim()}>
                {creating ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> Tworzenie…</> : <><Plus size={13}/> Utwórz</>}
              </button>
            </div>
          </form>

          {/* Nagłówki tabeli */}
          <div className="as-thead">
            {["", "Cover", "Tytuł", "Pokaz", "Klatki", "Odsł.", "Status", "Akcje"].map(h => (
              <span key={h} style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"var(--color-text-faint)" }}>{h}</span>
            ))}
          </div>

          {/* Zawartość */}
          {loading ? (
            <div className="as-empty"><Loader2 size={24} style={{ animation:"spin 1s linear infinite", margin:"0 auto" }}/></div>
          ) : stories.length === 0 ? (
            <div className="as-empty">
              <Images size={28} style={{ margin:"0 auto var(--space-3)", opacity:.3 }}/>
              <p>Brak relacji. Utwórz pierwszą powyżej.</p>
            </div>
          ) : stories.map(story => (
            <div key={story.id} className="as-row">
              {/* Grip */}
              <GripVertical size={15} style={{ color:"var(--color-text-faint)", cursor:"grab" }}/>

              {/* Cover */}
              {story.cover_image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={story.cover_image} alt="" className="as-cover"/>
                : <div className="as-cover-ph">✈</div>
              }

              {/* Tytuł */}
              <div style={{ minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                  <div className="as-accent" style={{ background:story.accent_color }}/>
                  <span style={{ fontWeight:700, fontSize:"var(--text-sm)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {story.title}
                  </span>
                </div>
                {story.subtitle && (
                  <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {story.subtitle}
                  </p>
                )}
              </div>

              {/* Pokaz */}
              <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {showName(story.show_id)}
              </p>

              {/* Klatki */}
              <p style={{ fontSize:"var(--text-sm)", fontWeight:700, fontVariantNumeric:"tabular-nums" }}>
                {story.story_frames?.length ?? 0}
              </p>

              {/* Odsłony */}
              <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)", fontVariantNumeric:"tabular-nums" }}>
                {story.views ?? 0}
              </p>

              {/* Status */}
              <span className={`as-badge ${story.published ? "pub" : "draft"}`}>
                {story.published ? <><Eye size={9}/> Pub.</> : <><EyeOff size={9}/> Szkic</>}
              </span>

              {/* Akcje */}
              <div className="as-actions">
                {/* Podgląd */}
                <button
                  className="as-btn icon"
                  title={story.story_frames?.length ? "Podgląd" : "Brak klatek"}
                  disabled={!story.story_frames?.length}
                  onClick={() => setPreview(mapStory(story))}
                >
                  <Play size={13}/>
                </button>

                {/* Edytuj klatki */}
                <Link href={`/admin/stories/${story.id}`} className="as-btn icon" title="Edytuj klatki">
                  <Pencil size={13}/>
                </Link>

                {/* Publikuj / cofnij */}
                <button
                  className={`as-btn icon ${story.published ? "" : "pub-on"}`}
                  title={story.published ? "Cofnij publikację" : "Opublikuj"}
                  disabled={toggling === story.id}
                  onClick={() => togglePublish(story)}
                >
                  {toggling === story.id
                    ? <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/>
                    : story.published ? <EyeOff size={13}/> : <Eye size={13}/>
                  }
                </button>

                {/* Usuń */}
                <button
                  className="as-btn icon danger"
                  title="Usuń relację"
                  disabled={deleting === story.id}
                  onClick={() => deleteStory(story.id)}
                >
                  {deleting === story.id
                    ? <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/>
                    : <Trash2 size={13}/>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* StoryPlayer podgląd */}
      {preview && (
        <StoryPlayer
          stories={[preview]}
          initialIndex={0}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}