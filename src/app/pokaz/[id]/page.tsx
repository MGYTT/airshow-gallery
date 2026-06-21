import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Calendar, Images, ChevronLeft, Star, Tag } from "lucide-react";
import PhotoGrid from "@/components/PhotoGrid";

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

const BASE    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const headers = { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` };

async function getShow(id: string): Promise<AirShow | null> {
  try {
    const res = await fetch(
      `${BASE}/rest/v1/air_shows?id=eq.${id}&published=eq.true&limit=1`,
      { headers, next: { revalidate: 30 } }
    );
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
}

async function getPhotos(showId: string): Promise<Photo[]> {
  try {
    const res = await fetch(
      `${BASE}/rest/v1/photos?show_id=eq.${showId}&order=created_at.asc`,
      { headers, next: { revalidate: 30 } }
    );
    const data: Record<string, unknown>[] = await res.json();
    return data.map((p) => ({
      id:       p.id       as string,
      showId:   p.show_id  as string,
      src:      p.src      as string,
      alt:      (p.alt      as string) ?? "",
      aircraft: (p.aircraft as string) ?? "",
      // ✅ fallback 0 — PhotoGrid obsłuży brakujące wymiary
      width:    (p.width    as number) || 0,
      height:   (p.height   as number) || 0,
      tags:     (p.tags     as string[]) ?? [],
      featured: Boolean(p.featured),
    }));
  } catch { return []; }
}

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${BASE}/rest/v1/air_shows?published=eq.true&select=id`,
      { headers }
    );
    const data: { id: string }[] = await res.json();
    return data.map((s) => ({ id: s.id }));
  } catch { return []; }
}

export default async function ShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [show, photos] = await Promise.all([getShow(id), getPhotos(id)]);
  if (!show) notFound();

  return (
    <>
      <style>{`
        .show-hero { position:relative; height:clamp(320px,50vw,560px); background:#0a0a0a; overflow:hidden; }
        .show-hero-overlay { position:absolute; inset:0; background:linear-gradient(to bottom,rgba(0,0,0,.1) 0%,rgba(0,0,0,.72) 100%); z-index:1; }
        .show-hero-content { position:absolute; bottom:0; left:0; right:0; z-index:2; padding:var(--space-10) var(--space-8); max-width:var(--content-wide); margin:0 auto; }
        @media(max-width:640px){ .show-hero-content { padding:var(--space-8) var(--space-5); } }
        .show-title { font-family:var(--font-display); font-weight:900; font-size:var(--text-2xl); letter-spacing:-0.04em; color:#fff; line-height:1.05; margin-bottom:var(--space-4); }
        .show-meta-bar { display:flex; flex-wrap:wrap; gap:var(--space-4); align-items:center; }
        .meta-chip { display:inline-flex; align-items:center; gap:var(--space-2); font-size:var(--text-xs); color:rgba(255,255,255,.8); background:rgba(255,255,255,.1); backdrop-filter:blur(6px); padding:var(--space-2) var(--space-3); border-radius:var(--radius-full); border:1px solid rgba(255,255,255,.15); }
      `}</style>

      {/* Hero */}
      <div className="show-hero">
        {show.coverImage && (
          // ✅ quality={90} dla hero — dobry balans ostrości i szybkości ładowania
          <Image
            src={show.coverImage}
            alt={show.name}
            fill
            quality={90}
            style={{ objectFit: "cover" }}
            priority
          />
        )}
        <div className="show-hero-overlay" />
        <div className="show-hero-content">
          <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:"var(--space-2)", color:"rgba(255,255,255,.6)", fontSize:"var(--text-xs)", textDecoration:"none", marginBottom:"var(--space-4)" }}>
            <ChevronLeft size={14} /> Powrót
          </Link>
          <h1 className="show-title">{show.name}</h1>
          <div className="show-meta-bar">
            <span className="meta-chip"><MapPin size={12} />{show.location}</span>
            <span className="meta-chip"><Calendar size={12} />{show.date || show.year}</span>
            <span className="meta-chip"><Images size={12} />{photos.length} zdjęć</span>
            {show.featured && (
              <span className="meta-chip">
                <Star size={12} fill="currentColor" style={{ color: "var(--color-gold)" }} /> Wyróżniony
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Opis + tagi */}
      <div style={{ maxWidth: "var(--content-wide)", margin: "0 auto", padding: "var(--space-8) var(--space-8) 0" }}>
        {show.description && (
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)", maxWidth: "72ch", lineHeight: 1.7, marginBottom: "var(--space-5)" }}>
            {show.description}
          </p>
        )}
        {show.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" }}>
            <Tag size={13} style={{ color: "var(--color-text-faint)" }} />
            {show.tags.map(t => (
              <span key={t} style={{ fontSize: "var(--text-xs)", padding: "3px 10px", borderRadius: "var(--radius-full)", background: "var(--color-surface-offset)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* PhotoGrid */}
      <div style={{ maxWidth: "var(--content-wide)", margin: "0 auto", padding: "var(--space-8)" }}>
        <PhotoGrid photos={photos} />
      </div>
    </>
  );
}