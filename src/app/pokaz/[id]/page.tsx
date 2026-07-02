import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Calendar, Images, ChevronLeft,
  Star, Tag, ArrowRight, Home, Hash,
} from "lucide-react";
import PhotoGrid from "@/components/PhotoGrid";
import StoriesBar from "@/components/stories/StoriesBar";
import ShareButton from "@/components/ShareButton";

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

// ── ISR ──────────────────────────────────────────────────────
export const revalidate = 60;

// ── Supabase ──────────────────────────────────────────────────
const BASE    = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSbHeaders(): Record<string, string> | null {
  if (!BASE || !API_KEY) {
    console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_ANON_KEY w zmiennych środowiskowych.");
    return null;
  }
  return { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` };
}

function mapShow(s: Record<string, unknown>): AirShow {
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
}

const getShow = cache(async (id: string): Promise<AirShow | null> => {
  const headers = getSbHeaders();
  if (!headers || !id) return null;
  try {
    const res = await fetch(
      `${BASE}/rest/v1/air_shows?id=eq.${encodeURIComponent(id)}&published=eq.true&limit=1`,
      { headers, next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data: Record<string, unknown>[] = await res.json();
    if (!data[0]) return null;
    return mapShow(data[0]);
  } catch (err) {
    console.error("Błąd pobierania pokazu:", err);
    return null;
  }
});

async function getPhotos(showId: string): Promise<Photo[]> {
  const headers = getSbHeaders();
  if (!headers) return [];
  try {
    const res = await fetch(
      `${BASE}/rest/v1/photos?show_id=eq.${encodeURIComponent(showId)}&order=created_at.asc`,
      { headers, next: { revalidate: 60 } }
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
  } catch (err) {
    console.error("Błąd pobierania zdjęć:", err);
    return [];
  }
}

async function getOtherShows(excludeId: string): Promise<AirShow[]> {
  const headers = getSbHeaders();
  if (!headers) return [];
  try {
    const res = await fetch(
      `${BASE}/rest/v1/air_shows?published=eq.true&id=neq.${encodeURIComponent(excludeId)}&order=year.desc&limit=3`,
      { headers, next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data: Record<string, unknown>[] = await res.json();
    return data.map(mapShow);
  } catch (err) {
    console.error("Błąd pobierania innych pokazów:", err);
    return [];
  }
}

// ── generateStaticParams ──────────────────────────────────────
export async function generateStaticParams() {
  const headers = getSbHeaders();
  if (!headers) return [];
  try {
    const res = await fetch(
      `${BASE}/rest/v1/air_shows?published=eq.true&select=id`,
      { headers }
    );
    if (!res.ok) return [];
    const data: { id: string }[] = await res.json();
    return data.map(s => ({ id: s.id }));
  } catch (err) {
    console.error("Błąd generateStaticParams:", err);
    return [];
  }
}

// ── generateMetadata ──────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const show    = await getShow(id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mgyt.pl";

  if (!show) {
    return {
      title: "Pokaz nie znaleziony — MGYT AirShow Gallery",
      description: "Ten pokaz lotniczy nie istnieje lub został usunięty.",
      robots: { index: false, follow: false },
    };
  }

  const pageUrl = `${siteUrl}/pokaz/${show.id}`;
  const ogImage = show.coverImage || `${siteUrl}/og-image.jpg`;
  const desc    = show.description
    ? show.description.slice(0, 155)
    : `${show.photoCount} zdjęć z ${show.name} — ${show.location}, ${show.year}`;

  return {
    title:       `${show.name} ${show.year} — MGYT AirShow Gallery`,
    description: desc,
    keywords:    [...show.tags, show.location, String(show.year), "pokaz lotniczy", "airshow", "fotografia lotnicza", "MGYT"],
    openGraph: {
      type:        "article",
      url:         pageUrl,
      title:       `${show.name} ${show.year} — MGYT AirShow Gallery`,
      description: desc,
      images: [{ url: ogImage, width: 1200, height: 630, alt: show.name }],
      siteName: "MGYT AirShow Gallery",
      locale: "pl_PL",
    },
    twitter: {
      card:        "summary_large_image",
      title:       `${show.name} ${show.year}`,
      description: desc,
      images:      [ogImage],
    },
    alternates: { canonical: pageUrl },
    robots: { index: true, follow: true },
  };
}

// ── PAGE ─────────────────────────────────────────────────────
export default async function ShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) notFound();

  const [show, photos, otherShows] = await Promise.all([
    getShow(id),
    getPhotos(id),
    getOtherShows(id),
  ]);

  if (!show) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mgyt.pl";
  const pageUrl = `${siteUrl}/pokaz/${show.id}`;

  const eventJsonLd = {
    "@context":    "https://schema.org",
    "@type":       "Event",
    "name":        show.name,
    "description": show.description || `Pokaz lotniczy ${show.name}`,
    "startDate":   show.date || `${show.year}`,
    "location": {
      "@type":   "Place",
      "name":    show.location,
      "address": show.location,
    },
    "image":    show.coverImage || `${siteUrl}/og-image.jpg`,
    "url":      pageUrl,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "organizer": {
      "@type": "Organization",
      "name":  "MGYT AirShow Gallery",
      "url":   siteUrl,
    },
    "photo": photos.slice(0, 10).map(p => ({
      "@type":       "ImageObject",
      "url":         p.src,
      "description": p.alt || p.aircraft || show.name,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Strona główna", "item": siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Galeria", "item": `${siteUrl}/gallery` },
      { "@type": "ListItem", "position": 3, "name": show.name, "item": pageUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <style>{`
        /* ── Base ── */
        .sp-wrap { padding-top:64px; min-height:100dvh; }

        /* ── Animacje ── */
        @keyframes sp-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .sp-anim-1 { animation:sp-up .5s cubic-bezier(.16,1,.3,1) both; }
        .sp-anim-2 { animation:sp-up .5s .07s cubic-bezier(.16,1,.3,1) both; }
        .sp-anim-3 { animation:sp-up .5s .14s cubic-bezier(.16,1,.3,1) both; }

        @media (prefers-reduced-motion: reduce) {
          .sp-anim-1, .sp-anim-2, .sp-anim-3 { animation:none; opacity:1; }
        }

        /* ── Hero ── */
        .sp-hero { position:relative; height:clamp(340px,52vw,620px); background:#0a0a0a; overflow:hidden; }
        .sp-hero-overlay { position:absolute; inset:0; background:linear-gradient(160deg,rgba(0,0,0,.05) 0%,rgba(0,0,0,.55) 55%,rgba(0,0,0,.88) 100%); z-index:1; }
        .sp-hero-content { position:absolute; bottom:0; left:0; right:0; z-index:2; padding:clamp(var(--space-6),5vw,var(--space-12)) clamp(var(--space-5),5vw,var(--space-12)); }
        .sp-hero-inner { max-width:var(--content-wide); margin:0 auto; }
        .sp-hero-placeholder { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,var(--color-surface-offset) 0%,var(--color-surface-dynamic) 100%); }

        /* ── Hero title ── */
        .sp-title { font-family:var(--font-display); font-weight:900; font-size:var(--text-2xl); letter-spacing:-0.04em; color:#fff; line-height:1.05; margin-bottom:var(--space-4); text-shadow:0 2px 24px rgba(0,0,0,.4); }
        @media(max-width:640px) { .sp-title { font-size:var(--text-xl); } }

        /* ── Chipy w hero ── */
        .sp-chips { display:flex; flex-wrap:wrap; gap:var(--space-2); margin-bottom:var(--space-4); }
        .sp-chip { display:inline-flex; align-items:center; gap:5px; font-size:var(--text-xs); font-weight:600; color:rgba(255,255,255,.9); background:rgba(255,255,255,.1); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); padding:var(--space-2) var(--space-3); border-radius:var(--radius-full); border:1px solid rgba(255,255,255,.18); white-space:nowrap; }
        .sp-chip--featured { background:rgba(251,191,36,.18); border-color:rgba(251,191,36,.4); color:#fde68a; }

        /* ── Hero akcje ── */
        .sp-hero-actions { display:flex; align-items:center; gap:var(--space-3); margin-bottom:var(--space-5); }
        .sp-back-btn { display:inline-flex; align-items:center; gap:var(--space-2); color:rgba(255,255,255,.65); font-size:var(--text-xs); font-weight:600; text-decoration:none; padding:var(--space-2) var(--space-3); border-radius:var(--radius-full); background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); transition:background .15s,color .15s; }
        .sp-back-btn:hover { background:rgba(255,255,255,.15); color:#fff; }
        .sp-share-btn { display:inline-flex; align-items:center; gap:var(--space-2); color:rgba(255,255,255,.65); font-size:var(--text-xs); font-weight:600; padding:var(--space-2) var(--space-3); border-radius:var(--radius-full); background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); cursor:pointer; transition:background .15s,color .15s; }
        .sp-share-btn:hover { background:rgba(255,255,255,.15); color:#fff; }
        .sp-share-btn:focus-visible, .sp-back-btn:focus-visible { outline:2px solid #fff; outline-offset:2px; }

        /* ── Breadcrumb bar ── */
        .sp-nav-bar { border-bottom:1px solid var(--color-divider); background:var(--color-surface); }
        .sp-nav-bar-inner { max-width:var(--content-wide); margin:0 auto; padding:var(--space-3) clamp(var(--space-5),5vw,var(--space-12)); }
        .sp-breadcrumb { display:flex; align-items:center; gap:var(--space-2); font-size:var(--text-xs); color:var(--color-text-faint); flex-wrap:wrap; }
        .sp-breadcrumb a { color:var(--color-text-faint); text-decoration:none; transition:color .15s; display:inline-flex; align-items:center; gap:4px; }
        .sp-breadcrumb a:hover { color:var(--color-text); }
        .sp-breadcrumb-sep { opacity:.4; }
        .sp-breadcrumb-current { color:var(--color-text-muted); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:280px; }

        /* ── Body ── */
        .sp-body { max-width:var(--content-wide); margin:0 auto; padding:var(--space-8) clamp(var(--space-5),5vw,var(--space-12)); }

        /* ── Opis ── */
        .sp-desc { font-size:var(--text-base); color:var(--color-text-muted); max-width:72ch; line-height:1.8; margin-bottom:var(--space-6); }

        /* ══════════ Statystyki ══════════ */
        .sp-meta-strip { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:var(--space-3); margin-bottom:var(--space-6); }
        .sp-meta-card { display:flex; align-items:center; gap:var(--space-3); padding:var(--space-3) var(--space-4); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); }
        .sp-meta-icon { width:32px; height:32px; border-radius:var(--radius-md); background:var(--color-surface-offset); display:flex; align-items:center; justify-content:center; flex-shrink:0; color:var(--color-accent); }
        .sp-meta-text { display:flex; flex-direction:column; gap:1px; min-width:0; }
        .sp-meta-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--color-text-faint); white-space:nowrap; }
        .sp-meta-value { font-size:var(--text-sm); font-weight:700; color:var(--color-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-variant-numeric:tabular-nums; }
        @media(max-width:480px) { .sp-meta-strip { grid-template-columns:1fr 1fr; } }

        /* ── Tags ── */
        .sp-tags { display:flex; flex-wrap:wrap; gap:var(--space-2); align-items:center; margin-bottom:var(--space-2); }
        .sp-tag { font-size:var(--text-xs); padding:3px 12px; border-radius:var(--radius-full); background:var(--color-surface-offset); border:1px solid var(--color-border); color:var(--color-text-muted); text-decoration:none; transition:background .15s,color .15s,border-color .15s; white-space:nowrap; font-weight:500; }
        .sp-tag:hover { background:var(--color-surface-dynamic); color:var(--color-text); border-color:color-mix(in srgb, var(--color-accent) 40%, transparent); }

        /* ── Section header ── */
        .sp-section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-5); padding-top:var(--space-8); border-top:1px solid var(--color-divider); flex-wrap:wrap; gap:var(--space-3); }
        .sp-section-title { font-family:var(--font-display); font-weight:900; font-size:var(--text-lg); letter-spacing:-0.02em; }
        .sp-section-count { font-weight:400; color:var(--color-text-faint); font-size:var(--text-sm); margin-left:var(--space-2); font-family:inherit; }
        .sp-section-link { display:inline-flex; align-items:center; gap:4px; font-size:var(--text-xs); font-weight:700; color:var(--color-accent); text-decoration:none; }
        .sp-section-link:hover { text-decoration:underline; }

        /* ── Empty state zdjęć ── */
        .sp-photos-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:var(--space-3); padding:var(--space-16) var(--space-6); color:var(--color-text-faint); text-align:center; background:var(--color-surface); border:1px dashed var(--color-border); border-radius:var(--radius-xl); }

        /* ── Inne pokazy ── */
        .sp-other-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr)); gap:var(--space-5); }
        .sp-other-card { display:flex; flex-direction:column; border-radius:var(--radius-xl); overflow:hidden; border:1px solid var(--color-border); background:var(--color-surface); text-decoration:none; color:inherit; transition:box-shadow .2s cubic-bezier(.16,1,.3,1),transform .2s cubic-bezier(.16,1,.3,1),border-color .2s; }
        .sp-other-card:hover, .sp-other-card:focus-visible { box-shadow:var(--shadow-md); transform:translateY(-3px); border-color:color-mix(in srgb, var(--color-accent) 30%, transparent); }
        .sp-other-card:focus-visible { outline:2px solid var(--color-accent); outline-offset:2px; }
        .sp-other-card-img { position:relative; aspect-ratio:16/9; background:var(--color-surface-offset); overflow:hidden; }
        .sp-other-card-img img { transition:transform .5s cubic-bezier(.16,1,.3,1); }
        .sp-other-card:hover .sp-other-card-img img { transform:scale(1.06); }
        .sp-other-card-body { padding:var(--space-4) var(--space-5); }
        .sp-other-card-name { font-size:var(--text-sm); font-weight:700; margin-bottom:var(--space-1); line-height:1.3; }
        .sp-other-card-meta { font-size:var(--text-xs); color:var(--color-text-faint); display:flex; align-items:center; gap:var(--space-2); }
        .sp-photo-pill { position:absolute; bottom:var(--space-2); right:var(--space-2); background:rgba(0,0,0,.65); backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,.12); border-radius:var(--radius-full); padding:2px 8px; font-size:10px; font-weight:700; color:rgba(255,255,255,.9); display:flex; align-items:center; gap:4px; }
      `}</style>

      <div className="sp-wrap">

        {/* ── HERO ── */}
        <div className="sp-hero">
          {show.coverImage ? (
            <Image
              src={show.coverImage}
              alt={`${show.name} — zdjęcie główne z pokazu lotniczego w ${show.location}, ${show.year}`}
              fill
              quality={90}
              style={{ objectFit: "cover" }}
              priority
              sizes="100vw"
            />
          ) : (
            <div className="sp-hero-placeholder">
              <Images size={48} style={{ opacity: .15 }} aria-hidden/>
            </div>
          )}
          <div className="sp-hero-overlay"/>

          <div className="sp-hero-content">
            <div className="sp-hero-inner">
              <div className="sp-hero-actions sp-anim-1">
                <Link href="/gallery" className="sp-back-btn">
                  <ChevronLeft size={13}/> Galeria
                </Link>
                <ShareButton title={`${show.name} ${show.year}`} url={pageUrl}/>
              </div>

              <h1 className="sp-title sp-anim-2">{show.name}</h1>

              <div className="sp-chips sp-anim-3">
                <span className="sp-chip"><MapPin size={12}/>{show.location}</span>
                <span className="sp-chip"><Calendar size={12}/>{show.date || show.year}</span>
                <span className="sp-chip"><Images size={12}/>{photos.length} zdjęć</span>
                {show.featured && (
                  <span className="sp-chip sp-chip--featured">
                    <Star size={12} fill="currentColor"/> Wyróżniony
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── BREADCRUMB ── */}
        <div className="sp-nav-bar">
          <div className="sp-nav-bar-inner">
            <nav className="sp-breadcrumb" aria-label="Ścieżka nawigacji">
              <Link href="/"><Home size={12}/> Strona główna</Link>
              <span className="sp-breadcrumb-sep" aria-hidden>›</span>
              <Link href="/gallery">Galeria</Link>
              <span className="sp-breadcrumb-sep" aria-hidden>›</span>
              <span className="sp-breadcrumb-current" aria-current="page" title={show.name}>{show.name}</span>
            </nav>
          </div>
        </div>

        {/* ── RELACJE ── */}
        <div style={{ maxWidth:"var(--content-wide)", margin:"0 auto", padding:"0 clamp(var(--space-5),5vw,var(--space-12))" }}>
          <StoriesBar showId={show.id} showTitle={show.name}/>
        </div>

        {/* ── BODY ── */}
        <div className="sp-body">

          {/* Opis */}
          {show.description ? (
            <p className="sp-desc">{show.description}</p>
          ) : (
            <p className="sp-desc" style={{ fontStyle:"italic", opacity:.6 }}>
              Brak opisu dla tego pokazu.
            </p>
          )}

          {/* ══ STATYSTYKI ══ */}
          <div className="sp-meta-strip">
            <div className="sp-meta-card">
              <div className="sp-meta-icon"><Images size={15}/></div>
              <div className="sp-meta-text">
                <span className="sp-meta-label">Zdjęcia</span>
                <span className="sp-meta-value">{photos.length}</span>
              </div>
            </div>

            <div className="sp-meta-card">
              <div className="sp-meta-icon"><Calendar size={15}/></div>
              <div className="sp-meta-text">
                <span className="sp-meta-label">Rok</span>
                <span className="sp-meta-value">{show.year}</span>
              </div>
            </div>

            <div className="sp-meta-card">
              <div className="sp-meta-icon"><MapPin size={15}/></div>
              <div className="sp-meta-text">
                <span className="sp-meta-label">Lokalizacja</span>
                <span className="sp-meta-value" title={show.location}>
                  {show.location}
                </span>
              </div>
            </div>

            {show.tags.length > 0 && (
              <div className="sp-meta-card">
                <div className="sp-meta-icon"><Hash size={15}/></div>
                <div className="sp-meta-text">
                  <span className="sp-meta-label">Tagi</span>
                  <span className="sp-meta-value">{show.tags.length}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tagi */}
          {show.tags.length > 0 && (
            <div className="sp-tags">
              <Tag size={13} style={{ color:"var(--color-text-faint)", flexShrink:0 }} aria-hidden/>
              {show.tags.map(t => (
                <Link
                  key={t}
                  href={`/gallery?tag=${encodeURIComponent(t)}`}
                  className="sp-tag"
                >
                  {t}
                </Link>
              ))}
            </div>
          )}

          {/* ── ZDJĘCIA ── */}
          <div className="sp-section-head">
            <h2 className="sp-section-title">
              Zdjęcia
              <span className="sp-section-count">({photos.length})</span>
            </h2>
          </div>

          {photos.length > 0 ? (
            <PhotoGrid photos={photos}/>
          ) : (
            <div className="sp-photos-empty">
              <Images size={36} style={{ opacity:.3 }} aria-hidden/>
              <p style={{ fontSize:"var(--text-sm)", fontWeight:600 }}>
                Zdjęcia z tego pokazu jeszcze się pojawią.
              </p>
            </div>
          )}

          {/* ── INNE POKAZY ── */}
          {otherShows.length > 0 && (
            <>
              <div className="sp-section-head">
                <h2 className="sp-section-title">Inne pokazy</h2>
                <Link href="/gallery" className="sp-section-link">
                  Wszystkie <ArrowRight size={13}/>
                </Link>
              </div>

              <div className="sp-other-grid">
                {otherShows.map(other => (
                  <Link key={other.id} href={`/pokaz/${other.id}`} className="sp-other-card">
                    <div className="sp-other-card-img">
                      {other.coverImage ? (
                        <Image
                          src={other.coverImage}
                          alt={`${other.name} — pokaz lotniczy w ${other.location}, ${other.year}`}
                          fill
                          style={{ objectFit:"cover" }}
                          sizes="(max-width:768px) 100vw, 33vw"
                        />
                      ) : (
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Images size={28} style={{ opacity:.15 }} aria-hidden/>
                        </div>
                      )}
                      <div className="sp-photo-pill">
                        <Images size={10}/>{other.photoCount}
                      </div>
                    </div>
                    <div className="sp-other-card-body">
                      <p className="sp-other-card-name">{other.name}</p>
                      <p className="sp-other-card-meta">
                        <MapPin size={10}/>{other.location} · {other.year}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}