"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, Eye, EyeOff,
  Images, GripVertical, Loader2,
} from "lucide-react";

interface Story {
  id:          string;
  show_id:     string;
  title:       string;
  subtitle:    string | null;
  cover_image: string | null;
  accent_color: string;
  published:   boolean;
  sort_order:  number;
  views:       number;
  created_at:  string;
  story_frames: { id: string }[];
}

interface AirShow { id: string; name: string; year: number; }

const ADMIN = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

export default function AdminStoriesPage() {
  const [stories,  setStories]  = useState<Story[]>([]);
  const [shows,    setShows]    = useState<AirShow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Nowa relacja — formularz
  const [form, setForm] = useState({
    show_id:      "",
    title:        "",
    subtitle:     "",
    accent_color: "#01696f",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [sr, sr2] = await Promise.all([
      fetch("/api/stories?all=true", { headers: { "x-admin-secret": ADMIN } }),
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/air_shows?select=id,name,year&order=year.desc`, {
        headers: {
          apikey:        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      }),
    ]);
    if (sr.ok)  setStories(await sr.json());
    if (sr2.ok) setShows(await sr2.json());
    setLoading(false);
  }

  async function togglePublish(story: Story) {
    await fetch(`/api/stories/${story.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN },
      body:    JSON.stringify({ published: !story.published }),
    });
    setStories(prev => prev.map(s =>
      s.id === story.id ? { ...s, published: !s.published } : s
    ));
  }

  async function deleteStory(id: string) {
    if (!confirm("Usunąć relację wraz ze wszystkimi klatkami?")) return;
    setDeleting(id);
    await fetch(`/api/stories/${id}`, {
      method:  "DELETE",
      headers: { "x-admin-secret": ADMIN },
    });
    setStories(prev => prev.filter(s => s.id !== id));
    setDeleting(null);
  }

  async function createStory(e: React.FormEvent) {
    e.preventDefault();
    if (!form.show_id || !form.title) return;
    setCreating(true);
    const res = await fetch("/api/stories", {
      method:  "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN },
      body:    JSON.stringify({
        show_id:      form.show_id,
        title:        form.title,
        subtitle:     form.subtitle || null,
        accent_color: form.accent_color,
        published:    false,
      }),
    });
    if (res.ok) {
      setForm({ show_id: "", title: "", subtitle: "", accent_color: "#01696f" });
      await load();
    }
    setCreating(false);
  }

  const showName = (id: string) =>
    shows.find(s => s.id === id)?.name ?? "—";

  return (
    <>
      <style>{`
        .as-page{padding:var(--space-8);max-width:var(--content-wide);margin:0 auto}
        .as-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-8);flex-wrap:wrap;gap:var(--space-4)}
        .as-card{background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-xl);overflow:hidden}
        .as-form{padding:var(--space-6);border-bottom:1px solid var(--color-divider);display:grid;grid-template-columns:1fr 1fr 1fr auto auto;gap:var(--space-3);align-items:end}
        @media(max-width:768px){.as-form{grid-template-columns:1fr}}
        .as-label{font-size:var(--text-xs);font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--color-text-faint);margin-bottom:var(--space-1);display:block}
        .as-input{width:100%;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-surface-offset);font-size:var(--text-sm);color:var(--color-text)}
        .as-input:focus{outline:2px solid var(--color-primary);border-color:transparent}
        .as-row{display:grid;grid-template-columns:40px 1fr 140px 80px 80px 100px 90px;gap:var(--space-3);align-items:center;padding:var(--space-4) var(--space-5);border-bottom:1px solid var(--color-divider);transition:background .15s}
        .as-row:last-child{border-bottom:none}
        .as-row:hover{background:var(--color-surface-offset)}
        @media(max-width:900px){.as-row{grid-template-columns:1fr auto;flex-wrap:wrap}}
        .as-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:.06em}
        .as-badge.pub{background:var(--color-success-highlight);color:var(--color-success)}
        .as-badge.draft{background:var(--color-surface-offset);color:var(--color-text-faint)}
        .as-btn{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);font-size:var(--text-xs);font-weight:600;border:1px solid var(--color-border);cursor:pointer;background:var(--color-surface);color:var(--color-text);transition:background .15s,color .15s}
        .as-btn:hover{background:var(--color-surface-offset)}
        .as-btn.danger:hover{background:var(--color-error-highlight);color:var(--color-error);border-color:var(--color-error)}
        .as-btn.primary{background:var(--color-primary);color:#fff;border-color:transparent}
        .as-btn.primary:hover{background:var(--color-primary-hover)}
        .as-empty{padding:var(--space-16);text-align:center;color:var(--color-text-faint);font-size:var(--text-sm)}
        .as-accent-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;border:1px solid rgba(0,0,0,.1)}
      `}</style>

      <div className="as-page">
        {/* Header */}
        <div className="as-header">
          <div>
            <h1 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)", letterSpacing:"-0.03em" }}>
              Relacje
            </h1>
            <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)", marginTop:"var(--space-1)" }}>
              {stories.length} relacji · {stories.filter(s => s.published).length} opublikowanych
            </p>
          </div>
          <Link href="/admin" className="as-btn">
            ← Panel admina
          </Link>
        </div>

        <div className="as-card">
          {/* Formularz tworzenia */}
          <form className="as-form" onSubmit={createStory}>
            <div>
              <label className="as-label">Pokaz *</label>
              <select
                className="as-input"
                value={form.show_id}
                onChange={e => setForm(f => ({ ...f, show_id: e.target.value }))}
                required
              >
                <option value="">Wybierz pokaz…</option>
                {shows.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="as-label">Tytuł relacji *</label>
              <input
                className="as-input"
                placeholder="np. Dzień 1 — przeloty"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="as-label">Podtytuł</label>
              <input
                className="as-input"
                placeholder="np. NATO Days 2025"
                value={form.subtitle}
                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
              />
            </div>
            <div>
              <label className="as-label">Kolor akcentu</label>
              <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                <input
                  type="color"
                  value={form.accent_color}
                  onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))}
                  style={{ width:40, height:36, border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", padding:2, cursor:"pointer", background:"none" }}
                />
                <input
                  className="as-input"
                  value={form.accent_color}
                  onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))}
                  style={{ fontFamily:"monospace", fontSize:12 }}
                />
              </div>
            </div>
            <div style={{ paddingTop:20 }}>
              <button type="submit" className="as-btn primary" disabled={creating}>
                {creating ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/> : <Plus size={14}/>}
                Utwórz
              </button>
            </div>
          </form>

          {/* Lista */}
          {loading ? (
            <div className="as-empty">
              <Loader2 size={24} style={{ animation:"spin 1s linear infinite", margin:"0 auto" }}/>
            </div>
          ) : stories.length === 0 ? (
            <div className="as-empty">
              <Images size={32} style={{ margin:"0 auto var(--space-3)", opacity:.3 }}/>
              <p>Brak relacji. Utwórz pierwszą powyżej.</p>
            </div>
          ) : (
            <div>
              {/* Nagłówek tabeli */}
              <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 140px 80px 80px 100px 90px", gap:"var(--space-3)", padding:"var(--space-2) var(--space-5)", borderBottom:"2px solid var(--color-divider)" }}>
                {["", "Tytuł", "Pokaz", "Klatki", "Odsłony", "Status", "Akcje"].map(h => (
                  <span key={h} style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"var(--color-text-faint)" }}>{h}</span>
                ))}
              </div>

              {stories.map(story => (
                <div key={story.id} className="as-row">
                  {/* Grip */}
                  <div style={{ color:"var(--color-text-faint)", cursor:"grab" }}>
                    <GripVertical size={16}/>
                  </div>

                  {/* Tytuł */}
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                      <div className="as-accent-dot" style={{ background:story.accent_color }}/>
                      <p style={{ fontWeight:700, fontSize:"var(--text-sm)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {story.title}
                      </p>
                    </div>
                    {story.subtitle && (
                      <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginTop:2 }}>
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
                  <p style={{ fontSize:"var(--text-sm)", fontVariantNumeric:"tabular-nums", color:"var(--color-text-muted)" }}>
                    {story.views}
                  </p>

                  {/* Status */}
                  <span className={`as-badge ${story.published ? "pub" : "draft"}`}>
                    {story.published ? <><Eye size={10}/> Pub.</> : <><EyeOff size={10}/> Szkic</>}
                  </span>

                  {/* Akcje */}
                  <div style={{ display:"flex", gap:"var(--space-1)" }}>
                    <Link
                      href={`/admin/stories/${story.id}`}
                      className="as-btn"
                      title="Edytuj klatki"
                      style={{ padding:"var(--space-2)" }}
                    >
                      <Pencil size={13}/>
                    </Link>
                    <button
                      className="as-btn"
                      onClick={() => togglePublish(story)}
                      title={story.published ? "Cofnij publikację" : "Opublikuj"}
                      style={{ padding:"var(--space-2)" }}
                    >
                      {story.published ? <EyeOff size={13}/> : <Eye size={13}/>}
                    </button>
                    <button
                      className="as-btn danger"
                      onClick={() => deleteStory(story.id)}
                      disabled={deleting === story.id}
                      title="Usuń"
                      style={{ padding:"var(--space-2)" }}
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
          )}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}