"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe, Lock, Palette, Share2, Bell,
  Check, Eye, EyeOff, Save, RotateCcw,
  Instagram, Twitter, Youtube, Facebook,
  Moon, Sun, Monitor, User, AlertCircle,
  ExternalLink, Copy, CheckCheck,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
interface Settings {
  siteName:        string;
  siteTagline:     string;
  siteDescription: string;
  siteUrl:         string;
  authorName:      string;
  authorBio:       string;
  avatarUrl:       string;
  adminPin:        string;
  accentColor:     string;
  defaultTheme:    "light" | "dark" | "system";
  photosPerPage:   number;
  showExifData:    boolean;
  enableLightbox:  boolean;
  instagram:       string;
  twitter:         string;
  youtube:         string;
  facebook:        string;
  notifyOnUpload:  boolean;
  notifyEmail:     string;
}

const STORAGE_KEY = "airshow_settings";

const DEFAULT: Settings = {
  siteName:        "AirShow Gallery",
  siteTagline:     "Pokazy lotnicze z bliska",
  siteDescription: "Fotogaleria z polskich i europejskich pokazów lotniczych. Lotnictwo sportowe, akrobatyka, wojsko.",
  siteUrl:         "https://airshow.example.com",
  authorName:      "Montage Effects",
  authorBio:       "Fotograf lotniczy z Krakowa. Pasjonuję się lotnictwem od 2010 roku.",
  avatarUrl:       "",
  adminPin:        "1234",
  accentColor:     "#cc1f1f",
  defaultTheme:    "system",
  photosPerPage:   24,
  showExifData:    false,
  enableLightbox:  true,
  instagram:       "",
  twitter:         "",
  youtube:         "",
  facebook:        "",
  notifyOnUpload:  false,
  notifyEmail:     "",
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    // Zastosuj kolor akcentu live
    document.documentElement.style.setProperty("--color-accent", s.accentColor);
    // Zastosuj motyw
    if (s.defaultTheme !== "system") {
      document.documentElement.setAttribute("data-theme", s.defaultTheme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  } catch { /* silent */ }
}

const ACCENT_PRESETS = [
  { label: "Czerwony",     value: "#cc1f1f" },
  { label: "Niebieski",    value: "#0066cc" },
  { label: "Zielony",      value: "#1a7a3c" },
  { label: "Fioletowy",    value: "#6d28d9" },
  { label: "Pomarańczowy", value: "#d97706" },
  { label: "Grafitowy",    value: "#374151" },
];

const PHOTOS_PER_PAGE = [12, 24, 36, 48, 60];

// ── Sub-components ─────────────────────────────────────────────

function Section({ icon: Icon, title, desc, children }: {
  icon: React.ElementType; title: string; desc?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-xl)", overflow: "hidden",
    }}>
      <div style={{
        padding: "var(--space-5) var(--space-6)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex", alignItems: "center", gap: "var(--space-3)",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "var(--radius-lg)",
          background: "var(--color-accent-subtle)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--color-accent)", flexShrink: 0,
        }}>
          <Icon size={17} />
        </div>
        <div>
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, lineHeight: 1.3 }}>{title}</p>
          {desc && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{desc}</p>}
        </div>
      </div>
      <div style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, error, children }: {
  label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: "var(--text-xs)", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: ".08em",
        color: "var(--color-text-faint)", marginBottom: "var(--space-2)",
      }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: "var(--text-xs)", color: "#ef4444", fontWeight: 600, marginTop: "var(--space-1)", display: "flex", alignItems: "center", gap: 4 }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
      {!error && hint && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginTop: "var(--space-1)" }}>{hint}</p>
      )}
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "var(--space-4)", background: "var(--color-surface-offset)",
      borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)",
      gap: "var(--space-4)",
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{label}</p>
        {desc && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{desc}</p>}
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: "9999px",
          background: value ? "var(--color-accent)" : "var(--color-surface-dynamic)",
          border: "none", cursor: "pointer", position: "relative", flexShrink: 0,
          transition: "background .2s",
        }}
      >
        <div style={{
          position: "absolute", top: 3, left: 3,
          width: 18, height: 18, borderRadius: "50%", background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.3)",
          transform: value ? "translateX(20px)" : "translateX(0)",
          transition: "transform .2s cubic-bezier(.16,1,.3,1)",
        }} />
      </button>
    </div>
  );
}

function SocialField({ label, icon: Icon, value, onChange, placeholder }: {
  label: string; icon: React.ElementType; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <Field label={label}>
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", left: "var(--space-3)", top: "50%",
          transform: "translateY(-50%)", color: "var(--color-text-faint)",
          pointerEvents: "none", display: "flex",
        }}>
          <Icon size={15} />
        </div>
        <input
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingLeft: "var(--space-10)" }}
        />
      </div>
    </Field>
  );
}

// ── Główny komponent ───────────────────────────────────────────
export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loaded, setLoaded]     = useState(false);
  const [dirty, setDirty]       = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  // PIN state
  const [showPin, setShowPin]         = useState(false);
  const [showNewPin, setShowNewPin]   = useState(false);
  const [newPin, setNewPin]           = useState("");
  const [confirmPin, setConfirmPin]   = useState("");
  const [pinError, setPinError]       = useState("");

  // URL copy
  const [copied, setCopied] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof Settings | "newPin" | "confirmPin", string>>>({});

  // ── Load from localStorage on mount ──
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    // Zastosuj zapisany kolor akcentu live
    document.documentElement.style.setProperty("--color-accent", s.accentColor);
    setLoaded(true);
  }, []);

  // ── Live accent color preview ──
  useEffect(() => {
    if (!loaded) return;
    document.documentElement.style.setProperty("--color-accent", settings.accentColor);
  }, [settings.accentColor, loaded]);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaveState("idle");
    // Clear error for field
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  // ── Validation ──
  function validate(): boolean {
    const errs: typeof errors = {};
    if (!settings.siteName.trim()) errs.siteName = "Nazwa strony jest wymagana";
    if (!settings.authorName.trim()) errs.authorName = "Imię autora jest wymagane";
    if (settings.siteUrl && !/^https?:\/\//.test(settings.siteUrl)) errs.siteUrl = "URL musi zaczynać się od https://";
    if (settings.notifyOnUpload && !settings.notifyEmail.trim()) errs.notifyEmail = "Podaj adres e-mail";
    if (settings.notifyOnUpload && settings.notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.notifyEmail)) errs.notifyEmail = "Nieprawidłowy adres e-mail";

    // PIN validation
    if (newPin || confirmPin) {
      if (newPin.length < 4) errs.newPin = "PIN musi mieć minimum 4 znaki";
      else if (newPin !== confirmPin) errs.confirmPin = "PIN-y nie są identyczne";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Save ──
  const handleSave = useCallback(() => {
    if (!validate()) return;

    let finalSettings = { ...settings };

    // Apply PIN change
    if (newPin && newPin === confirmPin && newPin.length >= 4) {
      finalSettings = { ...finalSettings, adminPin: newPin };
      setSettings(finalSettings);
      setNewPin("");
      setConfirmPin("");
    }

    setPinError("");
    saveSettings(finalSettings);
    setSaveState("saved");
    setDirty(false);
    setTimeout(() => setSaveState("idle"), 3500);
  }, [settings, newPin, confirmPin]);

  // ── Reset ──
  function handleReset() {
    if (!window.confirm("Przywrócić wszystkie ustawienia do domyślnych?")) return;
    setSettings(DEFAULT);
    saveSettings(DEFAULT);
    setNewPin(""); setConfirmPin("");
    setPinError(""); setErrors({});
    setSaveState("idle"); setDirty(false);
  }

  // ── Copy URL ──
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(settings.siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  }

  if (!loaded) {
    return (
      <div style={{ minHeight: "40dvh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-faint)" }}>
        <p style={{ fontSize: "var(--text-sm)" }}>Ładowanie ustawień…</p>
      </div>
    );
  }

  const pinMatch = newPin && confirmPin && newPin === confirmPin && newPin.length >= 4;

  return (
    <>
      <style>{`
        .settings-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-6); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
        @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }

        .accent-dot {
          width: 28px; height: 28px; border-radius: 50%;
          border: 3px solid transparent;
          cursor: pointer; flex-shrink: 0;
          transition: transform .15s, border-color .15s, box-shadow .15s;
          background: none; padding: 0;
        }
        .accent-dot:hover { transform: scale(1.18); }
        .accent-dot.active {
          border-color: var(--color-text);
          box-shadow: 0 0 0 2px var(--color-bg);
        }

        .theme-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          gap: var(--space-2); padding: var(--space-4) var(--space-3);
          border-radius: var(--radius-lg);
          border: 2px solid var(--color-border);
          background: var(--color-surface-offset);
          cursor: pointer; font-size: var(--text-xs); font-weight: 600;
          color: var(--color-text-muted);
          transition: border-color .2s, background .2s, color .2s;
          font-family: inherit;
        }
        .theme-btn.active {
          border-color: var(--color-accent);
          background: var(--color-accent-subtle);
          color: var(--color-accent);
        }
        .theme-btn:hover:not(.active) {
          border-color: var(--color-border-strong, var(--color-border));
          background: var(--color-surface-dynamic);
          color: var(--color-text);
        }

        .per-page-btn {
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md); border: 1.5px solid;
          font-size: var(--text-sm); cursor: pointer;
          transition: all .15s; font-family: inherit;
        }

        .save-toast {
          position: fixed; bottom: var(--space-8); right: var(--space-8);
          padding: var(--space-3) var(--space-5);
          border-radius: var(--radius-full);
          font-size: var(--text-sm); font-weight: 600;
          display: flex; align-items: center; gap: var(--space-2);
          box-shadow: var(--shadow-lg); z-index: 9999;
          animation: toastIn .3s cubic-bezier(.16,1,.3,1);
        }
        .save-toast.saved { background: #1a1a1a; color: #fff; }
        .save-toast.error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .dirty-bar {
          position: sticky; top: 63px; z-index: 100;
          background: var(--color-accent);
          color: #fff;
          padding: var(--space-2) var(--space-6);
          display: flex; align-items: center;
          justify-content: space-between;
          font-size: var(--text-xs); font-weight: 600;
          animation: slideDown .25s ease;
          margin-bottom: var(--space-6);
          border-radius: var(--radius-lg);
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .input-error { border-color: #ef4444 !important; }
      `}</style>

      {/* ── Page header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "var(--space-8)", flexWrap: "wrap", gap: "var(--space-3)",
      }}>
        <div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 900,
            fontSize: "var(--text-xl)", letterSpacing: "-0.03em",
          }}>
            Ustawienia
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Konfiguracja strony, wyglądu i bezpieczeństwa
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button
            onClick={handleReset}
            style={{
              display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
              background: "transparent", cursor: "pointer",
              color: "var(--color-text-muted)", fontSize: "var(--text-sm)", fontWeight: 600,
              transition: "background .15s, color .15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-offset)"; e.currentTarget.style.color = "var(--color-text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
          >
            <RotateCcw size={14} /> Resetuj
          </button>
          <button
            onClick={handleSave}
            style={{
              display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
              padding: "var(--space-2) var(--space-5)",
              borderRadius: "var(--radius-md)",
              background: "var(--color-accent)", color: "#fff",
              border: "none", cursor: "pointer",
              fontSize: "var(--text-sm)", fontWeight: 700,
              transition: "opacity .15s, transform .15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = ".88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <Save size={14} /> Zapisz zmiany
          </button>
        </div>
      </div>

      {/* ── Dirty banner ── */}
      {dirty && (
        <div className="dirty-bar">
          <span>⚠ Masz niezapisane zmiany</span>
          <button
            onClick={handleSave}
            style={{
              background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", borderRadius: "var(--radius-md)", cursor: "pointer",
              padding: "var(--space-1) var(--space-3)", fontSize: "var(--text-xs)", fontWeight: 700,
              display: "flex", alignItems: "center", gap: "var(--space-2)",
            }}
          >
            <Save size={12} /> Zapisz teraz
          </button>
        </div>
      )}

      <div className="settings-grid">

        {/* ── 1. Witryna ── */}
        <Section icon={Globe} title="Witryna" desc="Podstawowe informacje o stronie">
          <div className="form-row">
            <Field label="Nazwa strony" error={errors.siteName}>
              <input
                className={`input ${errors.siteName ? "input-error" : ""}`}
                value={settings.siteName}
                onChange={(e) => set("siteName", e.target.value)}
                placeholder="AirShow Gallery"
              />
            </Field>
            <Field label="Tagline">
              <input
                className="input"
                value={settings.siteTagline}
                onChange={(e) => set("siteTagline", e.target.value)}
                placeholder="Pokazy lotnicze z bliska"
              />
            </Field>
          </div>
          <Field label="Opis strony" hint="Widoczny w wyszukiwarkach (meta description).">
            <textarea
              className="input" rows={3}
              value={settings.siteDescription}
              onChange={(e) => set("siteDescription", e.target.value)}
              style={{ resize: "vertical", fontFamily: "inherit" }}
              placeholder="Krótki opis strony…"
            />
          </Field>
          <Field label="URL strony" error={errors.siteUrl} hint="Pełny adres z https://">
            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
              <input
                className={`input ${errors.siteUrl ? "input-error" : ""}`}
                type="url"
                value={settings.siteUrl}
                onChange={(e) => set("siteUrl", e.target.value)}
                placeholder="https://airshow.example.com"
                style={{ flex: 1 }}
              />
              <button
                onClick={copyUrl}
                title="Skopiuj URL"
                style={{
                  width: 38, height: 38, flexShrink: 0,
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)", background: "var(--color-surface-offset)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: copied ? "#22c55e" : "var(--color-text-faint)",
                  transition: "color .2s",
                }}
              >
                {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
              </button>
              <a
                href={settings.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Otwórz stronę"
                style={{
                  width: 38, height: 38, flexShrink: 0,
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)", background: "var(--color-surface-offset)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--color-text-faint)", textDecoration: "none",
                  transition: "color .2s, background .2s",
                }}
              >
                <ExternalLink size={15} />
              </a>
            </div>
          </Field>
        </Section>

        {/* ── 2. Autor ── */}
        <Section icon={User} title="Autor" desc="Twoje dane wyświetlane na stronie">
          <div className="form-row">
            <Field label="Imię / pseudonim" error={errors.authorName}>
              <input
                className={`input ${errors.authorName ? "input-error" : ""}`}
                value={settings.authorName}
                onChange={(e) => set("authorName", e.target.value)}
                placeholder="Jan Kowalski"
              />
            </Field>
            <Field label="Avatar (URL)" hint="Link do zdjęcia profilowego">
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                <input
                  className="input"
                  value={settings.avatarUrl}
                  onChange={(e) => set("avatarUrl", e.target.value)}
                  placeholder="https://…"
                  style={{ flex: 1 }}
                />
                {settings.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.avatarUrl}
                    alt="avatar"
                    style={{
                      width: 38, height: 38, borderRadius: "50%",
                      objectFit: "cover", flexShrink: 0,
                      border: "2px solid var(--color-border)",
                    }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    border: "2px dashed var(--color-border)",
                    background: "var(--color-surface-offset)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--color-text-faint)",
                  }}>
                    <User size={16} />
                  </div>
                )}
              </div>
            </Field>
          </div>
          <Field label="Bio" hint="Krótka notka o sobie, widoczna w stopce.">
            <textarea
              className="input" rows={2}
              value={settings.authorBio}
              onChange={(e) => set("authorBio", e.target.value)}
              style={{ resize: "vertical", fontFamily: "inherit" }}
              placeholder="Kilka słów o sobie…"
            />
          </Field>
        </Section>

        {/* ── 3. Bezpieczeństwo ── */}
        <Section icon={Lock} title="Bezpieczeństwo" desc="PIN dostępu do panelu admina">
          <Field label="Aktualny PIN">
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showPin ? "text" : "password"}
                value={settings.adminPin}
                readOnly
                style={{
                  letterSpacing: "0.35em", fontWeight: 700,
                  paddingRight: "var(--space-10)",
                  background: "var(--color-surface-offset)",
                }}
              />
              <button
                onClick={() => setShowPin((v) => !v)}
                style={{
                  position: "absolute", right: "var(--space-3)", top: "50%",
                  transform: "translateY(-50%)", background: "none", border: "none",
                  cursor: "pointer", color: "var(--color-text-faint)", display: "flex",
                }}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <div className="form-row">
            <Field label="Nowy PIN" hint="Minimum 4 znaki" error={errors.newPin}>
              <div style={{ position: "relative" }}>
                <input
                  className={`input ${errors.newPin ? "input-error" : ""}`}
                  type={showNewPin ? "text" : "password"}
                  value={newPin}
                  onChange={(e) => { setNewPin(e.target.value); setErrors((p) => { const n = { ...p }; delete n.newPin; delete n.confirmPin; return n; }); }}
                  placeholder="••••"
                  maxLength={16}
                  style={{
                    letterSpacing: newPin ? "0.35em" : "normal",
                    fontWeight: newPin ? 700 : 400,
                    paddingRight: "var(--space-10)",
                  }}
                />
                <button
                  onClick={() => setShowNewPin((v) => !v)}
                  style={{
                    position: "absolute", right: "var(--space-3)", top: "50%",
                    transform: "translateY(-50%)", background: "none", border: "none",
                    cursor: "pointer", color: "var(--color-text-faint)", display: "flex",
                  }}
                >
                  {showNewPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <Field label="Potwierdź nowy PIN" error={errors.confirmPin}>
              <input
                className={`input ${errors.confirmPin ? "input-error" : ""}`}
                type="password"
                value={confirmPin}
                onChange={(e) => { setConfirmPin(e.target.value); setErrors((p) => { const n = { ...p }; delete n.confirmPin; return n; }); }}
                placeholder="••••"
                maxLength={16}
                style={{ letterSpacing: confirmPin ? "0.35em" : "normal", fontWeight: confirmPin ? 700 : 400 }}
              />
            </Field>
          </div>

          {pinMatch && (
            <div style={{
              display: "flex", alignItems: "center", gap: "var(--space-2)",
              padding: "var(--space-3) var(--space-4)",
              background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.25)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-xs)", fontWeight: 600, color: "#22c55e",
            }}>
              <Check size={13} /> PIN-y są identyczne — zostanie zapisany po kliknięciu „Zapisz zmiany"
            </div>
          )}
        </Section>

        {/* ── 4. Wygląd ── */}
        <Section icon={Palette} title="Wygląd" desc="Motyw kolorów, schemat i galeria">

          {/* Accent color */}
          <Field label="Kolor akcentu" hint="Zmiana jest widoczna od razu na całej stronie">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                {ACCENT_PRESETS.map(({ label, value }) => (
                  <button
                    key={value}
                    className={`accent-dot ${settings.accentColor === value ? "active" : ""}`}
                    title={label}
                    onClick={() => set("accentColor", value)}
                    style={{ background: value }}
                    aria-label={label}
                  />
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                  style={{
                    width: 38, height: 38,
                    borderRadius: "var(--radius-md)",
                    border: "1.5px solid var(--color-border)",
                    cursor: "pointer", padding: 2, background: "none",
                  }}
                />
                <span style={{
                  fontSize: "var(--text-xs)",
                  fontFamily: "var(--font-mono, 'Courier New', monospace)",
                  color: "var(--color-text-muted)", letterSpacing: ".05em",
                }}>
                  {settings.accentColor.toUpperCase()}
                </span>
                {/* Live preview swatch */}
                <div style={{
                  width: 80, height: 28, borderRadius: "var(--radius-md)",
                  background: settings.accentColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: ".05em" }}>PODGLĄD</span>
                </div>
              </div>
            </div>
          </Field>

          {/* Default theme */}
          <Field label="Domyślny motyw">
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              {([
                { value: "light",  label: "Jasny",  icon: Sun },
                { value: "dark",   label: "Ciemny", icon: Moon },
                { value: "system", label: "System", icon: Monitor },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  className={`theme-btn ${settings.defaultTheme === value ? "active" : ""}`}
                  onClick={() => set("defaultTheme", value)}
                >
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {/* Photos per page */}
          <Field label="Zdjęć na stronę" hint="Liczba zdjęć w galerii przed paginacją">
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {PHOTOS_PER_PAGE.map((n) => (
                <button
                  key={n}
                  className="per-page-btn"
                  onClick={() => set("photosPerPage", n)}
                  style={{
                    borderColor: settings.photosPerPage === n ? "var(--color-accent)" : "var(--color-border)",
                    background: settings.photosPerPage === n ? "var(--color-accent-subtle)" : "var(--color-surface)",
                    color: settings.photosPerPage === n ? "var(--color-accent)" : "var(--color-text-muted)",
                    fontWeight: settings.photosPerPage === n ? 700 : 400,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>

          <ToggleRow
            label="Lightbox"
            desc="Otwieraj zdjęcia w pełnoekranowym lightboxie"
            value={settings.enableLightbox}
            onChange={(v) => set("enableLightbox", v)}
          />
          <ToggleRow
            label="Dane EXIF"
            desc="Wyświetlaj parametry techniczne zdjęcia (aparat, ogniskowa, czas naświetlania)"
            value={settings.showExifData}
            onChange={(v) => set("showExifData", v)}
          />
        </Section>

        {/* ── 5. Social media ── */}
        <Section icon={Share2} title="Social Media" desc="Linki do Twoich profili społecznościowych">
          <div className="form-row">
            <SocialField label="Instagram"  icon={Instagram} value={settings.instagram} onChange={(v) => set("instagram", v)} placeholder="@twójprofil" />
            <SocialField label="Twitter / X" icon={Twitter}  value={settings.twitter}   onChange={(v) => set("twitter", v)}   placeholder="@twójprofil" />
            <SocialField label="YouTube"    icon={Youtube}   value={settings.youtube}   onChange={(v) => set("youtube", v)}   placeholder="youtube.com/c/…" />
            <SocialField label="Facebook"   icon={Facebook}  value={settings.facebook}  onChange={(v) => set("facebook", v)}  placeholder="facebook.com/…" />
          </div>
        </Section>

        {/* ── 6. Powiadomienia ── */}
        <Section icon={Bell} title="Powiadomienia" desc="Alerty e-mail o aktywności w galerii">
          <ToggleRow
            label="Powiadamiaj o nowych zdjęciach"
            desc="Wyślij e-mail gdy zostaną wgrane nowe zdjęcia"
            value={settings.notifyOnUpload}
            onChange={(v) => set("notifyOnUpload", v)}
          />
          {settings.notifyOnUpload && (
            <Field label="Adres e-mail" error={errors.notifyEmail} hint="Na ten adres będą wysyłane powiadomienia">
              <input
                className={`input ${errors.notifyEmail ? "input-error" : ""}`}
                type="email"
                value={settings.notifyEmail}
                onChange={(e) => set("notifyEmail", e.target.value)}
                placeholder="twoj@email.com"
              />
            </Field>
          )}
        </Section>

        {/* ── Bottom save bar ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: "var(--space-3)", paddingTop: "var(--space-2)",
          flexWrap: "wrap",
        }}>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
            {dirty
              ? "⚠ Masz niezapisane zmiany"
              : saveState === "saved"
              ? "✓ Wszystkie zmiany zapisane"
              : "Ustawienia przechowywane lokalnie w przeglądarce"}
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <button
              onClick={handleReset}
              style={{
                display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
                background: "transparent", cursor: "pointer",
                color: "var(--color-text-muted)", fontSize: "var(--text-sm)", fontWeight: 600,
              }}
            >
              <RotateCcw size={14} /> Przywróć domyślne
            </button>
            <button
              onClick={handleSave}
              style={{
                display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-5)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-accent)", color: "#fff",
                border: "none", cursor: "pointer",
                fontSize: "var(--text-sm)", fontWeight: 700,
              }}
            >
              <Save size={14} /> Zapisz zmiany
            </button>
          </div>
        </div>

      </div>

      {/* ── Toast ── */}
      {saveState !== "idle" && (
        <div className={`save-toast ${saveState}`}>
          {saveState === "saved"
            ? <><Check size={16} style={{ color: "#22c55e" }} /> Ustawienia zapisane pomyślnie!</>
            : <><AlertCircle size={16} /> Błąd zapisu — sprawdź formularz</>
          }
        </div>
      )}
    </>
  );
}