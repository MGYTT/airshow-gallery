import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Calendar, Images, ChevronLeft,
  Star, Tag, ArrowRight,
} from "lucide-react";
import PhotoGrid from "@/components/PhotoGrid";

// ── Typy ─────────────────────────────────────────────────────
interface AirShow {
  id: string; name: string; location: string; date: string;
  year: number; description: string; coverImage: string;
  photoCount: number; tags: string[]; featured: boolean;
}
interface Photo {
  id: string; showId: string; src: string; alt: string;
  aircraft: string; width: number; height: number;
  tags: string[]; featured: boolean;
}

// ── Supabase ──────────────────────────────────────────────────
const BASE    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SB      = { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` };

// React cache — jeden fetch współdzielony między generateMetadata i Page
const getShow = cache(async (id: string): Promise<AirShow | null> => {
  try {
    const res = await fetch(
      `${BASE}/rest/v1/air_shows?id=eq.${id}&published=eq.true&limit=1`,
      { headers: SB, next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data: Record<string, unknown>[] = await res.json();
    if (!data[0]) return null;
    const s = data[0];
    return {
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
    };
  } catch { return null; }
});

async function getPhotos(showId: string): Promise<Photo[]> {
  try {
    const res = await fetch(
      `${BASE}/rest/v1/photos?show_id=eq.${showId}&order=created_at.asc`,
      { headers: SB, next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data: Record<string, unknown>[] = await res.json();
    return data.map(p => ({
      id:       p.id      as string,
      showId:   p.show_id as string,
      src:      p.src     as string,
      alt:      (p.alt      as string) ?? "",
      aircraft: (p.aircraft as string) ?? "",
      width:    (p.width    as number) || 0,
      height:   (p.height   as number) || 0,
      tags:     (p.tags     as string[]) ?? [],
      featured: Boolean(p.featured),
    }));
  } catch { return []; }
}

// Pobiera inne pokazy (dla sekcji "Zobacz też")
async function getOtherShows(excludeId: string): Promise<AirShow[]> {
  try {
    const res = await fetch(
      `${BASE}/rest/v1/air_shows?published=eq.true&id=neq.${excludeId}&order=year.desc&limit=3`,
      { headers: SB, next: { revalidate: 60 } }
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
    }));
  } catch { return []; }
}

// ── generateStaticParams ──────────────────────────────────────
export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${BASE}/rest/v1/air_shows?published=eq.true&select=id`,
      { headers: SB }
    );
    const data: { id: string }[] = await res.json();
    return data.map(s => ({ id: s.id }));
  } catch { return []; }
}

// ── generateMetadata — SEO + Open Graph ──────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const show    = await getShow(id);

  // Jeśli nie ma pokazu — zwróć minimalne meta (notFound() woła Page)
  if (!show) {
    return { title: "Pokaz nie znaleziony" };
  }

  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
  const pageUrl   = `${siteUrl}/pokaz/${show.id}`;
  const ogImage   = show.coverImage || `${siteUrl}/og-default.jpg`;
  const desc      = show.description
    ? show.description.slice(0, 155)
    : `${show.photoCount} zdjęć z ${show.name} — ${show.location}, ${show.year}`;

  return {
    title:       `${show.name} ${show.year} — AirShow Gallery`,
    description: desc,
    keywords:    [...show.tags, show.location, String(show.year), "pokaz lotniczy", "airshow", "fotografia"],

    openGraph: {
      type:        "article",
      url:         pageUrl,
      title:       `${show.name} ${show.year}`,
      description: desc,
      images: [{
        url:    ogImage,
        width:  1200,
        height: 630,
        alt:    show.name,
      }],
      siteName: "AirShow Gallery",
    },

    twitter: {
      card:        "summary_large_image",
      title:       `${show.name} ${show.year}`,
      description: desc,
      images:      [ogImage],
    },

    alternates: {
      canonical: pageUrl,
    },
  };
}

// ── PAGE ─────────────────────────────────────────────────────
export default async function ShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch równoległy — getShow użyje cache z generateMetadata
  const [show, photos, otherShows] = await Promise.all([
    getShow(id),
    getPhotos(id),
    getOtherShows(id),
  ]);

  if (!show) notFound();

  return (
    <>
      <style>{`
        /* ── Hero ── */
        .show-hero{position:relative;height:clamp(320px,50vw,580px);background:#0a0a0a;overflow:hidden}
        .show-hero-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.08) 0%,rgba(0,0,0,.75) 100%);z-index:1}
        .show-hero-content{position:absolute;bottom:0;left:0;right:0;z-index:2;padding:var(--space-10) var(--space-8);max-width:var(--content-wide);margin:0 auto}
        @media(max-width:640px){.show-hero-content{padding:var(--space-6) var(--space-5)}}

        /* ── Title ── */
        .show-title{font-family:var(--font-display);font-weight:900;font-size:var(--text-2xl);letter-spacing:-0.04em;color:#fff;line-height:1.05;margin-bottom:var(--space-4)}
        @media(max-width:640px){.show-title{font-size:var(--text-xl)}}

        /* ── Meta chips ── */
        .meta-chip{display:inline-flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);color:rgba(255,255,255,.85);background:rgba(255,255,255,.1);backdrop-filter:blur(6px);padding:var(--space-2) var(--space-3);border-radius:var(--radius-full);border:1px solid rgba(255,255,255,.15)}
        .show-meta-bar{display:flex;flex-wrap:wrap;gap:var(--space-2)}

        /* ── Back button ── */
        .back-btn{display:inline-flex;align-items:center;gap:var(--space-2);color:rgba(255,255,255,.6);font-size:var(--text-xs);text-decoration:none;margin-bottom:var(--space-4);transition:color .15s}
        .back-btn:hover{color:#fff}

        /* ── Body ── */
        .show-body{max-width:var(--content-wide);margin:0 auto;padding:var(--space-8) var(--space-8) 0}
        @media(max-width:640px){.show-body{padding:var(--space-6) var(--space-5) 0}}

        /* ── Tags ── */
        .tag-chip{font-size:var(--text-xs);padding:3px 12px;border-radius:var(--radius-full);background:var(--color-surface-offset);border:1px solid var(--color-border);color:var(--color-text-muted);white-space:nowrap}

        /* ── Stats row ── */
        .stats-row{display:flex;gap:var(--space-6);flex-wrap:wrap;padding:var(--space-6) 0;border-top:1px solid var(--color-divider);border-bottom:1px solid var(--color-divider);margin:var(--space-6) 0}
        .stat-item{display:flex;flex-direction:column;gap:var(--space-1)}

        /* ── Inne pokazy ── */
        .other-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));gap:var(--space-5)}
        .other-card{display:flex;flex-direction:column;border-radius:var(--radius-xl);overflow:hidden;border:1px solid var(--color-border);background:var(--color-surface);text-decoration:none;color:inherit;transition:box-shadow .2s,transform .2s}
        .other-card:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
        .other-card-img{position:relative;aspect-ratio:16/9;background:var(--color-surface-offset);overflow:hidden}
        .other-card-img img{transition:transform .4s cubic-bezier(.16,1,.3,1)}
        .other-card:hover .other-card-img img{transform:scale(1.05)}
        .other-card-body{padding:var(--space-4) var(--space-5)}
      `}</style>

      {/* ── HERO ── */}
      <div className="show-hero" style={{ marginTop: 64 }}>
        {show.coverImage && (
          <Image
            src={show.coverImage}
            alt={show.name}
            fill
            quality={90}
            style={{ objectFit: "cover" }}
            priority
          />
        )}
        <div className="show-hero-overlay"/>
        <div className="show-hero-content">
          <Link href="/gallery" className="back-btn">
            <ChevronLeft size={14}/> Galeria
          </Link>
          <h1 className="show-title">{show.name}</h1>
          <div className="show-meta-bar">
            <span className="meta-chip"><MapPin size={12}/>{show.location}</span>
            <span className="meta-chip"><Calendar size={12}/>{show.date || show.year}</span>
            <span className="meta-chip"><Images size={12}/>{photos.length} zdjęć</span>
            {show.featured && (
              <span className="meta-chip">
                <Star size={12} fill="currentColor" style={{ color:"#fbbf24" }}/> Wyróżniony
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── OPIS + META ── */}
      <div className="show-body">
        {/* Statystyki */}
        <div className="stats-row">
          <div className="stat-item">
            <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", textTransform:"uppercase", letterSpacing:".08em", fontWeight:700 }}>Zdjęcia</span>
            <span style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)", letterSpacing:"-0.03em", fontVariantNumeric:"tabular-nums" }}>{photos.length}</span>
          </div>
          <div className="stat-item">
            <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", textTransform:"uppercase", letterSpacing:".08em", fontWeight:700 }}>Rok</span>
            <span style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)", letterSpacing:"-0.03em" }}>{show.year}</span>
          </div>
          <div className="stat-item">
            <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", textTransform:"uppercase", letterSpacing:".08em", fontWeight:700 }}>Lokalizacja</span>
            <span style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)", letterSpacing:"-0.03em" }}>
              {show.location.split(",").pop()?.trim() ?? show.location}
            </span>
          </div>
          {show.tags.length > 0 && (
            <div className="stat-item">
              <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", textTransform:"uppercase", letterSpacing:".08em", fontWeight:700 }}>Tagi</span>
              <span style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)", letterSpacing:"-0.03em" }}>{show.tags.length}</span>
            </div>
          )}
        </div>

        {/* Opis */}
        {show.description && (
          <p style={{ fontSize:"var(--text-base)", color:"var(--color-text-muted)", maxWidth:"72ch", lineHeight:1.75, marginBottom:"var(--space-5)" }}>
            {show.description}
          </p>
        )}

        {/* Tagi */}
        {show.tags.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:"var(--space-2)", alignItems:"center", marginBottom:"var(--space-2)" }}>
            <Tag size={13} style={{ color:"var(--color-text-faint)" }}/>
            {show.tags.map(t => (
              <Link
                key={t}
                href={`/gallery?tag=${encodeURIComponent(t)}`}
                className="tag-chip"
                style={{ textDecoration:"none" }}
              >
                {t}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── PHOTO GRID ── */}
      <div style={{ maxWidth:"var(--content-wide)", margin:"0 auto", padding:"var(--space-8)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"var(--space-5)" }}>
          <h2 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-lg)", letterSpacing:"-0.02em" }}>
            Zdjęcia
            <span style={{ fontWeight:400, color:"var(--color-text-faint)", fontSize:"var(--text-sm)", marginLeft:"var(--space-3)", fontFamily:"inherit" }}>
              ({photos.length})
            </span>
          </h2>
        </div>
        <PhotoGrid photos={photos}/>
      </div>

      {/* ── INNE POKAZY ── */}
      {otherShows.length > 0 && (
        <div style={{ maxWidth:"var(--content-wide)", margin:"0 auto", padding:"0 var(--space-8) var(--space-16)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"var(--space-5)" }}>
            <h2 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-lg)", letterSpacing:"-0.02em" }}>
              Inne pokazy
            </h2>
            <Link
              href="/gallery"
              style={{ display:"inline-flex", alignItems:"center", gap:"var(--space-1)", fontSize:"var(--text-xs)", fontWeight:600, color:"var(--color-accent)", textDecoration:"none" }}
            >
              Wszystkie <ArrowRight size={13}/>
            </Link>
          </div>

          <div className="other-grid">
            {otherShows.map(other => (
              <Link key={other.id} href={`/pokaz/${other.id}`} className="other-card">
                <div className="other-card-img">
                  {other.coverImage ? (
                    <Image
                      src={other.coverImage}
                      alt={other.name}
                      fill
                      style={{ objectFit:"cover" }}
                      sizes="(max-width:768px) 100vw, 33vw"
                    />
                  ) : (
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Images size={28} style={{ opacity:.2 }}/>
                    </div>
                  )}
                  {/* Licznik zdjęć na cover */}
                  <div style={{ position:"absolute", bottom:"var(--space-2)", right:"var(--space-2)", background:"rgba(0,0,0,.6)", backdropFilter:"blur(4px)", border:"1px solid rgba(255,255,255,.1)", borderRadius:"var(--radius-full)", padding:"2px 8px", fontSize:10, fontWeight:700, color:"rgba(255,255,255,.85)", display:"flex", alignItems:"center", gap:4 }}>
                    <Images size={10}/> {other.photoCount}
                  </div>
                </div>
                <div className="other-card-body">
                  <p style={{ fontSize:"var(--text-sm)", fontWeight:700, marginBottom:"var(--space-1)", lineHeight:1.3 }}>{other.name}</p>
                  <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                    <MapPin size={10}/>{other.location} · {other.year}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}