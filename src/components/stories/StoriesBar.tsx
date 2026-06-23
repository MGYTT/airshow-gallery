"use client";

import { useState, useEffect, useRef } from "react";
import StoryPlayer from "./StoryPlayer";
import type { MappedStory } from "@/lib/supabase/types";

interface StoriesBarProps {
  showId?:   string;   // jeśli podane — filtruje po pokazu
  showTitle?: string;
}

export default function StoriesBar({ showId, showTitle }: StoriesBarProps) {
  const [stories, setStories]   = useState<MappedStory[]>([]);
  const [loading, setLoading]   = useState(true);
  const [openIdx, setOpenIdx]   = useState<number | null>(null);
  const scrollRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const url = showId
        ? `/api/stories?show_id=${showId}`
        : `/api/stories`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStories(data);
      }
      setLoading(false);
    }
    load();
  }, [showId]);

  if (loading || stories.length === 0) return null;

  return (
    <>
      <style>{`
        .sb-wrap{padding:var(--space-5) 0}
        .sb-label{font-size:var(--text-xs);font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--color-text-faint);margin-bottom:var(--space-3);padding:0 var(--space-1)}
        .sb-scroll{display:flex;gap:var(--space-4);overflow-x:auto;padding-bottom:var(--space-2);scrollbar-width:none;-webkit-overflow-scrolling:touch}
        .sb-scroll::-webkit-scrollbar{display:none}
        .sb-item{display:flex;flex-direction:column;align-items:center;gap:var(--space-2);flex-shrink:0;cursor:pointer;border:none;background:none;padding:0}
        .sb-ring{border-radius:50%;padding:3px;background:conic-gradient(from 0deg, var(--accent, #01696f), #f97316, var(--accent, #01696f));flex-shrink:0}
        .sb-ring-inner{border-radius:50%;border:2px solid var(--color-bg);overflow:hidden}
        .sb-thumb{display:block;object-fit:cover;border-radius:50%}
        .sb-thumb-placeholder{border-radius:50%;background:var(--color-surface-offset);display:flex;align-items:center;justify-content:center;font-size:1.4rem}
        .sb-item-title{font-size:11px;font-weight:600;color:var(--color-text-muted);max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
        .sb-item:hover .sb-ring{filter:brightness(1.15)}
        .sb-item:hover .sb-item-title{color:var(--color-text)}
        @media(max-width:480px){.sb-scroll{gap:var(--space-3)}}
      `}</style>

      <div className="sb-wrap">
        <p className="sb-label">Relacje</p>
        <div className="sb-scroll" ref={scrollRef}>
          {stories.map((story, i) => {
            const size = 64;
            return (
              <button
                key={story.id}
                className="sb-item"
                onClick={() => setOpenIdx(i)}
                aria-label={`Otwórz relację: ${story.title}`}
                style={{ "--accent": story.accentColor } as React.CSSProperties}
              >
                <div className="sb-ring" style={{ width: size + 6, height: size + 6 }}>
                  <div className="sb-ring-inner" style={{ width: size, height: size }}>
                    {story.coverImage
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={story.coverImage} alt={story.title} width={size} height={size} className="sb-thumb"/>
                      : <div className="sb-thumb-placeholder" style={{ width: size, height: size }}>✈</div>
                    }
                  </div>
                </div>
                <span className="sb-item-title">{story.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {openIdx !== null && (
        <StoryPlayer
          stories={stories}
          initialIndex={openIdx}
          onClose={() => setOpenIdx(null)}
          showTitle={showTitle}
          showId={showId}
        />
      )}
    </>
  );
}