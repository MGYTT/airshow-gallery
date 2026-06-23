import HeroSection from "@/components/HeroSection";
import ShowCard from "@/components/ShowCard";
import StoriesBar from "@/components/stories/StoriesBar";
import { Plane, ArrowRight, Camera } from "lucide-react";
import Link from "next/link";

interface AirShow {
  id: string; name: string; location: string; date: string;
  year: number; description: string; coverImage: string;
  photoCount: number; tags: string[]; featured: boolean; published: boolean;
}

async function getShows(): Promise<AirShow[]> {
  const BASE    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  try {
    const res = await fetch(
      `${BASE}/rest/v1/air_shows?published=eq.true&order=year.desc,id.asc`,
      { headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }, next: { revalidate: 30 } }
    );
    if (!res.ok) return [];
    const data: Record<string, unknown>[] = await res.json();
    return data.map(s => ({
      id:          s.id          as string,
      name:        s.name        as string,
      location:    s.location    as string,
      date:        s.date        as string,
      year:        s.year        as number,
      description: (s.description as string) ?? "",
      coverImage:  (s.cover_image as string) ?? "",
      photoCount:  (s.photo_count as number) ?? 0,
      tags:        (s.tags        as string[]) ?? [],
      featured:    Boolean(s.featured),
      published:   Boolean(s.published),
    }));
  } catch (e) {
    console.error("getShows error:", e);
    return [];
  }
}

export default async function Home() {
  const airShows    = await getShows();
  const featured    = airShows.filter(s => s.featured);
  const rest        = airShows.filter(s => !s.featured);
  const totalPhotos = airShows.reduce((sum, s) => sum + s.photoCount, 0);

  return (
    <>
      <style>{`
        .section-cta-link{display:inline-flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);font-weight:700;color:var(--color-accent);text-decoration:none;letter-spacing:.04em;text-transform:uppercase;transition:gap .2s ease,opacity .2s ease}
        .section-cta-link:hover{gap:var(--space-3);opacity:.8}
        .timeline-row{display:flex;gap:var(--space-4);align-items:center;padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);transition:transform .2s ease}
        .timeline-row:hover{transform:translateX(4px)}

        /* ── Stories bar ── */
        .stories-section{padding:var(--space-6) 0 0}
        .stories-section .container{border-bottom:1px solid var(--color-divider);padding-bottom:var(--space-4)}
      `}</style>

      <HeroSection />

      {/* ═══ RELACJE ═══ */}
      <section className="stories-section">
        <div className="container">
          <StoriesBar />
        </div>
      </section>

      {/* ═══ POKAZY ═══ */}
      <section id="pokazy" style={{ padding:"clamp(var(--space-16),8vw,var(--space-32)) 0" }}>
        <div className="container">

          {/* Header */}
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"var(--space-12)", gap:"var(--space-6)", flexWrap:"wrap" }}>
            <div>
              <span className="badge" style={{ marginBottom:"var(--space-3)" }}>
                <Plane size={11}/> Wyróżnione pokazy
              </span>
              <h2 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-2xl)", letterSpacing:"-0.04em", lineHeight:1.05 }}>
                Najpiękniejsze<br/>
                <span style={{ color:"var(--color-accent)" }}>chwile w powietrzu</span>
              </h2>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"var(--space-4)" }}>
              <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)", maxWidth:300, textAlign:"right", lineHeight:1.6 }}>
                Wybrane relacje fotograficzne z największych eventów lotniczych
              </p>
              <Link href="/gallery" className="section-cta-link">
                Cała galeria <ArrowRight size={13}/>
              </Link>
            </div>
          </div>

          {/* Featured grid */}
          {featured.length > 0 ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(400px,100%),1fr))", gap:"var(--space-6)", marginBottom:"var(--space-20)" }}>
              {featured.map(show => <ShowCard key={show.id} show={show} featured/>)}
            </div>
          ) : (
            <p style={{ color:"var(--color-text-faint)", fontSize:"var(--text-sm)", marginBottom:"var(--space-20)" }}>
              Brak wyróżnionych pokazów.
            </p>
          )}

          {/* Divider + pozostałe */}
          {rest.length > 0 && (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:"var(--space-4)", marginBottom:"var(--space-10)" }}>
                <div style={{ flex:1, height:1, background:"linear-gradient(to right,var(--color-accent),var(--color-divider))" }}/>
                <span style={{ fontSize:"var(--text-xs)", fontWeight:700, textTransform:"uppercase", letterSpacing:".12em", color:"var(--color-text-faint)", whiteSpace:"nowrap" }}>
                  Pozostałe pokazy
                </span>
                <div style={{ flex:1, height:1, background:"var(--color-divider)" }}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(300px,100%),1fr))", gap:"var(--space-6)" }}>
                {rest.map(show => <ShowCard key={show.id} show={show}/>)}
              </div>
            </>
          )}

          {/* Bottom CTA */}
          <div style={{ marginTop:"var(--space-12)", paddingTop:"var(--space-10)", borderTop:"1px solid var(--color-divider)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"var(--space-4)" }}>
            <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)" }}>
              Łącznie <strong style={{ color:"var(--color-text)" }}>{totalPhotos}</strong> zdjęć
              z <strong style={{ color:"var(--color-text)" }}>{airShows.length}</strong> pokazów
            </p>
            <Link href="/gallery" className="btn btn-primary">
              <Camera size={15}/> Przeglądaj wszystkie zdjęcia <ArrowRight size={15}/>
            </Link>
          </div>

        </div>
      </section>

      {/* ═══ O MNIE ═══ */}
      <section id="o-mnie" style={{ padding:"clamp(var(--space-16),8vw,var(--space-32)) 0", background:"var(--color-surface)", borderTop:"1px solid var(--color-divider)", borderBottom:"1px solid var(--color-divider)", position:"relative", overflow:"hidden" }}>
        <div aria-hidden="true" style={{ position:"absolute", right:"-2%", bottom:"-10%", fontFamily:"var(--font-display)", fontWeight:900, fontSize:"clamp(8rem,22vw,22rem)", lineHeight:1, color:"var(--color-text)", opacity:.025, userSelect:"none", pointerEvents:"none", letterSpacing:"-0.06em" }}>NT</div>
        <div className="container--narrow" style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"grid", gridTemplateColumns:"3px 1fr", gap:"var(--space-8)", alignItems:"start" }}>
            <div style={{ width:3, background:"linear-gradient(to bottom,var(--color-accent),transparent)", borderRadius:"var(--radius-full)", alignSelf:"stretch" }}/>
            <div>
              <span className="badge" style={{ marginBottom:"var(--space-5)" }}>O mnie</span>
              <h2 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-2xl)", letterSpacing:"-0.04em", lineHeight:1.05, marginBottom:"var(--space-8)" }}>
                Pasja do nieba<br/>
                <span style={{ color:"var(--color-accent)" }}>od zawsze.</span>
              </h2>
              <p style={{ fontSize:"var(--text-base)", color:"var(--color-text-muted)", lineHeight:1.8, marginBottom:"var(--space-5)" }}>
                Wychowałem się w okolicach <strong style={{ color:"var(--color-text)" }}>Nowego Targu</strong> — i już jako dziecko trafiłem na pierwsze <strong style={{ color:"var(--color-text)" }}>Pikniki Lotnicze na Aeroklubie Nowy Targ</strong>. To tam zrodziła się miłość do lotnictwa. Ryk silników, zapach paliwa i maszyny sunące przez podhalańskie niebo — to coś, czego nie da się zapomnieć.
              </p>
              <p style={{ fontSize:"var(--text-base)", color:"var(--color-text-muted)", lineHeight:1.8, marginBottom:"var(--space-8)" }}>
                W 2025 roku spełniłem marzenie i pojechałem na <strong style={{ color:"var(--color-accent)" }}>NATO Days w Ostrawie</strong> — jeden z największych pokazów militarnych w Europie Środkowej. Aparat nigdy nie opuszcza mojej torby. Ta strona to mój prywatny album — wspomnienia, które chcę zachować i podzielić się nimi z innymi miłośnikami lotnictwa.
              </p>
              <p style={{ fontSize:"var(--text-xs)", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color:"var(--color-text-faint)", marginBottom:"var(--space-3)" }}>Kluczowe momenty</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-3)" }}>
                {[
                  { year:"dzieciństwo", event:"Pierwsze Pikniki Lotnicze — Aeroklub Nowy Targ", accent:false },
                  { year:"2025",        event:"NATO Days — Ostrava, Czechy",                     accent:true  },
                ].map(({ year, event, accent }) => (
                  <div key={year} className="timeline-row" style={{ border:`1px solid ${accent?"var(--color-accent)":"var(--color-border)"}`, background:accent?"var(--color-accent-subtle)":"var(--color-surface-offset)" }}>
                    <span style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xs)", color:accent?"var(--color-accent)":"var(--color-text-faint)", letterSpacing:".04em", textTransform:"uppercase", minWidth:90, flexShrink:0 }}>{year}</span>
                    <span style={{ width:1, height:20, background:accent?"var(--color-accent)":"var(--color-divider)", flexShrink:0 }}/>
                    <span style={{ fontSize:"var(--text-sm)", fontWeight:500, color:accent?"var(--color-text)":"var(--color-text-muted)" }}>{event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}