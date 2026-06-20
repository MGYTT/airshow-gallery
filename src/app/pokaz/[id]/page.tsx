"use client";

import { useParams } from "next/navigation";
import { getShowById, getPhotosByShow } from "@/lib/data";
import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Calendar, Images, ChevronLeft,
  ChevronRight, X, ZoomIn, Star,
  Tag, Download,
} from "lucide-react";

export default function ShowPage() {
  const { id } = useParams<{ id: string }>();
  const show  = getShowById(id);
  const photos = getPhotosByShow(id);

  const [lightbox, setLightbox] = useState<number | null>(null);

  const openLightbox  = useCallback((i: number) => setLightbox(i), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevPhoto = useCallback(() => setLightbox(p => p !== null ? (p - 1 + photos.length) % photos.length : null), [photos.length]);
  const nextPhoto = useCallback(() => setLightbox(p => p !== null ? (p + 1) % photos.length : null), [photos.length]);

  if (!show) return (
    <div style={{ minHeight:"60dvh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"var(--space-4)" }}>
      <h1 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)" }}>Pokaz nie istnieje</h1>
      <Link href="/" className="btn btn-subtle">← Wróć na stronę główną</Link>
    </div>
  );

  return (
    <>
      <style>{`
        .show-hero {
          position: relative;
          height: clamp(320px, 50vw, 560px);
          background: #0a0a0a;
          overflow: hidden;
        }
        .show-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,.1) 0%, rgba(0,0,0,.72) 100%);
          z-index: 1;
        }
        .show-hero-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          z-index: 2; padding: var(--space-10) var(--space-8);
          max-width: var(--content-wide); margin: 0 auto;
        }
        @media(max-width:640px){ .show-hero-content { padding: var(--space-8) var(--space-5); } }
        .show-title {
          font-family: var(--font-display); font-weight: 900;
          font-size: var(--text-2xl); letter-spacing: -0.04em;
          color: #fff; line-height: 1.05; margin-bottom: var(--space-4);
        }
        .show-meta-bar {
          display: flex; flex-wrap: wrap; gap: var(--space-4);
          align-items: center;
        }
        .meta-chip {
          display: inline-flex; align-items: center; gap: var(--space-2);
          font-size: var(--text-xs); color: rgba(255,255,255,.8);
          background: rgba(255,255,255,.1); backdrop-filter: blur(6px);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-full);
          border: 1px solid rgba(255,255,255,.15);
        }
        /* Photo grid */
        .photo-masonry {
          columns: 4 220px;
          column-gap: var(--space-3);
          padding: var(--space-8);
          max-width: var(--content-wide);
          margin: 0 auto;
        }
        @media(max-width:640px){ .photo-masonry { padding: var(--space-4) var(--space-3); columns: 2 140px; } }
        .photo-item {
          break-inside: avoid;
          margin-bottom: var(--space-3);
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: zoom-in;
          background: var(--color-surface-offset);
          position: relative;
        }
        .photo-item img { display: block; width: 100%; height: auto; transition: transform .4s cubic-bezier(.16,1,.3,1); }
        .photo-item:hover img { transform: scale(1.03); }
        .photo-item-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,.3);
          opacity: 0; transition: opacity .2s;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .photo-item:hover .photo-item-overlay { opacity: 1; }
        .photo-featured-badge {
          position: absolute; top: var(--space-2); left: var(--space-2);
          background: var(--color-gold); color: #fff;
          font-size: 9px; font-weight: 700; letter-spacing: .06em;
          padding: 2px 7px; border-radius: var(--radius-full);
          display: flex; align-items: center; gap: 3px;
        }
        /* Lightbox */
        .lb-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.95);
          z-index: 2000;
          display: flex; align-items: center; justify-content: center;
          animation: lbIn .2s ease;
        }
        @keyframes lbIn { from { opacity:0 } to { opacity:1 } }
        .lb-close {
          position: absolute; top: var(--space-5); right: var(--space-5);
          background: rgba(255,255,255,.1); border: none; color: #fff;
          width: 44px; height: 44px; border-radius: var(--radius-full);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 2010;
          transition: background .15s;
        }
        .lb-close:hover { background: rgba(255,255,255,.2); }
        .lb-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
          color: #fff; width: 48px; height: 64px; border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 2010;
          transition: background .15s, transform .15s;
        }
        .lb-nav:hover { background: rgba(255,255,255,.18); }
        .lb-nav-prev { left: var(--space-4); }
        .lb-nav-next { right: var(--space-4); }
        .lb-nav:hover.lb-nav-prev { transform: translateY(-50%) translateX(-2px); }
        .lb-nav:hover.lb-nav-next { transform: translateY(-50%) translateX(2px); }
        .lb-image-wrap {
          max-width: 90vw; max-height: 85dvh;
          position: relative;
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
        .lb-counter {
          position: absolute; bottom: var(--space-5); left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,.5); backdrop-filter: blur(8px);
          color: rgba(255,255,255,.8);
          font-size: var(--text-xs); font-weight: 600;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-full);
          border: 1px solid rgba(255,255,255,.1);
        }
        .lb-caption {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(0,0,0,.8), transparent);
          padding: var(--space-8) var(--space-5) var(--space-5);
          color: rgba(255,255,255,.85);
          font-size: var(--text-xs);
        }
      `}</style>

      {/* ── Hero ── */}
      <div className="show-hero">
        <Image
          src={show.coverImage}
          alt={show.name}
          fill
          style={{ objectFit:"cover" }}
          priority
        />
        <div className="show-hero-overlay"/>
        <div className="show-hero-content">
          <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:"var(--space-2)", color:"rgba(255,255,255,.6)", fontSize:"var(--text-xs)", textDecoration:"none", marginBottom:"var(--space-4)", transition:"color .15s" }}>
            <ChevronLeft size={14}/> Powrót
          </Link>
          <h1 className="show-title">{show.name}</h1>
          <div className="show-meta-bar">
            <span className="meta-chip"><MapPin size={12}/>{show.location}</span>
            <span className="meta-chip"><Calendar size={12}/>{show.date}</span>
            <span className="meta-chip"><Images size={12}/>{photos.length} zdjęć</span>
            {show.featured && <span className="meta-chip"><Star size={12} fill="currentColor" style={{ color:"var(--color-gold)" }}/> Wyróżniony</span>}
          </div>
        </div>
      </div>

      {/* ── Description + tags ── */}
      <div style={{ maxWidth:"var(--content-wide)", margin:"0 auto", padding:"var(--space-8) var(--space-8) 0" }}>
        {show.description && (
          <p style={{ fontSize:"var(--text-base)", color:"var(--color-text-muted)", maxWidth:"72ch", lineHeight:1.7, marginBottom:"var(--space-5)" }}>
            {show.description}
          </p>
        )}
        {show.tags.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:"var(--space-2)", alignItems:"center" }}>
            <Tag size={13} style={{ color:"var(--color-text-faint)" }}/>
            {show.tags.map(t => (
              <span key={t} style={{ fontSize:"var(--text-xs)", padding:"3px 10px", borderRadius:"var(--radius-full)", background:"var(--color-surface-offset)", border:"1px solid var(--color-border)", color:"var(--color-text-muted)" }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Photo masonry grid ── */}
      <div className="photo-masonry">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="photo-item"
            onClick={() => openLightbox(i)}
            style={{ aspectRatio: i % 3 === 0 ? "4/3" : i % 5 === 0 ? "1/1" : "3/2" }}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              width={600}
              height={400}
              style={{ objectFit:"cover", width:"100%", height:"100%" }}
              loading="lazy"
            />
            {photo.featured && (
              <div className="photo-featured-badge">
                <Star size={8} fill="#fff"/> Best
              </div>
            )}
            <div className="photo-item-overlay">
              <ZoomIn size={28}/>
            </div>
          </div>
        ))}
      </div>

      {/* ── LIGHTBOX ── */}
      {lightbox !== null && (
        <div className="lb-backdrop" onClick={closeLightbox}>
          <button className="lb-close" onClick={closeLightbox} aria-label="Zamknij">
            <X size={20}/>
          </button>
          <button className="lb-nav lb-nav-prev" onClick={e => { e.stopPropagation(); prevPhoto(); }} aria-label="Poprzednie">
            <ChevronLeft size={22}/>
          </button>
          <div className="lb-image-wrap" onClick={e => e.stopPropagation()}>
            <Image
              key={lightbox}
              src={photos[lightbox].src}
              alt={photos[lightbox].alt}
              width={900}
              height={600}
              style={{ maxWidth:"90vw", maxHeight:"85dvh", width:"auto", height:"auto", display:"block" }}
              priority
            />
            <div className="lb-caption">{photos[lightbox].alt}</div>
          </div>
          <button className="lb-nav lb-nav-next" onClick={e => { e.stopPropagation(); nextPhoto(); }} aria-label="Następne">
            <ChevronRight size={22}/>
          </button>
          <div className="lb-counter">
            {lightbox + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}