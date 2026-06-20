"use client";

import { useState, useRef, useCallback } from "react";
import { airShows } from "@/lib/data";
import {
  X, Check, CloudUpload, FileImage,
  AlertCircle, Image as ImageIcon, Star,
  UploadCloud, Trash2, RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { uploadPhoto } from "@/lib/hooks/useShows";

// ── Typy ─────────────────────────────────────────────────────
type UploadStatus = "pending" | "uploading" | "done" | "error";

interface FileItem {
  id:       string;
  file:     File;
  preview:  string;
  status:   UploadStatus;
  progress: number;
  showId:   string;
  alt:      string;
  aircraft: string;
  tags:     string;
  featured: boolean;
  error?:   string;
  dimensions?: { w: number; h: number };
}

const MAX_SIZE_MB = 20;
const ACCEPTED    = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getImageDimensions(src: string): Promise<{ w: number; h: number }> {
  return new Promise((res) => {
    const img = new window.Image();
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => res({ w: 0, h: 0 });
    img.src = src;
  });
}

// ── Komponenty ────────────────────────────────────────────────

function StatusBadge({ status, progress }: { status: UploadStatus; progress: number }) {
  const map: Record<UploadStatus, { label: string; color: string }> = {
    pending:   { label: "Oczekuje",    color: "var(--color-text-faint)" },
    uploading: { label: `${progress}%`, color: "var(--color-accent)" },
    done:      { label: "✓ Wgrane",    color: "#22c55e" },
    error:     { label: "✗ Błąd",      color: "#ef4444" },
  };
  const { label, color } = map[status];
  return (
    <span style={{
      fontSize: "var(--text-xs)", fontWeight: 700, color,
      fontVariantNumeric: "tabular-nums",
    }}>
      {label}
    </span>
  );
}

// ── Główny komponent ──────────────────────────────────────────
export default function UploadPage() {
  const safeShows = airShows ?? [];

  const [files, setFiles]           = useState<FileItem[]>([]);
  const [dragging, setDragging]     = useState(false);
  const [defaultShow, setDefaultShow] = useState(safeShows[0]?.id ?? "");
  const [uploading, setUploading]   = useState(false);
  const [allDone, setAllDone]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (rawFiles: File[]) => {
    const valid = rawFiles.filter((f) => {
      if (!ACCEPTED.includes(f.type)) return false;
      if (f.size > MAX_SIZE_MB * 1024 * 1024) return false;
      return true;
    });
    const rejected = rawFiles.filter((f) => !valid.includes(f));

    const newItems: FileItem[] = await Promise.all(
      valid.map(async (file) => {
        const preview = URL.createObjectURL(file);
        const dimensions = await getImageDimensions(preview);
        return {
          id: uid(),
          file,
          preview,
          status: "pending" as const,
          progress: 0,
          showId: defaultShow,
          alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          aircraft: "",
          tags: "",
          featured: false,
          dimensions,
        };
      })
    );

    // Dodaj odrzucone jako error
    const errorItems: FileItem[] = rejected.map((file) => ({
      id: uid(),
      file,
      preview: "",
      status: "error" as const,
      progress: 0,
      showId: defaultShow,
      alt: file.name,
      aircraft: "",
      tags: "",
      featured: false,
      error: file.size > MAX_SIZE_MB * 1024 * 1024
        ? `Za duży plik (max ${MAX_SIZE_MB} MB)`
        : "Nieobsługiwany format",
    }));

    setFiles((prev) => [...prev, ...newItems, ...errorItems]);
    setAllDone(false);
  }, [defaultShow]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
  }

  function clearAll() {
    files.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setFiles([]);
    setAllDone(false);
  }

  function clearDone() {
    setFiles((prev) => prev.filter((f) => f.status !== "done"));
  }

  function update(id: string, patch: Partial<FileItem>) {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, ...patch } : f));
  }

  function retryFile(id: string) {
    update(id, { status: "pending", progress: 0, error: undefined });
    setAllDone(false);
  }

  async function handleUpload() {
  const pending = files.filter((f) => f.status === "pending");
  if (!pending.length) return;
  setUploading(true);

  for (const item of pending) {
    update(item.id, { status: "uploading", progress: 30 });
    try {
      const fd = new FormData();
      fd.append("file",     item.file);
      fd.append("showId",   item.showId);
      fd.append("alt",      item.alt);
      fd.append("aircraft", item.aircraft);

      await uploadPhoto(fd);
      update(item.id, { status: "done", progress: 100 });
    } catch (err) {
      update(item.id, { status: "error", error: String(err) });
    }
  }

  setUploading(false);
  setAllDone(true);
}

  const pendingCount  = files.filter((f) => f.status === "pending").length;
  const doneCount     = files.filter((f) => f.status === "done").length;
  const errorCount    = files.filter((f) => f.status === "error").length;
  const uploadingNow  = files.filter((f) => f.status === "uploading").length;

  return (
    <>
      <style>{`
        .drop-zone {
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-16) var(--space-8);
          text-align: center; cursor: pointer;
          transition: border-color .2s, background .2s, transform .15s;
          background: var(--color-surface);
          user-select: none;
        }
        .drop-zone:hover {
          border-color: var(--color-accent);
          background: var(--color-accent-subtle);
          transform: scale(1.005);
        }
        .drop-zone.drag {
          border-color: var(--color-accent);
          background: var(--color-accent-subtle);
          transform: scale(1.01);
          border-style: solid;
        }

        .upload-row {
          display: grid;
          grid-template-columns: 88px 1fr auto;
          gap: var(--space-4);
          align-items: start;
          padding: var(--space-4);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          transition: border-color .2s, background .2s;
        }
        .upload-row.done    { border-color: rgba(34,197,94,.3);  background: rgba(34,197,94,.03); }
        .upload-row.error   { border-color: rgba(239,68,68,.3);  background: rgba(239,68,68,.03); }
        .upload-row.uploading { border-color: var(--color-accent); }
        @media (max-width: 600px) {
          .upload-row { grid-template-columns: 60px 1fr auto; gap: var(--space-3); }
        }

        .prog-track {
          height: 3px; background: var(--color-divider);
          border-radius: var(--radius-full); overflow: hidden;
          margin-top: var(--space-2);
        }
        .prog-fill {
          height: 100%; border-radius: var(--radius-full);
          transition: width .18s ease;
        }

        .field-label {
          display: block;
          font-size: var(--text-xs); font-weight: 700;
          text-transform: uppercase; letter-spacing: .07em;
          color: var(--color-text-faint);
          margin-bottom: var(--space-1);
        }
        .upload-input {
          width: 100%;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-sm);
          border: 1.5px solid var(--color-border);
          background: var(--color-surface-offset);
          color: var(--color-text);
          font-size: var(--text-xs);
          transition: border-color .15s;
          outline: none;
        }
        .upload-input:focus { border-color: var(--color-accent); }
        .upload-input:disabled { opacity: .5; cursor: not-allowed; }

        .fields-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
        }
        @media (max-width: 480px) {
          .fields-2col { grid-template-columns: 1fr; }
        }

        .tag-chip {
          display: inline-flex; align-items: center;
          padding: 2px var(--space-2);
          border-radius: var(--radius-full);
          background: var(--color-surface-dynamic);
          border: 1px solid var(--color-border);
          font-size: 10px; font-weight: 600;
          color: var(--color-text-muted);
        }

        .upload-summary {
          display: flex; align-items: center; gap: var(--space-6);
          flex-wrap: wrap;
        }
        .summary-dot {
          display: inline-flex; align-items: center; gap: var(--space-2);
          font-size: var(--text-xs); font-weight: 600;
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 900,
          fontSize: "var(--text-xl)", letterSpacing: "-0.03em",
          marginBottom: "var(--space-1)",
        }}>
          Dodaj zdjęcia
        </h1>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Przeciągnij pliki lub wybierz z dysku · JPG, PNG, WebP, AVIF · Max {MAX_SIZE_MB} MB / plik
        </p>
      </div>

      {/* ── Domyślny pokaz ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "var(--space-4)",
        marginBottom: "var(--space-6)", flexWrap: "wrap",
        padding: "var(--space-4)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
      }}>
        <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
          Domyślny pokaz dla nowych plików:
        </label>
        <select
          value={defaultShow}
          onChange={(e) => setDefaultShow(e.target.value)}
          style={{
            padding: "var(--space-2) var(--space-4)",
            borderRadius: "var(--radius-md)",
            border: "1.5px solid var(--color-border)",
            background: "var(--color-surface-offset)",
            color: "var(--color-text)",
            fontSize: "var(--text-sm)",
            cursor: "pointer", flex: 1, minWidth: 200,
          }}
        >
          {safeShows.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
          ))}
        </select>
      </div>

      {/* ── Drop zone ── */}
      <div
        className={`drop-zone ${dragging ? "drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{ marginBottom: "var(--space-6)" }}
        role="button"
        tabIndex={0}
        aria-label="Strefa przeciągania plików"
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
        />
        <div style={{
          color: dragging ? "var(--color-accent)" : "var(--color-text-faint)",
          marginBottom: "var(--space-4)",
          transition: "color .2s, transform .2s",
          transform: dragging ? "scale(1.15)" : "scale(1)",
        }}>
          <CloudUpload size={52} style={{ margin: "0 auto" }} />
        </div>
        <p style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: "var(--text-lg)", marginBottom: "var(--space-2)",
          color: dragging ? "var(--color-accent)" : "var(--color-text)",
          transition: "color .2s",
        }}>
          {dragging ? "Upuść tutaj!" : "Przeciągnij zdjęcia tutaj"}
        </p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-faint)" }}>
          lub{" "}
          <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
            kliknij aby wybrać
          </span>{" "}
          z dysku
        </p>
        <div style={{
          display: "flex", justifyContent: "center", gap: "var(--space-4)",
          marginTop: "var(--space-5)", flexWrap: "wrap",
        }}>
          {["JPG", "PNG", "WebP", "AVIF"].map((fmt) => (
            <span key={fmt} className="tag-chip">{fmt}</span>
          ))}
          <span className="tag-chip">Max {MAX_SIZE_MB} MB</span>
        </div>
      </div>

      {/* ── Toolbar ── */}
      {files.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-4)",
          flexWrap: "wrap", gap: "var(--space-3)",
          padding: "var(--space-3) var(--space-4)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
        }}>
          {/* Summary */}
          <div className="upload-summary">
            <span className="summary-dot" style={{ color: "var(--color-text-muted)" }}>
              <ImageIcon size={13} /> {files.length} plików
            </span>
            {doneCount > 0 && (
              <span className="summary-dot" style={{ color: "#22c55e" }}>
                <Check size={13} /> {doneCount} wgrane
              </span>
            )}
            {pendingCount > 0 && (
              <span className="summary-dot" style={{ color: "var(--color-text-faint)" }}>
                <UploadCloud size={13} /> {pendingCount} oczekuje
              </span>
            )}
            {errorCount > 0 && (
              <span className="summary-dot" style={{ color: "#ef4444" }}>
                <AlertCircle size={13} /> {errorCount} błędy
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {doneCount > 0 && (
              <button
                onClick={clearDone}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
                  background: "transparent", cursor: "pointer", color: "var(--color-text-muted)",
                  fontSize: "var(--text-xs)", fontWeight: 600,
                }}
              >
                <Trash2 size={12} /> Wyczyść wgrane
              </button>
            )}
            <button
              onClick={clearAll}
              disabled={uploading}
              style={{
                display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
                background: "transparent", cursor: uploading ? "not-allowed" : "pointer",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-xs)", fontWeight: 600, opacity: uploading ? .5 : 1,
              }}
            >
              <X size={12} /> Wyczyść wszystko
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || pendingCount === 0}
              style={{
                display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-5)",
                borderRadius: "var(--radius-md)",
                background: (uploading || pendingCount === 0) ? "var(--color-surface-dynamic)" : "var(--color-accent)",
                color: (uploading || pendingCount === 0) ? "var(--color-text-faint)" : "#fff",
                border: "none", cursor: (uploading || pendingCount === 0) ? "not-allowed" : "pointer",
                fontSize: "var(--text-sm)", fontWeight: 700,
                transition: "background .2s, transform .15s",
              }}
            >
              {uploading
                ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Wgrywanie…</>
                : <><UploadCloud size={14} /> Wgraj {pendingCount > 0 ? `${pendingCount} ` : ""}zdjęć</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Success banner ── */}
      {allDone && errorCount === 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--space-3)",
          padding: "var(--space-4) var(--space-5)",
          background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.3)",
          borderRadius: "var(--radius-lg)", marginBottom: "var(--space-5)",
        }}>
          <Check size={20} style={{ color: "#22c55e", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "#22c55e" }}>
              Wszystkie zdjęcia wgrane pomyślnie!
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
              {doneCount} zdjęć zostało dodanych do galerii
            </p>
          </div>
        </div>
      )}

      {/* ── File list ── */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
          {files.map((item) => (
            <div key={item.id} className={`upload-row ${item.status}`}>

              {/* ── Thumbnail ── */}
              <div style={{
                position: "relative", aspectRatio: "4/3",
                borderRadius: "var(--radius-md)", overflow: "hidden",
                background: "var(--color-surface-offset)", flexShrink: 0,
              }}>
                {item.preview ? (
                  <>
                    <Image
                      src={item.preview}
                      alt={item.alt}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="88px"
                      unoptimized
                    />
                    {item.status === "done" && (
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "rgba(0,0,0,.45)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Check size={22} color="#22c55e" />
                      </div>
                    )}
                    {item.status === "uploading" && (
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "rgba(0,0,0,.5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: "var(--text-sm)", fontWeight: 700,
                      }}>
                        {item.progress}%
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#ef4444",
                  }}>
                    <AlertCircle size={20} />
                  </div>
                )}
              </div>

              {/* ── Fields ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", minWidth: 0 }}>

                {/* Error */}
                {item.status === "error" && item.error && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "var(--space-2)",
                    padding: "var(--space-2) var(--space-3)",
                    background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)",
                    borderRadius: "var(--radius-md)", color: "#ef4444",
                    fontSize: "var(--text-xs)", fontWeight: 600,
                  }}>
                    <AlertCircle size={12} /> {item.error}
                  </div>
                )}

                {/* Alt */}
                <div>
                  <label className="field-label">Opis / alt</label>
                  <input
                    className="upload-input"
                    value={item.alt}
                    onChange={(e) => update(item.id, { alt: e.target.value })}
                    placeholder="Opis zdjęcia dla czytników ekranu…"
                    disabled={item.status !== "pending"}
                  />
                </div>

                {/* Aircraft + Show */}
                <div className="fields-2col">
                  <div>
                    <label className="field-label">Samolot / maszyna</label>
                    <input
                      className="upload-input"
                      value={item.aircraft}
                      onChange={(e) => update(item.id, { aircraft: e.target.value })}
                      placeholder="np. F-16 Fighting Falcon"
                      disabled={item.status !== "pending"}
                    />
                  </div>
                  <div>
                    <label className="field-label">Pokaz lotniczy</label>
                    <select
                      className="upload-input"
                      value={item.showId}
                      onChange={(e) => update(item.id, { showId: e.target.value })}
                      disabled={item.status !== "pending"}
                    >
                      {safeShows.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="field-label">Tagi (oddziel przecinkami)</label>
                  <input
                    className="upload-input"
                    value={item.tags}
                    onChange={(e) => update(item.id, { tags: e.target.value })}
                    placeholder="f16, akrobacje, dym, przelot…"
                    disabled={item.status !== "pending"}
                  />
                </div>

                {/* Meta row */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
                  {/* Featured */}
                  <label style={{
                    display: "flex", alignItems: "center", gap: "var(--space-2)",
                    cursor: item.status === "pending" ? "pointer" : "default",
                  }}>
                    <input
                      type="checkbox"
                      checked={item.featured}
                      onChange={(e) => update(item.id, { featured: e.target.checked })}
                      disabled={item.status !== "pending"}
                      style={{ accentColor: "var(--color-gold)", width: 14, height: 14 }}
                    />
                    <Star
                      size={12}
                      style={{ color: item.featured ? "var(--color-gold)" : "var(--color-text-faint)" }}
                    />
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      Wyróżnij
                    </span>
                  </label>

                  {/* File size */}
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
                    {fmtSize(item.file.size)}
                  </span>

                  {/* Dimensions */}
                  {item.dimensions && item.dimensions.w > 0 && (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
                      {item.dimensions.w} × {item.dimensions.h}
                    </span>
                  )}

                  {/* Status */}
                  <div style={{ marginLeft: "auto" }}>
                    <StatusBadge status={item.status} progress={item.progress} />
                  </div>
                </div>

                {/* Progress bar */}
                {(item.status === "uploading" || item.status === "done") && (
                  <div className="prog-track">
                    <div
                      className="prog-fill"
                      style={{
                        width: `${item.progress}%`,
                        background: item.status === "done" ? "#22c55e" : "var(--color-accent)",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ── Actions ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <button
                  onClick={() => removeFile(item.id)}
                  disabled={item.status === "uploading"}
                  aria-label="Usuń plik"
                  style={{
                    width: 32, height: 32, borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    background: "transparent", cursor: item.status === "uploading" ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--color-text-faint)",
                    transition: "background .15s, color .15s",
                    opacity: item.status === "uploading" ? .4 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (item.status !== "uploading") {
                      e.currentTarget.style.background = "rgba(239,68,68,.1)";
                      e.currentTarget.style.color = "#ef4444";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--color-text-faint)";
                  }}
                >
                  <X size={14} />
                </button>

                {item.status === "error" && !item.error?.includes("format") && !item.error?.includes("duż") && (
                  <button
                    onClick={() => retryFile(item.id)}
                    aria-label="Ponów upload"
                    style={{
                      width: 32, height: 32, borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      background: "transparent", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--color-text-faint)",
                      transition: "background .15s, color .15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(34,197,94,.1)";
                      e.currentTarget.style.color = "#22c55e";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--color-text-faint)";
                    }}
                  >
                    <RefreshCw size={13} />
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {files.length === 0 && (
        <div style={{
          textAlign: "center", padding: "var(--space-12) 0",
          color: "var(--color-text-faint)",
        }}>
          <FileImage size={36} style={{ margin: "0 auto var(--space-4)", opacity: .35 }} />
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>Brak wybranych plików</p>
          <p style={{ fontSize: "var(--text-xs)", marginTop: "var(--space-2)", color: "var(--color-text-faint)" }}>
            Użyj strefy powyżej aby dodać zdjęcia
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}