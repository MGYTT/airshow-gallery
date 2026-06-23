"use client";

import {
  useState, useEffect, useRef, useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { MappedStory, MappedStoryFrame } from "@/lib/supabase/types";

// ─────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────
function ProgressBar({
  frames, current, progress, onSeek,
}: {
  frames: MappedStoryFrame[];
  current: number;
  progress: number;   // 0–1 dla aktywnej klatki
  onSeek: (i: number) => void;
}) {
  return (
    <div style={{
      display: "flex", gap: 3, padding: "var(--space-3) var(--space-4) 0",
      position: "relative", zIndex: 10,
    }}>
      {frames.map((_, i) => (
        <button
          key={i}
          onClick={() => onSeek(i)}
          aria-label={`Przejdź do klatki ${i + 1}`}
          style={{
            flex: 1, height: 3, border: "none", cursor: "pointer",
            borderRadius: 99, background: "rgba(255,255,255,.25)",
            padding: 0, position: "relative", overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", inset: 0, borderRadius: 99,
            background: "#fff",
            transform: `scaleX(${
              i < current ? 1 : i === current ? progress : 0
            })`,
            transformOrigin: "left",
            transition: i === current ? "none" : "transform .15s ease",
          }}/>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FRAME: PHOTO
// ─────────────────────────────────────────────────────────────
function PhotoFrame({ frame }: { frame: MappedStoryFrame }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {frame.imageSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={frame.imageSrc}
          alt={frame.imageAlt ?? ""}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,.3) 0%, transparent 35%, transparent 55%, rgba(0,0,0,.75) 100%)",
      }}/>
      {/* Caption */}
      {(frame.caption || frame.aircraft || frame.timestampLabel) && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "var(--space-8) var(--space-6) var(--space-6)",
        }}>
          {frame.timestampLabel && (
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: ".1em",
              textTransform: "uppercase", color: "rgba(255,255,255,.6)",
              marginBottom: "var(--space-2)",
            }}>
              {frame.timestampLabel}
            </p>
          )}
          {frame.aircraft && (
            <p style={{
              fontSize: "var(--text-xs)", fontWeight: 700,
              color: "rgba(255,255,255,.85)", marginBottom: "var(--space-1)",
              background: "rgba(255,255,255,.12)", backdropFilter: "blur(4px)",
              display: "inline-block", padding: "2px 10px",
              borderRadius: 99, border: "1px solid rgba(255,255,255,.18)",
            }}>
              ✈ {frame.aircraft}
            </p>
          )}
          {frame.caption && (
            <p style={{
              fontSize: "var(--text-base)", fontWeight: 700,
              color: "#fff", lineHeight: 1.35,
              marginTop: frame.aircraft ? "var(--space-2)" : 0,
              textShadow: "0 1px 4px rgba(0,0,0,.6)",
            }}>
              {frame.caption}
            </p>
          )}
          {frame.subcaption && (
            <p style={{
              fontSize: "var(--text-xs)", color: "rgba(255,255,255,.65)",
              marginTop: "var(--space-1)", lineHeight: 1.5,
            }}>
              {frame.subcaption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FRAME: TEXT
// ─────────────────────────────────────────────────────────────
function TextFrame({ frame, accentColor }: { frame: MappedStoryFrame; accentColor: string }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `linear-gradient(145deg, #0d0d0d 0%, #1a1a1a 100%)`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "var(--space-8)",
      textAlign: "center",
    }}>
      {/* Dekoracyjna linia */}
      <div style={{
        width: 48, height: 3, borderRadius: 99,
        background: accentColor, marginBottom: "var(--space-6)",
      }}/>
      {frame.timestampLabel && (
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: ".12em",
          textTransform: "uppercase", color: accentColor,
          marginBottom: "var(--space-4)",
        }}>
          {frame.timestampLabel}
        </p>
      )}
      {frame.caption && (
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
          fontWeight: 900, color: "#fff",
          lineHeight: 1.15, letterSpacing: "-0.03em",
          marginBottom: "var(--space-4)",
        }}>
          {frame.caption}
        </p>
      )}
      {frame.subcaption && (
        <p style={{
          fontSize: "var(--text-sm)", color: "rgba(255,255,255,.55)",
          lineHeight: 1.65, maxWidth: "36ch",
        }}>
          {frame.subcaption}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FRAME: STAT
// ─────────────────────────────────────────────────────────────
function StatFrame({ frame, accentColor }: { frame: MappedStoryFrame; accentColor: string }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `linear-gradient(145deg, #0a0a0a 0%, #141414 100%)`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "var(--space-8)",
      textAlign: "center",
    }}>
      {frame.imageSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={frame.imageSrc} alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .12 }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        {frame.timestampLabel && (
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: ".1em",
            textTransform: "uppercase", color: "rgba(255,255,255,.4)",
            marginBottom: "var(--space-6)",
          }}>
            {frame.timestampLabel}
          </p>
        )}
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(4rem, 15vw, 8rem)",
          fontWeight: 900, lineHeight: 1,
          color: accentColor,
          letterSpacing: "-0.05em",
          fontVariantNumeric: "tabular-nums",
          textShadow: `0 0 80px ${accentColor}55`,
        }}>
          {frame.statValue}
        </p>
        {frame.statLabel && (
          <p style={{
            fontSize: "var(--text-base)", fontWeight: 600,
            color: "rgba(255,255,255,.75)", marginTop: "var(--space-3)",
            textTransform: "uppercase", letterSpacing: ".06em",
          }}>
            {frame.statLabel}
          </p>
        )}
        {frame.caption && (
          <p style={{
            fontSize: "var(--text-xs)", color: "rgba(255,255,255,.35)",
            marginTop: "var(--space-4)", maxWidth: "30ch",
          }}>
            {frame.caption}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FRAME: FACT
// ─────────────────────────────────────────────────────────────
function FactFrame({ frame, accentColor }: { frame: MappedStoryFrame; accentColor: string }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `linear-gradient(145deg, #0c0c0c 0%, #161616 100%)`,
      display: "flex", flexDirection: "column",
      alignItems: "flex-start", justifyContent: "center",
      padding: "var(--space-10) var(--space-8)",
    }}>
      {/* Wielki cudzysłów */}
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(5rem, 18vw, 10rem)",
        fontWeight: 900, lineHeight: 0.8,
        color: accentColor, opacity: .25,
        marginBottom: "var(--space-2)",
        userSelect: "none",
      }}>
        "
      </div>
      <p style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(1.2rem, 3.5vw, 2rem)",
        fontWeight: 700, color: "#fff",
        lineHeight: 1.35, letterSpacing: "-0.02em",
        marginBottom: "var(--space-5)",
      }}>
        {frame.factText ?? frame.caption}
      </p>
      {frame.subcaption && (
        <p style={{
          fontSize: "var(--text-xs)", color: "rgba(255,255,255,.45)",
          borderLeft: `3px solid ${accentColor}`,
          paddingLeft: "var(--space-3)",
          lineHeight: 1.6,
        }}>
          {frame.subcaption}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RENDER FRAME — dispatcher
// ─────────────────────────────────────────────────────────────
function RenderFrame({ frame, accentColor }: { frame: MappedStoryFrame; accentColor: string }) {
  switch (frame.type) {
    case "photo":
    case "burst":  return <PhotoFrame frame={frame}/>;
    case "text":   return <TextFrame  frame={frame} accentColor={accentColor}/>;
    case "stat":   return <StatFrame  frame={frame} accentColor={accentColor}/>;
    case "fact":   return <FactFrame  frame={frame} accentColor={accentColor}/>;
    default:       return <PhotoFrame frame={frame}/>;
  }
}

// ─────────────────────────────────────────────────────────────
// STORY PLAYER
// ─────────────────────────────────────────────────────────────
interface StoryPlayerProps {
  stories:      MappedStory[];
  initialIndex: number;          // który story startuje
  onClose:      () => void;
  showTitle?:   string;
  showId?:      string;
}

export default function StoryPlayer({
  stories, initialIndex, onClose, showTitle, showId,
}: StoryPlayerProps) {
  const [storyIdx, setStoryIdx] = useState(initialIndex);
  const [frameIdx, setFrameIdx] = useState(0);
  const [progress, setProgress] = useState(0);   // 0–1
  const [paused, setPaused]     = useState(false);
  const [animDir, setAnimDir]   = useState<"next"|"prev">("next");
  const [visible, setVisible]   = useState(false);

  const rafRef      = useRef<number>(0);
  const startRef    = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const touchXRef   = useRef<number | null>(null);
  const touchYRef   = useRef<number | null>(null);

  const story  = stories[storyIdx];
  const frames = story?.frames ?? [];
  const frame  = frames[frameIdx];
  const DURATION = (frame?.duration ?? 5) * 1000;

  // Wejście z animacją
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Inkrementacja progress ────────────────────────────────
  const tick = useCallback((ts: number) => {
    if (!startRef.current) startRef.current = ts;
    const elapsed = ts - startRef.current + pausedAtRef.current;
    const p = Math.min(elapsed / DURATION, 1);
    setProgress(p);
    if (p < 1) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      goNext();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameIdx, storyIdx, DURATION]);

  useEffect(() => {
    if (paused) return;
    startRef.current  = 0;
    pausedAtRef.current = 0;
    setProgress(0);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [frameIdx, storyIdx, paused, tick]);

  // ── Pause / resume ────────────────────────────────────────
  useEffect(() => {
    if (paused) {
      cancelAnimationFrame(rafRef.current);
      pausedAtRef.current += performance.now() - (startRef.current || performance.now());
    } else {
      startRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // ── Nawigacja ────────────────────────────────────────────
  function goNext() {
    setAnimDir("next");
    cancelAnimationFrame(rafRef.current);
    pausedAtRef.current = 0;
    if (frameIdx < frames.length - 1) {
      setFrameIdx(f => f + 1);
    } else if (storyIdx < stories.length - 1) {
      setStoryIdx(s => s + 1);
      setFrameIdx(0);
    } else {
      handleClose();
    }
  }

  function goPrev() {
    setAnimDir("prev");
    cancelAnimationFrame(rafRef.current);
    pausedAtRef.current = 0;
    if (frameIdx > 0) {
      setFrameIdx(f => f - 1);
    } else if (storyIdx > 0) {
      setStoryIdx(s => s - 1);
      setFrameIdx(0);
    }
  }

  function seekTo(i: number) {
    cancelAnimationFrame(rafRef.current);
    pausedAtRef.current = 0;
    setFrameIdx(i);
    setPaused(false);
  }

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 280);
  }

  // ── Klawiatura ───────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")      handleClose();
      if (e.key === "ArrowRight")  goNext();
      if (e.key === "ArrowLeft")   goPrev();
      if (e.key === " ")           { e.preventDefault(); setPaused(p => !p); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameIdx, storyIdx]);

  // ── Swipe ────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    touchXRef.current = e.touches[0].clientX;
    touchYRef.current = e.touches[0].clientY;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchXRef.current === null || touchYRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchXRef.current;
    const dy = e.changedTouches[0].clientY - touchYRef.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? goNext() : goPrev();
    }
    // Swipe w dół — zamknij
    if (dy > 80 && Math.abs(dy) > Math.abs(dx)) handleClose();
    touchXRef.current = null;
    touchYRef.current = null;
  }

  // ── Long press = pause ────────────────────────────────────
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onPointerDown() {
    pressTimer.current = setTimeout(() => setPaused(true), 150);
  }
  function onPointerUp() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setPaused(false);
  }

  if (!story || !frame) return null;

  return (
    <>
      <style>{`
        .sp-wrap{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.9);backdrop-filter:blur(6px);transition:opacity .28s ease;opacity:0}
        .sp-wrap.visible{opacity:1}
        .sp-card{position:relative;width:min(420px,100vw);height:min(740px,100dvh);border-radius:clamp(0px,2vw,20px);overflow:hidden;background:#111;box-shadow:0 32px 80px rgba(0,0,0,.7);transition:transform .28s cubic-bezier(.16,1,.3,1);transform:scale(.94)}
        .sp-wrap.visible .sp-card{transform:scale(1)}
        .sp-frame{position:absolute;inset:0;animation:frameIn .22s cubic-bezier(.16,1,.3,1)}
        @keyframes frameIn{from{opacity:0;transform:scale(1.03)}to{opacity:1;transform:scale(1)}}
        .sp-header{position:absolute;top:0;left:0;right:0;z-index:20;padding-bottom:var(--space-3)}
        .sp-tap-prev{position:absolute;left:0;top:0;bottom:0;width:35%;z-index:15;cursor:pointer;background:none;border:none}
        .sp-tap-next{position:absolute;right:0;top:0;bottom:0;width:35%;z-index:15;cursor:pointer;background:none;border:none}
        .sp-nav-hint{position:absolute;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.25);pointer-events:none;transition:color .15s}
        .sp-tap-prev:hover .sp-nav-hint{color:rgba(255,255,255,.5)}
        .sp-tap-next:hover .sp-nav-hint{color:rgba(255,255,255,.5)}
        .sp-controls{position:absolute;top:var(--space-3);right:var(--space-3);z-index:30;display:flex;gap:var(--space-2)}
        .sp-ctrl-btn{width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.45);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.12);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s}
        .sp-ctrl-btn:hover{background:rgba(0,0,0,.7)}
        .sp-story-header{position:absolute;top:0;left:0;right:0;z-index:25;background:linear-gradient(to bottom,rgba(0,0,0,.55),transparent);padding:0 var(--space-3) var(--space-4)}

        /* Sidebar — inne stories */
        .sp-sidebar{display:none}
        @media(min-width:700px){
          .sp-sidebar{display:flex;flex-direction:column;gap:var(--space-3);margin-left:var(--space-5);max-width:200px}
          .sp-sidebar-item{border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;opacity:.55;transition:opacity .2s,transform .2s;position:relative;aspect-ratio:9/16;width:100px;flex-shrink:0}
          .sp-sidebar-item:hover{opacity:.85;transform:scale(1.02)}
          .sp-sidebar-item.active{opacity:1;outline:2px solid #fff;outline-offset:2px}
        }
        @media(max-width:699px){.sp-wrap{padding:0}}
      `}</style>

      <div
        className={`sp-wrap ${visible ? "visible" : ""}`}
        onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Sidebar — inne relacje (desktop) */}
        {stories.length > 1 && (
          <div className="sp-sidebar">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.4)", marginBottom: "var(--space-1)" }}>
              Relacje
            </p>
            {stories.map((s, i) => (
              <div
                key={s.id}
                className={`sp-sidebar-item ${i === storyIdx ? "active" : ""}`}
                onClick={() => { setStoryIdx(i); setFrameIdx(0); setPaused(false); }}
              >
                {s.coverImage
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={s.coverImage} alt={s.title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <div style={{ width:"100%", height:"100%", background:"#222", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize: 20 }}>✈</span></div>
                }
                <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(to top,rgba(0,0,0,.8),transparent)", padding:"var(--space-3) var(--space-2)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color:"#fff", lineHeight:1.2 }}>{s.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Główna karta */}
        <div
          className="sp-card"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* Klatka z animacją */}
          <div key={`${storyIdx}-${frameIdx}`} className="sp-frame">
            <RenderFrame frame={frame} accentColor={story.accentColor}/>
          </div>

          {/* Header: progress + meta */}
          <div className="sp-story-header">
            <ProgressBar
              frames={frames}
              current={frameIdx}
              progress={progress}
              onSeek={seekTo}
            />
            {/* Story info */}
            <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", padding:"var(--space-3) var(--space-1) 0" }}>
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                background: story.coverImage ? "transparent" : story.accentColor,
                border: `2px solid ${story.accentColor}`,
                overflow: "hidden",
              }}>
                {story.coverImage
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={story.coverImage} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize: 14 }}>✈</div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {story.title}
                </p>
                {story.subtitle && (
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,.55)", lineHeight: 1.2 }}>
                    {story.subtitle}
                  </p>
                )}
              </div>
              {/* Kontrolki */}
              <div style={{ display:"flex", gap:"var(--space-1)", flexShrink: 0 }}>
                <button
                  className="sp-ctrl-btn"
                  onClick={e => { e.stopPropagation(); setPaused(p => !p); }}
                  aria-label={paused ? "Wznów" : "Pauza"}
                >
                  {paused ? <Play size={14}/> : <Pause size={14}/>}
                </button>
                {showId && (
                  <Link
                    href={`/pokaz/${showId}`}
                    className="sp-ctrl-btn"
                    onClick={e => e.stopPropagation()}
                    aria-label="Otwórz pokaz"
                    style={{ textDecoration:"none" }}
                  >
                    <ExternalLink size={14}/>
                  </Link>
                )}
                <button className="sp-ctrl-btn" onClick={e => { e.stopPropagation(); handleClose(); }} aria-label="Zamknij">
                  <X size={14}/>
                </button>
              </div>
            </div>
          </div>

          {/* Tap zones */}
          <button
            className="sp-tap-prev"
            onClick={e => { e.stopPropagation(); goPrev(); }}
            aria-label="Poprzednia klatka"
          >
            <ChevronLeft size={20} className="sp-nav-hint" style={{ left:"var(--space-2)", position:"absolute", top:"50%", transform:"translateY(-50%)" }}/>
          </button>
          <button
            className="sp-tap-next"
            onClick={e => { e.stopPropagation(); goNext(); }}
            aria-label="Następna klatka"
          >
            <ChevronRight size={20} className="sp-nav-hint" style={{ right:"var(--space-2)", position:"absolute", top:"50%", transform:"translateY(-50%)" }}/>
          </button>

          {/* Paused overlay */}
          {paused && (
            <div style={{
              position:"absolute", inset:0, zIndex:50,
              display:"flex", alignItems:"center", justifyContent:"center",
              pointerEvents:"none",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius:"50%",
                background:"rgba(0,0,0,.55)", backdropFilter:"blur(8px)",
                display:"flex", alignItems:"center", justifyContent:"center",
                border:"1px solid rgba(255,255,255,.15)",
              }}>
                <Pause size={28} style={{ color:"#fff" }}/>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}