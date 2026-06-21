"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plane, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") ?? "/admin";

  const [pin, setPin]           = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Countdown blokady
  useEffect(() => {
    if (!lockUntil) return;
    const tick = setInterval(() => {
      const left = Math.ceil((lockUntil - Date.now()) / 1000);
      if (left <= 0) {
        setLockUntil(null);
        setAttempts(0);
        setTimeLeft(0);
        clearInterval(tick);
      } else {
        setTimeLeft(left);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [lockUntil]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (lockUntil && Date.now() < lockUntil) return;
    if (!pin.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        // Sukces — przekieruj do admina
        router.push(redirect);
        router.refresh(); // odśwież middleware
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setPin("");

        if (next >= 3) {
          setLockUntil(Date.now() + 30_000);
          setError("Za dużo nieudanych prób. Odczekaj 30 sekund.");
        } else {
          setError(`Nieprawidłowy PIN. Pozostało prób: ${3 - next}`);
        }
      }
    } catch {
      setError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-bg)",
      padding: "var(--space-4)",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{
        width: "100%",
        maxWidth: 360,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-10)",
        boxShadow: "var(--shadow-lg)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: "var(--radius-xl)",
            background: "var(--color-accent-subtle)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto var(--space-4)",
            color: "var(--color-accent)",
          }}>
            <Plane size={24} />
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "var(--text-xl)",
            letterSpacing: "-0.03em",
            marginBottom: "var(--space-1)",
          }}>
            Admin Panel
          </h1>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
            AirShow Gallery
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "var(--space-4)" }}>
            <label style={{
              display: "block",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-2)",
            }}>
              PIN dostępu
            </label>
            <input
              className="input"
              type="password"
              inputMode="numeric"
              maxLength={32}
              placeholder="••••••••"
              value={pin}
              disabled={!!lockUntil || loading}
              onChange={(e) => { setPin(e.target.value); setError(""); }}
              autoFocus
              autoComplete="current-password"
              style={{
                fontSize: "var(--text-lg)",
                textAlign: "center",
                letterSpacing: pin ? "0.4em" : "normal",
                fontWeight: 700,
                borderColor: error ? "var(--color-error)" : undefined,
                opacity: (lockUntil || loading) ? 0.5 : 1,
              }}
            />

            {/* Błąd */}
            {error && (
              <p style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-error, #ef4444)",
                marginTop: "var(--space-2)",
                textAlign: "center",
                fontWeight: 600,
              }}>
                {lockUntil ? `🔒 ${error} (${timeLeft}s)` : `✗ ${error}`}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!!lockUntil || !pin.trim() || loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-2)",
              padding: "var(--space-3) var(--space-5)",
              borderRadius: "var(--radius-md)",
              background: (lockUntil || !pin.trim() || loading)
                ? "var(--color-surface-dynamic)"
                : "var(--color-accent)",
              color: (lockUntil || !pin.trim() || loading)
                ? "var(--color-text-faint)"
                : "#fff",
              border: "none",
              cursor: (lockUntil || !pin.trim() || loading) ? "not-allowed" : "pointer",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              transition: "all .15s",
            }}
          >
            {loading && (
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            )}
            {loading ? "Sprawdzanie…" : "Zaloguj się"}
          </button>
        </form>
      </div>
    </div>
  );
}