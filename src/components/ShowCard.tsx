// src/components/ShowCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Camera, MapPin, Calendar, ArrowUpRight, Star } from "lucide-react";
import { useState } from "react";

// ✅ Typ zdefiniowany lokalnie — brak zależności od data.ts
export interface AirShow {
  id: string;
  name: string;
  location: string;
  date: string;
  year: number;
  description: string;
  coverImage: string;
  photoCount: number;
  tags: string[];
  featured?: boolean;
  published?: boolean;
}

interface ShowCardProps {
  show: AirShow;
  featured?: boolean;
}

export default function ShowCard({ show, featured = false }: ShowCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <>
      <style jsx>{`
        .show-card {
          display: flex; flex-direction: column;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease;
          box-shadow: var(--shadow-sm);
          text-decoration: none; color: inherit;
          position: relative; height: 100%;
        }
        .show-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); border-color: var(--color-accent); }
        .card-img-wrap { position: relative; overflow: hidden; background: var(--color-surface-offset); flex-shrink: 0; }
        .card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease; display: block; }
        .show-card:hover .card-img { transform: scale(1.06); }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .img-skeleton { position: absolute; inset: 0; background: linear-gradient(90deg, var(--color-surface-offset) 25%, var(--color-surface-dynamic,#e8e8e8) 50%, var(--color-surface-offset) 75%); background-size: 200% 100%; animation: shimmer 1.6s ease-in-out infinite; transition: opacity 0.3s ease; }
        .card-img-gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 45%, transparent 100%); opacity: 0; transition: opacity 0.35s ease; pointer-events: none; }
        .show-card:hover .card-img-gradient { opacity: 1; }
        .card-cta { position: absolute; bottom: var(--space-4); left: 50%; transform: translateX(-50%) translateY(6px); opacity: 0; transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1); white-space: nowrap; background: var(--color-accent); color: #fff; font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.05em; padding: var(--space-2) var(--space-4); border-radius: var(--radius-full); display: flex; align-items: center; gap: var(--space-1); pointer-events: none; }
        .show-card:hover .card-cta { opacity: 1; transform: translateX(-50%) translateY(0); }
        .photo-count-pill { position: absolute; bottom: var(--space-3); right: var(--space-3); background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); color: #fff; font-size: var(--text-xs); font-weight: 600; padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); display: flex; align-items: center; gap: var(--space-1); border: 1px solid rgba(255,255,255,0.12); transition: opacity 0.3s ease; }
        .show-card:hover .photo-count-pill { opacity: 0; }
        .tag-chip { font-size: var(--text-xs); color: var(--color-text-faint); background: var(--color-surface-offset); padding: 2px var(--space-2); border-radius: var(--radius-full); font-weight: 500; border: 1px solid transparent; transition: border-color 0.2s ease, color 0.2s ease; }
        .show-card:hover .tag-chip { border-color: var(--color-border); color: var(--color-text-muted); }
        .arrow-icon { position: absolute; top: var(--space-4); right: var(--space-4); width: 32px; height: 32px; border-radius: var(--radius-full); background: var(--color-surface-offset); border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; color: var(--color-text-faint); opacity: 0; transform: scale(0.85) rotate(-10deg); transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1), background 0.2s ease; }
        .show-card:hover .arrow-icon { opacity: 1; transform: scale(1) rotate(0deg); background: var(--color-accent); color: #fff; border-color: var(--color-accent); }
        .progress-track { height: 2px; background: var(--color-divider); border-radius: var(--radius-full); overflow: hidden; margin-top: var(--space-3); }
        .progress-fill { height: 100%; background: var(--color-accent); border-radius: var(--radius-full); transform-origin: left; transition: transform 0.6s cubic-bezier(0.16,1,0.3,1); transform: scaleX(0); }
        .show-card:hover .progress-fill { transform: scaleX(1); }
        .meta-item { display: flex; align-items: center; gap: var(--space-1); font-size: var(--text-xs); color: var(--color-text-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>

      <Link href={`/pokaz/${show.id}`} className="show-card">

        {/* Image */}
        <div className="card-img-wrap" style={{ aspectRatio: featured ? "16/9" : "4/3" }}>
          {!imgLoaded && <div className="img-skeleton"/>}
          <Image
            src={show.coverImage || "https://picsum.photos/seed/airshow/1200/700"}
            alt={show.name}
            fill
            sizes={featured ? "(max-width:768px) 100vw, 60vw" : "(max-width:768px) 100vw, 33vw"}
            className="card-img"
            style={{ opacity: imgLoaded ? 1 : 0 }}
            onLoad={() => setImgLoaded(true)}
            loading="lazy"
          />
          <div className="card-img-gradient"/>
          <div className="card-cta"><Camera size={11}/> Przeglądaj galerię</div>
          <div className="photo-count-pill"><Camera size={11}/> {show.photoCount} zdjęć</div>
          {show.featured && (
            <div style={{ position:"absolute", top:"var(--space-3)", left:"var(--space-3)", display:"flex", alignItems:"center", gap:"var(--space-1)", background:"rgba(212,160,23,0.15)", backdropFilter:"blur(6px)", border:"1px solid rgba(212,160,23,0.5)", color:"var(--color-gold)", fontSize:"var(--text-xs)", fontWeight:700, padding:"var(--space-1) var(--space-3)", borderRadius:"var(--radius-full)", letterSpacing:"0.05em", textTransform:"uppercase" }}>
              <Star size={10} fill="currentColor"/> Wyróżnione
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding:"var(--space-5)", display:"flex", flexDirection:"column", flex:1, position:"relative" }}>
          <div className="arrow-icon"><ArrowUpRight size={14}/></div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"var(--space-2)", marginBottom:"var(--space-3)" }}>
            {show.tags.slice(0, 3).map(tag => <span key={tag} className="tag-chip">{tag}</span>)}
          </div>
          <h3 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"var(--text-lg)", letterSpacing:"-0.025em", lineHeight:1.2, marginBottom:"var(--space-2)", paddingRight:"var(--space-8)", color:"var(--color-text)" }}>
            {show.name}
          </h3>
          <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)", lineHeight:1.55, flex:1, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", marginBottom:"var(--space-4)" }}>
            {show.description}
          </p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width:`${Math.min((show.photoCount/130)*100,100)}%` }}/>
          </div>
          <div style={{ display:"flex", gap:"var(--space-4)", paddingTop:"var(--space-3)", flexWrap:"wrap" }}>
            <span className="meta-item"><MapPin size={11}/>{show.location}</span>
            <span className="meta-item"><Calendar size={11}/>{show.date} {show.year}</span>
          </div>
        </div>
      </Link>
    </>
  );
}