"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Upload, Search, Check, Loader2, AlertCircle,
  Image as ImageIcon, Film, RefreshCw, FolderOpen,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface MediaFile {
  name:       string;
  url:        string;
  type:       "image" | "video";
  folder:     string;
  size?:      number;
  createdAt?: string;
}

interface MediaPickerProps {
  onSelect: (url: string) => void;
  onClose:  () => void;
  accept?:  "image" | "video" | "all";
  title?:   string;
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "avif", "gif"];
const VIDEO_EXTS = ["mp4", "webm", "mov", "avi"];

function getType(name: string): "image" | "video" | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (VIDEO_EXTS.includes(ext)) return "video";
  return null;
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024)      return `${bytes} B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(0)} KB`;
  return `${(bytes/1024/1024).toFixed(1)} MB`;
}

export default function MediaPicker({
  onSelect,
  onClose,
  accept = "all",
  title  = "Wybierz plik",
}: MediaPickerProps) {
  const [files,     setFiles]     = useState<MediaFile[]>([]);
  const [filtered,  setFiltered]  = useState<MediaFile[]>([]);
  const [folders,   setFolders]   = useState<string[]>([]);
  const [folder,    setFolder]    = useState("all");
  const [query,     setQuery]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [selected,  setSelected]  = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [tab,       setTab]       = useState<"browse" | "upload">("browse");
  const [dragOver,  setDragOver]  = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rootItems, error: rootErr } = await supabaseAdmin.storage
        .from("photos")
        .list("", { limit: 100 });

      if (rootErr) throw new Error(rootErr.message);

      const folderNames = (rootItems ?? [])
        .filter(item => !item.id)
        .map(item => item.name);

      setFolders(folderNames);

      const allFiles: MediaFile[] = [];

      // Pliki w root
      for (const f of (rootItems ?? []).filter(item => item.id)) {
        const t = getType(f.name);
        if (!t) continue;
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from("photos").getPublicUrl(f.name);
        allFiles.push({
          name:      f.name,
          url:       publicUrl,
          type:      t,
          folder:    "root",
          size:      f.metadata?.size      as number | undefined,
          createdAt: f.metadata?.lastModified as string | undefined,
        });
      }

      // Pliki w podfolderach
      for (const fld of folderNames) {
        const { data: items, error: fldErr } = await supabaseAdmin.storage
          .from("photos")
          .list(fld, { limit: 200, sortBy: { column: "name", order: "desc" } });

        if (fldErr) continue;

        for (const f of (items ?? [])) {
          if (!f.id) continue;
          const t = getType(f.name);
          if (!t) continue;
          const path = `${fld}/${f.name}`;
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from("photos").getPublicUrl(path);
          allFiles.push({
            name:      f.name,
            url:       publicUrl,
            type:      t,
            folder:    fld,
            size:      f.metadata?.size      as number | undefined,
            createdAt: f.metadata?.lastModified as string | undefined,
          });
        }
      }

      setFiles(allFiles);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd wczytywania plików");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  useEffect(() => {
    let out = files;
    if (accept !== "all") out = out.filter(f => f.type === accept);
    if (folder !== "all") out = out.filter(f => f.folder === folder);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(f => f.name.toLowerCase().includes(q));
    }
    setFiltered(out);
  }, [files, accept, folder, query]);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    const file = fileList[0];

    const ACCEPTED_IMAGES = ["image/jpeg","image/png","image/webp","image/avif"];
    const ACCEPTED_VIDEOS = ["video/mp4","video/webm","video/quicktime"];
    const allowed = accept === "image" ? ACCEPTED_IMAGES
                  : accept === "video" ? ACCEPTED_VIDEOS
                  : [...ACCEPTED_IMAGES, ...ACCEPTED_VIDEOS];

    if (!allowed.includes(file.type)) { setUploadErr("Nieobsługiwany format pliku"); return; }
    if (file.size > 100 * 1024 * 1024) { setUploadErr("Plik za duży (max 100MB)"); return; }

    setUploading(true);
    setUploadErr(null);
    setUploadPct(10);

    try {
      const fd = new FormData();
      fd.append("file",   file);
      fd.append("showId", "media");

      setUploadPct(30);
      const res = await fetch("/api/upload", {
        method: "POST", credentials: "include", body: fd,
      });
      setUploadPct(80);

      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? `Błąd ${res.status}`);
      }

      const { url } = await res.json();
      setUploadPct(100);
      await loadFiles();
      setSelected(url);
      setTab("browse");
      setTimeout(() => setUploadPct(0), 600);
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : "Błąd uploadu");
      setUploadPct(0);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  }

  return (
    <>
      <style>{`
        @keyframes mp-in{from{opacity:0}to{opacity:1}}
        @keyframes mp-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes mp-spin{to{transform:rotate(360deg)}}
        .mp-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:var(--space-4);animation:mp-in .15s ease}
        .mp-modal{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-xl);width:100%;max-width:920px;max-height:90vh;display:flex;flex-direction:column;animation:mp-up .2s cubic-bezier(.16,1,.3,1);box-shadow:var(--shadow-lg)}
        .mp-header{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-4) var(--space-5);border-bottom:1px solid var(--color-divider);flex-shrink:0}
        .mp-tabs{display:flex;gap:2px;background:var(--color-surface-offset);border-radius:var(--radius-md);padding:2px;margin-left:auto}
        .mp-tab{padding:var(--space-1) var(--space-4);border-radius:calc(var(--radius-md) - 2px);font-size:var(--text-xs);font-weight:700;cursor:pointer;border:none;background:none;color:var(--color-text-muted);transition:background .15s,color .15s}
        .mp-tab.on{background:var(--color-surface-2);color:var(--color-text);box-shadow:var(--shadow-sm)}
        .mp-toolbar{display:flex;gap:var(--space-3);padding:var(--space-3) var(--space-5);border-bottom:1px solid var(--color-divider);flex-shrink:0;align-items:center;flex-wrap:wrap}
        .mp-search{position:relative;flex:1;min-width:160px}
        .mp-search input{width:100%;padding:var(--space-2) var(--space-3) var(--space-2) var(--space-8);border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-surface-offset);font-size:var(--text-sm);color:var(--color-text);outline:none;transition:border-color .15s}
        .mp-search input:focus{border-color:var(--color-primary)}
        .mp-search-ico{position:absolute;left:var(--space-2);top:50%;transform:translateY(-50%);color:var(--color-text-faint);pointer-events:none}
        .mp-select{padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-surface-offset);font-size:var(--text-sm);color:var(--color-text);cursor:pointer;outline:none}
        .mp-body{flex:1;overflow-y:auto;padding:var(--space-4) var(--space-5)}
        .mp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:var(--space-3)}
        .mp-thumb{position:relative;border-radius:var(--radius-lg);overflow:hidden;aspect-ratio:1;cursor:pointer;border:2px solid transparent;transition:border-color .15s,transform .15s,box-shadow .15s;background:var(--color-surface-offset)}
        .mp-thumb:hover{border-color:var(--color-primary);transform:scale(1.02)}
        .mp-thumb.sel{border-color:var(--color-primary);box-shadow:0 0 0 3px oklch(from var(--color-primary) l c h / .2)}
        .mp-thumb img{width:100%;height:100%;object-fit:cover;display:block}
        .mp-check{position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:var(--color-primary);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s;pointer-events:none}
        .mp-thumb.sel .mp-check{opacity:1}
        .mp-fname{position:absolute;bottom:0;left:0;right:0;padding:4px 6px;background:rgba(0,0,0,.6);font-size:9px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .mp-ftype{position:absolute;top:4px;left:4px;background:rgba(0,0,0,.5);border-radius:4px;padding:2px 5px;font-size:9px;font-weight:700;color:#fff}
        .mp-fsize{position:absolute;bottom:18px;right:4px;background:rgba(0,0,0,.45);border-radius:4px;padding:1px 5px;font-size:9px;color:rgba(255,255,255,.75)}
        .mp-footer{display:flex;align-items:center;justify-content:space-between;padding:var(--space-4) var(--space-5);border-top:1px solid var(--color-divider);flex-shrink:0;gap:var(--space-3);flex-wrap:wrap}
        .mp-btn{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-4);border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:600;border:1px solid var(--color-border);cursor:pointer;background:var(--color-surface);color:var(--color-text);transition:background .15s;white-space:nowrap}
        .mp-btn:hover{background:var(--color-surface-offset)}
        .mp-btn:disabled{opacity:.4;cursor:not-allowed}
        .mp-btn.primary{background:var(--color-primary);color:#fff;border-color:transparent}
        .mp-btn.primary:hover:not(:disabled){background:var(--color-primary-hover)}
        .mp-drop{border:2px dashed var(--color-border);border-radius:var(--radius-xl);padding:var(--space-16) var(--space-8);text-align:center;cursor:pointer;transition:border-color .15s,background .15s}
        .mp-drop:hover,.mp-drop.over{border-color:var(--color-primary);background:oklch(from var(--color-primary) l c h / .04)}
        .mp-progress{height:4px;border-radius:99px;background:var(--color-surface-offset);overflow:hidden;margin-top:var(--space-3)}
        .mp-prog-bar{height:100%;background:var(--color-primary);border-radius:99px;transition:width .3s}
        .mp-empty{padding:var(--space-16);text-align:center;color:var(--color-text-faint)}
        .mp-alert{display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);font-size:var(--text-xs);font-weight:500;background:rgba(161,44,123,.08);border:1px solid rgba(161,44,123,.25);color:#a12c7b;margin-top:var(--space-3)}
        .mp-prev-thumb{width:36px;height:36px;border-radius:var(--radius-md);object-fit:cover;border:1px solid var(--color-border);flex-shrink:0}
      `}</style>

      <div className="mp-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="mp-modal">

          {/* ── Header ── */}
          <div className="mp-header">
            <FolderOpen size={18} style={{ color:"var(--color-primary)", flexShrink:0 }}/>
            <h2 style={{ fontWeight:700, fontSize:"var(--text-base)" }}>{title}</h2>
            <div className="mp-tabs">
              <button className={`mp-tab ${tab==="browse"?"on":""}`} onClick={() => setTab("browse")}>
                Biblioteka ({files.length})
              </button>
              <button className={`mp-tab ${tab==="upload"?"on":""}`} onClick={() => setTab("upload")}>
                Wgraj nowy
              </button>
            </div>
            <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--color-text-faint)",display:"flex",padding:"var(--space-1)",borderRadius:"var(--radius-sm)",marginLeft:"var(--space-2)" }}>
              <X size={18}/>
            </button>
          </div>

          {/* ── Tab: Przeglądaj ── */}
          {tab === "browse" && (
            <>
              <div className="mp-toolbar">
                <div className="mp-search">
                  <Search size={13} className="mp-search-ico"/>
                  <input placeholder="Szukaj pliku…" value={query}
                    onChange={e => setQuery(e.target.value)}/>
                </div>
                {folders.length > 0 && (
                  <select className="mp-select" value={folder}
                    onChange={e => setFolder(e.target.value)}>
                    <option value="all">Wszystkie foldery</option>
                    <option value="root">/ root</option>
                    {folders.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                )}
                <button className="mp-btn" onClick={loadFiles}
                  style={{ padding:"var(--space-2)", minWidth:36, justifyContent:"center" }}>
                  <RefreshCw size={14}/>
                </button>
                <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", whiteSpace:"nowrap" }}>
                  {filtered.length} plików
                </span>
              </div>

              <div className="mp-body">
                {loading ? (
                  <div className="mp-empty">
                    <Loader2 size={24} style={{ animation:"mp-spin 1s linear infinite", margin:"0 auto" }}/>
                  </div>
                ) : error ? (
                  <div className="mp-empty">
                    <AlertCircle size={24} style={{ margin:"0 auto var(--space-3)", opacity:.5 }}/>
                    <p style={{ fontSize:"var(--text-sm)" }}>{error}</p>
                    <button className="mp-btn" onClick={loadFiles}
                      style={{ margin:"var(--space-4) auto 0", display:"flex" }}>
                      Spróbuj ponownie
                    </button>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="mp-empty">
                    <ImageIcon size={28} style={{ margin:"0 auto var(--space-3)", opacity:.3 }}/>
                    <p style={{ fontSize:"var(--text-sm)" }}>
                      {query ? "Brak plików pasujących do szukania." : "Brak plików. Wgraj pierwszy powyżej."}
                    </p>
                  </div>
                ) : (
                  <div className="mp-grid">
                    {filtered.map(file => (
                      <div
                        key={file.url}
                        className={`mp-thumb ${selected === file.url ? "sel" : ""}`}
                        onClick={() => setSelected(file.url === selected ? null : file.url)}
                        title={`${file.name}${file.size ? ` · ${formatSize(file.size)}` : ""}`}
                      >
                        {file.type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={file.url} alt={file.name} loading="lazy"/>
                        ) : (
                          <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-surface-dynamic)" }}>
                            <Film size={28} style={{ color:"var(--color-text-faint)" }}/>
                          </div>
                        )}
                        <div className="mp-ftype">{file.type === "image" ? "IMG" : "VID"}</div>
                        {file.size && <div className="mp-fsize">{formatSize(file.size)}</div>}
                        <div className="mp-fname">{file.name}</div>
                        <div className="mp-check"><Check size={12} color="#fff"/></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Tab: Upload ── */}
          {tab === "upload" && (
            <div className="mp-body">
              <div
                className={`mp-drop ${dragOver ? "over" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={
                    accept === "image" ? "image/jpeg,image/png,image/webp,image/avif" :
                    accept === "video" ? "video/mp4,video/webm,video/quicktime" :
                    "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                  }
                  onChange={e => handleUpload(e.target.files)}
                  style={{ display:"none" }}
                />
                {uploading ? (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"var(--space-3)" }}>
                    <Loader2 size={32} style={{ animation:"mp-spin 1s linear infinite", color:"var(--color-primary)" }}/>
                    <p style={{ fontSize:"var(--text-sm)", fontWeight:600, color:"var(--color-text-muted)" }}>
                      Wgrywanie… {uploadPct}%
                    </p>
                    <div className="mp-progress" style={{ width:220 }}>
                      <div className="mp-prog-bar" style={{ width:`${uploadPct}%` }}/>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={32} style={{ margin:"0 auto var(--space-4)", color:"var(--color-text-faint)" }}/>
                    <p style={{ fontWeight:700, fontSize:"var(--text-base)", marginBottom:"var(--space-2)" }}>
                      Przeciągnij plik lub kliknij aby wybrać
                    </p>
                    <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-faint)" }}>
                      {accept === "image" ? "JPG, PNG, WebP, AVIF — max 100MB" :
                       accept === "video" ? "MP4, WebM, MOV — max 100MB" :
                       "Zdjęcia i filmy — max 100MB"}
                    </p>
                  </>
                )}
              </div>
              {uploadErr && (
                <div className="mp-alert">
                  <AlertCircle size={14} style={{ flexShrink:0 }}/>{uploadErr}
                </div>
              )}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="mp-footer">
            <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", flex:1, minWidth:0 }}>
              {selected ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected} alt="" className="mp-prev-thumb"
                    onError={e => { (e.target as HTMLImageElement).style.display="none"; }}/>
                  <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {selected.split("/").pop()}
                  </span>
                </>
              ) : (
                <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>
                  Kliknij miniaturę aby wybrać
                </span>
              )}
            </div>
            <div style={{ display:"flex", gap:"var(--space-2)" }}>
              <button className="mp-btn" onClick={onClose}>Anuluj</button>
              <button className="mp-btn primary" disabled={!selected} onClick={() => { if (selected) onSelect(selected); }}>
                <Check size={14}/> Wybierz
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}