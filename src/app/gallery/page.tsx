"use client";

import {
  useState, useMemo, useCallback,
  useEffect, useRef, Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ShowCard from "@/components/ShowCard";
import {
  Filter, Grid, LayoutGrid, X,
  ChevronLeft, ChevronRight, ZoomIn,
  Images, Plane, MapPin, Calendar,
  Loader2, Search, ArrowUpDown,
  SlidersHorizontal, Check, AlertTriangle, RotateCw,
} from "lucide-react";

// ── Typy ─────────────────────────────────────────────────────
interface AirShow {
  id: string; name: string; location: string; date: string;
  year: number; description: string; coverImage: string;
  photoCount: number; tags: string[]; featured: boolean; published: boolean;
}
interface Photo {
  id: string; showId: string; src: string; alt: string;
  aircraft: string; width: number; height: number;
  tags: string[]; featured: boolean;
}
type SortKey = "newest" | "oldest" | "alpha" | "photos";
type ViewMode = "grid" | "shows";

// ── Hook: debounce ───────────────────────────────────────────
function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─────────────────────────────────────────────────────────────
// LIGHTBOX z swipe + focus trap
// ─────────────────────────────────────────────────────────────
function Lightbox({ list, index, onClose, onPrev, onNext, shows }: {
  list: Photo[]; index: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
  shows: AirShow[];
}) {
  const photo   = list[index];
  const show    = shows.find(s => s.id === photo?.showId);
  const touchX  = useRef<number | null>(null);
  const touchY  = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext]);

  // Preload sąsiednich zdjęć — szybsze przełączanie
  useEffect(() => {
    if (list.length === 0) return;
    [1, -1].forEach(off => {
      const target = list[(index + off + list.length) % list.length];
      if (target) { const img = new window.Image(); img.src = target.src; }
    });
  }, [index, list]);

  function handleTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null || touchY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) dx < 0 ? onNext() : onPrev();
    touchX.current = null; touchY.current = null;
  }

  if (!photo) return null;

  return (
    <>
      <style>{`
        .lb{position:fixed;inset:0;background:rgba(0,0,0,.96);z-index:9999;display:flex;align-items:center;justify-content:center;animation:lbIn .18s ease}
        @keyframes lbIn{from{opacity:0}to{opacity:1}}
        .lb-btn{position:fixed;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s}
        .lb-btn:hover{background:rgba(255,255,255,.18)}
        .lb-btn:focus-visible{outline:2px solid #fff;outline-offset:2px}
        .lb-close{top:var(--space-5);right:var(--space-5);width:44px;height:44px;border-radius:var(--radius-full)}
        .lb-prev,.lb-next{top:50%;transform:translateY(-50%);width:48px;height:72px;border-radius:var(--radius-lg)}
        .lb-prev{left:var(--space-5)}.lb-next{right:var(--space-5)}
        .lb-prev:hover{transform:translateY(-50%) translateX(-2px)}.lb-next:hover{transform:translateY(-50%) translateX(2px)}
        .lb-counter{position:fixed;top:var(--space-5);left:50%;transform:translateX(-50%);background:rgba(0,0,0,.55);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.8);font-size:var(--text-xs);font-weight:600;padding:var(--space-2) var(--space-4);border-radius:var(--radius-full);white-space:nowrap;font-variant-numeric:tabular-nums}
        .lb-img-wrap{position:relative;max-width:min(90vw,1200px);max-height:82dvh;width:auto;height:auto}
        .lb-img{display:block;max-width:min(90vw,1200px);max-height:82dvh;width:auto;height:auto;border-radius:var(--radius-xl);box-shadow:0 32px 80px rgba(0,0,0,.6);object-fit:contain}
        .lb-bar{position:fixed;bottom:0;left:0;right:0;padding:var(--space-4) var(--space-8);background:linear-gradient(to top,rgba(0,0,0,.85),transparent);display:flex;align-items:flex-end;justify-content:space-between;gap:var(--space-4);flex-wrap:wrap}
        .lb-hint{position:fixed;bottom:var(--space-16);left:50%;transform:translateX(-50%);font-size:10px;color:rgba(255,255,255,.25);letter-spacing:.06em;text-transform:uppercase;display:none}
        @media(hover:none){.lb-hint{display:block}.lb-prev,.lb-next{opacity:.35}}
        @media(max-width:640px){.lb-prev{left:var(--space-2)}.lb-next{right:var(--space-2)}.lb-bar{padding:var(--space-3) var(--space-4)}}
      `}</style>
      <div
        className="lb"
        role="dialog"
        aria-modal="true"
        aria-label={`Podgląd zdjęcia: ${photo.alt}`}
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button ref={closeRef} className="lb-btn lb-close" onClick={onClose} aria-label="Zamknij podgląd"><X size={18}/></button>
        <div className="lb-counter" aria-live="polite">{index + 1} / {list.length}</div>
        <button className="lb-btn lb-prev" onClick={e=>{e.stopPropagation();onPrev()}} aria-label="Poprzednie zdjęcie"><ChevronLeft size={22}/></button>
        <img key={photo.id} src={photo.src} alt={photo.alt} className="lb-img" onClick={e=>e.stopPropagation()}/>
        <button className="lb-btn lb-next" onClick={e=>{e.stopPropagation();onNext()}} aria-label="Następne zdjęcie"><ChevronRight size={22}/></button>
        <div className="lb-hint">← przesuń →</div>
        <div className="lb-bar" onClick={e=>e.stopPropagation()}>
          <div>
            <p style={{fontSize:"var(--text-sm)",fontWeight:700,color:"#fff",marginBottom:4}}>{photo.aircraft}</p>
            <p style={{fontSize:"var(--text-xs)",color:"rgba(255,255,255,.55)"}}>{photo.alt}</p>
          </div>
          {show && (
            <Link href={`/pokaz/${show.id}`} style={{display:"inline-flex",alignItems:"center",gap:"var(--space-2)",fontSize:"var(--text-xs)",fontWeight:600,color:"rgba(255,255,255,.8)",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",padding:"var(--space-2) var(--space-3)",borderRadius:"var(--radius-md)",textDecoration:"none",flexShrink:0,backdropFilter:"blur(6px)"}}>
              <Images size={12}/>{show.name}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MASONRY
// ─────────────────────────────────────────────────────────────
function PhotoMasonry({ list, onOpen }: { list: Photo[]; onOpen: (i: number) => void }) {
  if (list.length === 0) return (
    <div style={{minHeight:"40dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"var(--space-4)",color:"var(--color-text-faint)",paddingBottom:"var(--space-16)"}}>
      <Plane size={40} style={{opacity:.25}}/>
      <p style={{fontSize:"var(--text-sm)",fontWeight:600}}>Brak zdjęć pasujących do filtrów</p>
    </div>
  );
  return (
    <>
      <style>{`
        .masonry{columns:4 200px;column-gap:var(--space-3);padding-bottom:var(--space-20)}
        @media(max-width:600px){.masonry{columns:2 130px}}
        .m-item{break-inside:avoid;margin-bottom:var(--space-3);border-radius:var(--radius-lg);overflow:hidden;cursor:zoom-in;position:relative;background:var(--color-surface-offset)}
        .m-item img{display:block;width:100%;height:auto;transition:transform .4s cubic-bezier(.16,1,.3,1)}
        .m-item:hover img{transform:scale(1.04)}
        .m-item:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px}
        .m-overlay{position:absolute;inset:0;background:rgba(0,0,0,.28);opacity:0;transition:opacity .2s;display:flex;align-items:center;justify-content:center;color:#fff}
        .m-item:hover .m-overlay,.m-item:focus-visible .m-overlay{opacity:1}
        .m-caption{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,.72),transparent);padding:var(--space-6) var(--space-3) var(--space-3);opacity:0;transition:opacity .2s}
        .m-item:hover .m-caption,.m-item:focus-visible .m-caption{opacity:1}
      `}</style>
      <div className="masonry">
        {list.map((photo, i) => (
          <div
            key={photo.id}
            className="m-item"
            onClick={()=>onOpen(i)}
            role="button"
            tabIndex={0}
            aria-label={`Powiększ zdjęcie: ${photo.alt || photo.aircraft}`}
            onKeyDown={e=>{ if (e.key==="Enter" || e.key===" ") { e.preventDefault(); onOpen(i); } }}
          >
            <img
              src={photo.src}
              alt={photo.alt || `Zdjęcie z pokazu lotniczego — ${photo.aircraft}`}
              width={photo.width}
              height={photo.height}
              loading={i<8?"eager":"lazy"}
              decoding="async"
              style={{aspectRatio:`${photo.width}/${photo.height}`}}
            />
            <div className="m-overlay"><ZoomIn size={26}/></div>
            <div className="m-caption"><p style={{fontSize:"var(--text-xs)",fontWeight:600,color:"#fff",lineHeight:1.3}}>{photo.aircraft}</p></div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MASONRY SKELETON (loading)
// ─────────────────────────────────────────────────────────────
function MasonrySkeleton() {
  const heights = [220, 300, 180, 260, 240, 320, 200, 280, 230, 190, 270, 210];
  return (
    <>
      <style>{`
        @keyframes gShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .g-skeleton{columns:4 200px;column-gap:var(--space-3);padding-bottom:var(--space-20)}
        @media(max-width:600px){.g-skeleton{columns:2 130px}}
        .g-sk-item{break-inside:avoid;margin-bottom:var(--space-3);border-radius:var(--radius-lg);background:linear-gradient(90deg,var(--color-surface-offset) 25%,var(--color-surface-dynamic,var(--color-surface-offset)) 50%,var(--color-surface-offset) 75%);background-size:200% 100%;animation:gShimmer 1.5s ease-in-out infinite}
      `}</style>
      <div className="g-skeleton">
        {heights.map((h,i)=><div key={i} className="g-sk-item" style={{height:h}}/>)}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// BOTTOM SHEET — mobile filter drawer
// ─────────────────────────────────────────────────────────────
function BottomSheet({ open, onClose, children, title }: {
  open: boolean; onClose: () => void; children: React.ReactNode; title: string;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <style>{`
        .bs-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(2px);z-index:800;transition:opacity .25s}
        .bs-overlay.hidden{opacity:0;pointer-events:none}
        .bs-sheet{position:fixed;left:0;right:0;bottom:0;z-index:801;background:var(--color-surface);border-radius:var(--radius-xl) var(--radius-xl) 0 0;box-shadow:0 -8px 40px rgba(0,0,0,.18);transition:transform .3s cubic-bezier(.16,1,.3,1);max-height:88dvh;display:flex;flex-direction:column;overflow:hidden}
        .bs-sheet.hidden{transform:translateY(100%)}
        .bs-handle{width:36px;height:4px;border-radius:var(--radius-full);background:var(--color-border);margin:var(--space-3) auto var(--space-1);flex-shrink:0}
        .bs-body{overflow-y:auto;flex:1;padding:var(--space-2) var(--space-5) var(--space-8)}
        .bs-body::-webkit-scrollbar{width:4px}
        .bs-body::-webkit-scrollbar-thumb{background:var(--color-border);border-radius:var(--radius-full)}
      `}</style>
      <div className={`bs-overlay ${open?"":"hidden"}`} onClick={onClose} aria-hidden={!open}/>
      <div className={`bs-sheet ${open?"":"hidden"}`} role="dialog" aria-modal="true" aria-label={title} aria-hidden={!open}>
        <div className="bs-handle"/>
        <div className="bs-body">{children}</div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function SelectRow({ icon: Icon, label, value, onChange, options }: {
  icon: React.ElementType; label: string; value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"var(--space-3) 0",borderBottom:"1px solid var(--color-divider)"}}>
      <div style={{display:"flex",alignItems:"center",gap:"var(--space-3)"}}>
        <Icon size={15} style={{color:"var(--color-text-faint)",flexShrink:0}}/>
        <span style={{fontSize:"var(--text-sm)",fontWeight:600}}>{label}</span>
      </div>
      <select
        aria-label={label}
        value={value}
        onChange={e=>onChange(e.target.value)}
        style={{fontSize:"var(--text-sm)",fontWeight:500,color:"var(--color-accent)",background:"none",border:"none",cursor:"pointer",padding:"var(--space-1) 0",outline:"none",textAlign:"right",maxWidth:160}}
      >
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GALLERY CONTENT
// ─────────────────────────────────────────────────────────────
function GalleryContent() {
  const searchParams = useSearchParams();
  const initialShow  = searchParams.get("show") ?? "all";

  const [shows, setShows]     = useState<AirShow[]>([]);
  const [photos, setPhotos]   = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // State
  const [activeShow, setActiveShow]       = useState(initialShow);
  const [view, setView]                   = useState<ViewMode>("grid");
  const [lbIndex, setLbIndex]             = useState<number | null>(null);
  const [search, setSearch]               = useState("");
  const [filterYear, setFilterYear]       = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterTag, setFilterTag]         = useState("all");
  const [sort, setSort]                   = useState<SortKey>("newest");
  const [sheetOpen, setSheetOpen]         = useState(false);
  const [showsSheetOpen, setShowsSheetOpen] = useState(false);

  const debouncedSearch = useDebounced(search, 200);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, pRes] = await Promise.all([fetch("/api/shows"), fetch("/api/photos")]);
      if (!sRes.ok || !pRes.ok) throw new Error("Nie udało się pobrać danych galerii.");
      const sd: Record<string,unknown>[] = await sRes.json();
      const pd: Record<string,unknown>[] = await pRes.json();
      setShows(sd.map(s=>({
        id:s.id as string, name:s.name as string, location:s.location as string,
        date:s.date as string, year:s.year as number,
        description:(s.description as string)??"", coverImage:(s.coverImage as string)??"",
        photoCount:(s.photoCount as number)??0, tags:(s.tags as string[])??[],
        featured:Boolean(s.featured), published:Boolean(s.published),
      })));
      setPhotos(pd.map(p=>({
        id:p.id as string, showId:p.showId as string, src:p.src as string,
        alt:(p.alt as string)??"", aircraft:(p.aircraft as string)??"",
        width:(p.width as number)??1200, height:(p.height as number)??800,
        tags:(p.tags as string[])??[], featured:Boolean(p.featured),
      })));
    } catch {
      setError("Nie udało się załadować galerii. Sprawdź połączenie i spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Opcje filtrów
  const years     = useMemo(()=>[...new Set(shows.map(s=>s.year))].sort((a,b)=>b-a),[shows]);
  const countries = useMemo(()=>[...new Set(shows.map(s=>s.location.split(",").pop()?.trim()??""))].filter(Boolean).sort(),[shows]);
  const allTags   = useMemo(()=>[...new Set(photos.flatMap(p=>p.tags).filter(Boolean))].sort(),[photos]);

  const activeFilterCount = useMemo(()=>[
    filterYear!=="all", filterCountry!=="all", filterTag!=="all", debouncedSearch.trim()!==""
  ].filter(Boolean).length, [filterYear,filterCountry,filterTag,debouncedSearch]);

  const clearFilters = useCallback(() => {
    setSearch(""); setFilterYear("all"); setFilterCountry("all");
    setFilterTag("all"); setActiveShow("all");
  }, []);

  // Filtrowane zdjęcia
  const filteredPhotos = useMemo<Photo[]>(()=>{
    const q = debouncedSearch.toLowerCase().trim();
    let list = [...photos];
    if (activeShow !== "all") list = list.filter(p=>p.showId===activeShow);
    if (q) list = list.filter(p=>p.aircraft.toLowerCase().includes(q)||p.alt.toLowerCase().includes(q)||p.tags.some(t=>t.toLowerCase().includes(q)));
    if (filterYear!=="all"||filterCountry!=="all") {
      const ids = new Set(shows.filter(s=>{
        const country = s.location.split(",").pop()?.trim()??"";
        return (filterYear==="all"||s.year===Number(filterYear))&&(filterCountry==="all"||country===filterCountry);
      }).map(s=>s.id));
      list = list.filter(p=>ids.has(p.showId));
    }
    if (filterTag!=="all") list = list.filter(p=>p.tags.includes(filterTag));
    return list;
  }, [photos, activeShow, debouncedSearch, filterYear, filterCountry, filterTag, shows]);

  // Sortowane pokazy
  const sortedShows = useMemo<AirShow[]>(()=>{
    const q = debouncedSearch.toLowerCase().trim();
    let list = [...shows];
    if (q) list = list.filter(s=>s.name.toLowerCase().includes(q)||s.location.toLowerCase().includes(q));
    if (filterYear!=="all")    list = list.filter(s=>s.year===Number(filterYear));
    if (filterCountry!=="all") list = list.filter(s=>s.location.split(",").pop()?.trim()===filterCountry);
    if (filterTag!=="all")     list = list.filter(s=>s.tags.includes(filterTag));
    switch(sort){
      case "newest": list.sort((a,b)=>b.year-a.year); break;
      case "oldest": list.sort((a,b)=>a.year-b.year); break;
      case "alpha":  list.sort((a,b)=>a.name.localeCompare(b.name,"pl")); break;
      case "photos": list.sort((a,b)=>b.photoCount-a.photoCount); break;
      default: break;
    }
    return list;
  }, [shows, debouncedSearch, filterYear, filterCountry, filterTag, sort]);

  const total = filteredPhotos.length;

  const openLb  = useCallback((i:number)=>setLbIndex(i),[]);
  const closeLb = useCallback(()=>setLbIndex(null),[]);
  const prevLb  = useCallback(()=>setLbIndex(p=>p===null||total===0?null:(p-1+total)%total),[total]);
  const nextLb  = useCallback(()=>setLbIndex(p=>p===null||total===0?null:(p+1)%total),[total]);

  // Zamknij lightbox jeśli lista się skróciła (np. po zmianie filtra)
  useEffect(() => {
    if (lbIndex !== null && lbIndex >= total) setLbIndex(total > 0 ? total - 1 : null);
  }, [total, lbIndex]);

  const activeShowData = useMemo(()=>shows.find(s=>s.id===activeShow),[shows,activeShow]);

  // ── Error state ──
  if (error) return (
    <div style={{minHeight:"60dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"var(--space-4)",color:"var(--color-text-faint)",textAlign:"center",padding:"var(--space-8)"}}>
      <AlertTriangle size={36} style={{color:"var(--color-error, #a12c7b)",opacity:.7}}/>
      <p style={{fontSize:"var(--text-sm)",fontWeight:600,color:"var(--color-text)"}}>{error}</p>
      <button
        onClick={loadData}
        style={{display:"inline-flex",alignItems:"center",gap:"var(--space-2)",padding:"var(--space-2) var(--space-5)",borderRadius:"var(--radius-md)",background:"var(--color-accent)",color:"#fff",border:"none",cursor:"pointer",fontSize:"var(--text-sm)",fontWeight:700}}
      >
        <RotateCw size={14}/> Spróbuj ponownie
      </button>
    </div>
  );

  // ── Loading state ──
  if (loading) return (
    <div className="container" style={{paddingTop:"var(--space-8)"}}>
      <div style={{display:"flex",alignItems:"center",gap:"var(--space-3)",color:"var(--color-text-faint)",marginBottom:"var(--space-6)"}}>
        <Loader2 size={16} style={{animation:"gSpin 1s linear infinite"}}/>
        <style>{`@keyframes gSpin{to{transform:rotate(360deg)}}`}</style>
        <span style={{fontSize:"var(--text-sm)"}}>Ładowanie galerii…</span>
      </div>
      <MasonrySkeleton/>
    </div>
  );

  return (
    <>
      <style>{`
        /* ── Layout ── */
        .g-header{border-bottom:1px solid var(--color-divider);padding:var(--space-12) 0 var(--space-8);background:var(--color-surface);position:relative;overflow:hidden}
        .g-ghost{position:absolute;right:-1%;top:50%;transform:translateY(-50%);font-family:var(--font-display);font-weight:900;font-size:clamp(6rem,18vw,16rem);line-height:1;letter-spacing:-0.06em;color:var(--color-text);opacity:0.03;user-select:none;pointer-events:none}
        .g-meta-chip{display:inline-flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);color:var(--color-text-faint)}

        /* ── Desktop toolbar ── */
        .g-toolbar{position:sticky;top:63px;z-index:50;background:var(--color-bg);border-bottom:1px solid var(--color-divider)}
        .g-toolbar-inner{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) 0;min-height:56px}

        .g-pills{display:flex;gap:var(--space-2);flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
        .g-pills::-webkit-scrollbar{display:none}

        .g-filter-panel{padding:var(--space-3) 0;display:flex;flex-wrap:wrap;gap:var(--space-3);align-items:center;border-bottom:1px solid var(--color-divider);animation:slideDown .2s ease}
        @keyframes slideDown{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}

        .g-mobile-bar{display:none}
        @media(max-width:767px){
          .g-pills{display:none}
          .g-desktop-actions{display:none}
          .g-mobile-bar{display:flex;align-items:center;gap:var(--space-2);padding:var(--space-3) 0;width:100%}
          .g-filter-panel{display:none !important}
        }

        .pill{display:inline-flex;align-items:center;padding:var(--space-2) var(--space-4);border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:600;cursor:pointer;border:1.5px solid;white-space:nowrap;transition:all var(--transition)}

        .icon-action{display:flex;align-items:center;justify-content:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1.5px solid var(--color-border);background:var(--color-surface);color:var(--color-text-muted);font-size:var(--text-xs);font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;flex-shrink:0}
        .icon-action:hover{border-color:var(--color-border-strong, var(--color-border));background:var(--color-surface-offset);color:var(--color-text)}
        .icon-action.active{border-color:var(--color-accent);background:var(--color-accent-subtle);color:var(--color-accent)}
        .icon-action:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px}

        .g-select{padding:var(--space-2) var(--space-8) var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1.5px solid var(--color-border);background:var(--color-surface);color:var(--color-text);font-size:var(--text-xs);font-weight:600;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;min-height:34px}

        .g-search-wrap{position:relative;flex:0 1 220px}
        .g-search-wrap input{padding-left:var(--space-9);font-size:var(--text-xs);min-height:34px}
        .g-search-wrap .search-icon{position:absolute;left:var(--space-3);top:50%;transform:translateY(-50%);color:var(--color-text-faint);pointer-events:none}
        .g-search-wrap .clear-btn{position:absolute;right:var(--space-2);top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--color-text-faint);display:flex}

        .filter-badge{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:var(--radius-full);background:var(--color-accent);color:#fff;font-size:10px;font-weight:800;margin-left:var(--space-1)}

        .g-mobile-search{display:none}
        @media(max-width:767px){
          .g-mobile-search{display:block;padding:var(--space-2) 0 var(--space-3)}
        }

        .show-option{display:flex;align-items:center;justify-content:space-between;padding:var(--space-4) 0;border-bottom:1px solid var(--color-divider);cursor:pointer;gap:var(--space-3)}
        .show-option:last-child{border-bottom:none}
        .show-option:active{background:var(--color-surface-offset)}
        .show-option:focus-visible{outline:2px solid var(--color-accent);outline-offset:-2px}

        .g-empty-shows{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-4);min-height:40dvh;color:var(--color-text-faint);text-align:center;padding:var(--space-8)}

        @keyframes gSpin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── HEADER ── */}
      <div className="g-header">
        <div aria-hidden className="g-ghost">FOTO</div>
        <div className="container" style={{position:"relative",zIndex:1}}>
          <span className="badge" style={{marginBottom:"var(--space-4)"}}>
            <Filter size={11}/> Galeria
          </span>
          <h1 style={{fontFamily:"var(--font-display)",fontWeight:900,fontSize:"var(--text-3xl)",letterSpacing:"-0.04em",lineHeight:1.05,marginBottom:"var(--space-3)"}}>
            {activeShow==="all"
              ? <><span style={{color:"var(--color-accent)"}}>Wszystkie</span> zdjęcia</>
              : (activeShowData?.name ?? "Galeria")}
          </h1>
          <div style={{display:"flex",gap:"var(--space-5)",flexWrap:"wrap",alignItems:"center"}}>
            <span className="g-meta-chip" aria-live="polite">
              <Images size={13}/>
              <strong style={{color:"var(--color-text)",fontVariantNumeric:"tabular-nums"}}>{total}</strong> zdjęć
            </span>
            {activeShow==="all"
              ? <span className="g-meta-chip"><Plane size={13}/><strong style={{color:"var(--color-text)"}}>{shows.length}</strong> pokazów</span>
              : activeShowData && <>
                  <span className="g-meta-chip"><MapPin size={13}/>{activeShowData.location}</span>
                  <span className="g-meta-chip"><Calendar size={13}/>{activeShowData.date||activeShowData.year}</span>
                </>
            }
            {activeFilterCount>0&&(
              <button onClick={clearFilters} style={{display:"inline-flex",alignItems:"center",gap:"var(--space-1)",fontSize:"var(--text-xs)",fontWeight:600,color:"var(--color-accent)",background:"none",border:"none",cursor:"pointer",padding:0}}>
                <X size={11}/> Wyczyść filtry ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="g-toolbar">
        <div className="container">

          {/* ── DESKTOP toolbar ── */}
          <div className="g-toolbar-inner">
            <div className="g-pills" role="tablist" aria-label="Wybór pokazu">
              {[{id:"all",name:"Wszystkie",count:photos.length},...shows.map(s=>({id:s.id,name:s.name,count:photos.filter(p=>p.showId===s.id).length}))].map(item=>(
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={activeShow===item.id}
                  className="pill"
                  onClick={()=>setActiveShow(item.id)}
                  style={{background:activeShow===item.id?"var(--color-accent)":"var(--color-surface)",color:activeShow===item.id?"#fff":"var(--color-text-muted)",borderColor:activeShow===item.id?"var(--color-accent)":"var(--color-border)"}}
                >
                  {item.name}
                  <span style={{marginLeft:4,opacity:.6,fontWeight:500,fontSize:10}}>({item.count})</span>
                </button>
              ))}
            </div>

            <div className="g-desktop-actions" style={{display:"flex",alignItems:"center",gap:"var(--space-2)",flexShrink:0}}>
              <button
                className={`icon-action ${sheetOpen?"active":""}`}
                onClick={()=>setSheetOpen(v=>!v)}
                aria-expanded={sheetOpen}
              >
                <SlidersHorizontal size={13}/>
                Filtry
                {activeFilterCount>0&&<span className="filter-badge">{activeFilterCount}</span>}
              </button>
              <div style={{display:"flex",border:"1.5px solid var(--color-border)",borderRadius:"var(--radius-md)",overflow:"hidden"}}>
                {(["grid","shows"] as const).map(v=>(
                  <button key={v} onClick={()=>setView(v)} aria-pressed={view===v} style={{padding:"var(--space-2) var(--space-3)",display:"flex",alignItems:"center",gap:"var(--space-2)",fontSize:"var(--text-xs)",fontWeight:600,cursor:"pointer",border:"none",background:view===v?"var(--color-surface-offset)":"transparent",color:view===v?"var(--color-text)":"var(--color-text-faint)",transition:"all .15s"}}>
                    {v==="grid"?<Grid size={14}/>:<LayoutGrid size={14}/>}
                    {v==="grid"?"Siatka":"Pokazy"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {sheetOpen&&(
            <div className="g-filter-panel">
              <div className="g-search-wrap">
                <Search size={13} className="search-icon"/>
                <input className="input" placeholder="Szukaj…" aria-label="Szukaj zdjęć" value={search} onChange={e=>setSearch(e.target.value)}/>
                {search&&<button className="clear-btn" onClick={()=>setSearch("")} aria-label="Wyczyść wyszukiwanie"><X size={12}/></button>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"var(--space-2)"}}>
                <Calendar size={13} style={{color:"var(--color-text-faint)"}}/>
                <select className="g-select" aria-label="Filtruj po roku" value={filterYear} onChange={e=>setFilterYear(e.target.value)}>
                  <option value="all">Wszystkie lata</option>
                  {years.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"var(--space-2)"}}>
                <MapPin size={13} style={{color:"var(--color-text-faint)"}}/>
                <select className="g-select" aria-label="Filtruj po kraju" value={filterCountry} onChange={e=>setFilterCountry(e.target.value)}>
                  <option value="all">Wszystkie kraje</option>
                  {countries.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {allTags.length>0&&(
                <div style={{display:"flex",alignItems:"center",gap:"var(--space-2)"}}>
                  <Filter size={13} style={{color:"var(--color-text-faint)"}}/>
                  <select className="g-select" aria-label="Filtruj po tagu" value={filterTag} onChange={e=>setFilterTag(e.target.value)}>
                    <option value="all">Wszystkie tagi</option>
                    {allTags.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
              <div style={{display:"flex",alignItems:"center",gap:"var(--space-2)",marginLeft:"auto"}}>
                <ArrowUpDown size={13} style={{color:"var(--color-text-faint)"}}/>
                <select className="g-select" aria-label="Sortuj" value={sort} onChange={e=>setSort(e.target.value as SortKey)}>
                  <option value="newest">Najnowsze</option>
                  <option value="oldest">Najstarsze</option>
                  <option value="alpha">A → Z</option>
                  <option value="photos">Najwięcej zdjęć</option>
                </select>
              </div>
              {activeFilterCount>0&&(
                <button className="icon-action" onClick={clearFilters}>
                  <X size={12}/> Wyczyść
                </button>
              )}
            </div>
          )}

          {/* ── MOBILE toolbar ── */}
          <div className="g-mobile-bar">
            <div style={{position:"relative",flex:1}}>
              <Search size={13} style={{position:"absolute",left:"var(--space-3)",top:"50%",transform:"translateY(-50%)",color:"var(--color-text-faint)",pointerEvents:"none"}}/>
              <input
                className="input"
                placeholder="Szukaj…"
                aria-label="Szukaj zdjęć"
                value={search}
                onChange={e=>setSearch(e.target.value)}
                style={{paddingLeft:"var(--space-9)",fontSize:"var(--text-xs)",minHeight:40,width:"100%"}}
              />
              {search&&(
                <button onClick={()=>setSearch("")} aria-label="Wyczyść wyszukiwanie" style={{position:"absolute",right:"var(--space-2)",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--color-text-faint)",display:"flex"}}>
                  <X size={12}/>
                </button>
              )}
            </div>

            <button
              className={`icon-action ${activeShow!=="all"?"active":""}`}
              onClick={()=>setShowsSheetOpen(true)}
              style={{minHeight:40,gap:"var(--space-1)",padding:"var(--space-2) var(--space-3)"}}
            >
              <Plane size={14}/>
              <span style={{maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:"var(--text-xs)"}}>
                {activeShow==="all" ? "Pokazy" : (shows.find(s=>s.id===activeShow)?.name ?? "Pokaz")}
              </span>
            </button>

            <button
              className={`icon-action ${sheetOpen?"active":""}`}
              onClick={()=>setSheetOpen(v=>!v)}
              style={{minHeight:40,padding:"var(--space-2) var(--space-3)"}}
              aria-label="Otwórz filtry"
            >
              <SlidersHorizontal size={14}/>
              {activeFilterCount>0&&<span className="filter-badge">{activeFilterCount}</span>}
            </button>

            <button
              className="icon-action"
              onClick={()=>setView(v=>v==="grid"?"shows":"grid")}
              style={{minHeight:40,padding:"var(--space-2) var(--space-3)"}}
              title={view==="grid"?"Widok pokazów":"Widok siatki"}
              aria-label={view==="grid"?"Przełącz na widok pokazów":"Przełącz na widok siatki"}
            >
              {view==="grid"?<LayoutGrid size={14}/>:<Grid size={14}/>}
            </button>
          </div>

        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="container" style={{paddingTop:"var(--space-8)"}}>
        {view==="grid"
          ? <PhotoMasonry list={filteredPhotos} onOpen={openLb}/>
          : sortedShows.length === 0 ? (
            <div className="g-empty-shows">
              <Plane size={40} style={{opacity:.25}}/>
              <p style={{fontSize:"var(--text-sm)",fontWeight:600}}>Brak pokazów pasujących do filtrów</p>
              {activeFilterCount>0&&(
                <button className="icon-action" onClick={clearFilters}><X size={12}/> Wyczyść filtry</button>
              )}
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(320px,100%),1fr))",gap:"var(--space-6)",paddingBottom:"var(--space-16)"}}>
              {sortedShows.map(show=><ShowCard key={show.id} show={show}/>)}
            </div>
          )
        }
      </div>

      {/* ── LIGHTBOX ── */}
      {lbIndex!==null&&total>0&&(
        <Lightbox list={filteredPhotos} index={lbIndex} onClose={closeLb} onPrev={prevLb} onNext={nextLb} shows={shows}/>
      )}

      {/* ── BOTTOM SHEET: Filtry (mobile) ── */}
      <BottomSheet open={sheetOpen} onClose={()=>setSheetOpen(false)} title="Filtry i sortowanie">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:"var(--space-4)",marginBottom:"var(--space-2)"}}>
          <h2 style={{fontSize:"var(--text-lg)",fontWeight:800,letterSpacing:"-0.02em"}}>Filtry i sortowanie</h2>
          <button className="icon-action" onClick={()=>setSheetOpen(false)} style={{padding:"var(--space-2)"}} aria-label="Zamknij"><X size={16}/></button>
        </div>

        <SelectRow
          icon={Calendar} label="Rok"
          value={filterYear} onChange={setFilterYear}
          options={[{value:"all",label:"Wszystkie lata"},...years.map(y=>({value:String(y),label:String(y)}))]}
        />
        <SelectRow
          icon={MapPin} label="Kraj"
          value={filterCountry} onChange={setFilterCountry}
          options={[{value:"all",label:"Wszystkie kraje"},...countries.map(c=>({value:c,label:c}))]}
        />
        {allTags.length>0&&(
          <SelectRow
            icon={Filter} label="Tag"
            value={filterTag} onChange={setFilterTag}
            options={[{value:"all",label:"Wszystkie tagi"},...allTags.map(t=>({value:t,label:t}))]}
          />
        )}
        <SelectRow
          icon={ArrowUpDown} label="Sortowanie"
          value={sort} onChange={v=>setSort(v as SortKey)}
          options={[
            {value:"newest",label:"Najnowsze"},
            {value:"oldest",label:"Najstarsze"},
            {value:"alpha",label:"A → Z"},
            {value:"photos",label:"Najwięcej zdjęć"},
          ]}
        />

        <div style={{marginTop:"var(--space-6)",display:"flex",gap:"var(--space-3)"}}>
          {activeFilterCount>0&&(
            <button
              onClick={()=>{clearFilters();setSheetOpen(false)}}
              className="icon-action"
              style={{flex:1,justifyContent:"center",padding:"var(--space-3)",fontSize:"var(--text-sm)"}}
            >
              <X size={14}/> Wyczyść filtry
            </button>
          )}
          <button
            onClick={()=>setSheetOpen(false)}
            style={{flex:1,padding:"var(--space-3)",borderRadius:"var(--radius-md)",background:"var(--color-accent)",color:"#fff",border:"none",cursor:"pointer",fontSize:"var(--text-sm)",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:"var(--space-2)"}}
          >
            <Check size={14}/> Pokaż {total} zdjęć
          </button>
        </div>
      </BottomSheet>

      {/* ── BOTTOM SHEET: Wybór pokazu (mobile) ── */}
      <BottomSheet open={showsSheetOpen} onClose={()=>setShowsSheetOpen(false)} title="Wybierz pokaz">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:"var(--space-4)",marginBottom:"var(--space-2)"}}>
          <h2 style={{fontSize:"var(--text-lg)",fontWeight:800,letterSpacing:"-0.02em"}}>Wybierz pokaz</h2>
          <button className="icon-action" onClick={()=>setShowsSheetOpen(false)} style={{padding:"var(--space-2)"}} aria-label="Zamknij"><X size={16}/></button>
        </div>

        {[{id:"all",name:"Wszystkie pokazy",location:"",count:photos.length},...shows.map(s=>({id:s.id,name:s.name,location:s.location,count:photos.filter(p=>p.showId===s.id).length}))].map(item=>(
          <div
            key={item.id}
            className="show-option"
            onClick={()=>{setActiveShow(item.id);setShowsSheetOpen(false)}}
            role="button"
            tabIndex={0}
            onKeyDown={e=>{ if (e.key==="Enter" || e.key===" ") { e.preventDefault(); setActiveShow(item.id); setShowsSheetOpen(false); } }}
          >
            <div>
              <p style={{fontSize:"var(--text-sm)",fontWeight:activeShow===item.id?700:500,color:activeShow===item.id?"var(--color-accent)":"var(--color-text)"}}>{item.name}</p>
              {item.location&&<p style={{fontSize:"var(--text-xs)",color:"var(--color-text-faint)",marginTop:2}}>{item.location}</p>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"var(--space-3)",flexShrink:0}}>
              <span style={{fontSize:"var(--text-xs)",color:"var(--color-text-faint)",fontVariantNumeric:"tabular-nums"}}>{item.count} zdjęć</span>
              {activeShow===item.id&&<Check size={15} style={{color:"var(--color-accent)"}}/>}
            </div>
          </div>
        ))}
      </BottomSheet>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE EXPORT
// ─────────────────────────────────────────────────────────────
export default function GalleryPage() {
  return (
    <div style={{paddingTop:"64px"}}>
      <Suspense fallback={
        <div className="container" style={{paddingTop:"var(--space-8)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"var(--space-3)",color:"var(--color-text-faint)",marginBottom:"var(--space-6)"}}>
            <style>{`@keyframes gSpin{to{transform:rotate(360deg)}}`}</style>
            <Loader2 size={16} style={{animation:"gSpin 1s linear infinite"}}/>
            <span style={{fontSize:"var(--text-sm)"}}>Ładowanie galerii…</span>
          </div>
          <MasonrySkeleton/>
        </div>
      }>
        <GalleryContent/>
      </Suspense>
    </div>
  );
}