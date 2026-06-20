import Link from "next/link";
import { ArrowRight, Camera, MapPin } from "lucide-react";

export default function HeroSection() {
  return (
    <section
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
        paddingTop: "64px",
      }}
    >
      {/* Background — aviation runway diagonal stripes */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `
            repeating-linear-gradient(
              -55deg,
              transparent,
              transparent 60px,
              var(--color-surface) 60px,
              var(--color-surface) 62px
            )
          `,
          opacity: 0.6,
        }}
      />

      {/* Giant ghost year */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: "-2%",
          bottom: "-5%",
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: "clamp(12rem, 30vw, 28rem)",
          lineHeight: 1,
          color: "var(--color-text)",
          opacity: 0.03,
          userSelect: "none",
          letterSpacing: "-0.06em",
        }}
      >
        2025
      </div>

      {/* Red vertical accent bar */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "clamp(20px, 4vw, 60px)",
          top: "20%",
          bottom: "20%",
          width: "3px",
          background: "var(--color-accent)",
          opacity: 0.8,
          borderRadius: "var(--radius-full)",
        }}
      />

      {/* Main content */}
      <div
        className="container"
        style={{
          position: "relative",
          zIndex: 1,
          paddingTop: "var(--space-16)",
          paddingBottom: "var(--space-16)",
        }}
      >
        <div style={{ maxWidth: "860px", paddingLeft: "clamp(24px, 6vw, 80px)" }}>

          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              marginBottom: "var(--space-6)",
              flexWrap: "wrap",
            }}
          >
            <span className="badge">
              <Camera size={11} />
              Fotografia Lotnicza
            </span>
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-faint)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-1)",
              }}
            >
              <MapPin size={11} />
              Nowy Targ, Polska
            </span>
          </div>

          {/* Main headline */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-hero)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              marginBottom: "var(--space-8)",
            }}
          >
            Niebo
            <br />
            <span style={{ color: "var(--color-accent)" }}>pełne</span>
            <br />
            emocji.
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: "var(--text-lg)",
              color: "var(--color-text-muted)",
              lineHeight: 1.6,
              maxWidth: "540px",
              marginBottom: "var(--space-10)",
            }}
          >
            Od dziecka zakochany w lotnictwie —
            najpierw na{" "}
            <span style={{ color: "var(--color-text)", fontWeight: 600 }}>
              Piknikach Lotniczych w Nowym Targu
            </span>
            , potem na{" "}
            <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
              NATO Days 2025
            </span>
            . Aparat zawsze gotowy.
          </p>

          {/* CTA group */}
          <div
            style={{
              display: "flex",
              gap: "var(--space-4)",
              flexWrap: "wrap",
            }}
          >
            <Link href="/gallery" className="btn btn-primary">
              Przeglądaj galerię
              <ArrowRight size={16} />
            </Link>
            <Link href="/#pokazy" className="btn btn-ghost">
              Zobacz pokazy
            </Link>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "var(--space-10)",
              marginTop: "var(--space-16)",
              paddingTop: "var(--space-8)",
              borderTop: "1px solid var(--color-divider)",
              flexWrap: "wrap",
            }}
          >
            {[
              { value: "10+", label: "Pokazy lotnicze" },
              { value: "∞", label: "Pasja do lotnictwa" },
              { value: "od dziecka", label: "Aeroklub Nowy Targ" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: "var(--text-2xl)",
                    color: "var(--color-text)",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginTop: "var(--space-2)",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Shows ribbon — subtelna lista pokazów */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              marginTop: "var(--space-8)",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-faint)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 600,
              }}
            >
              Byłem na:
            </span>

            {[
              { label: "NATO Days 2025", accent: true },
              { label: "Piknik Lotniczy Nowy Targ", accent: false },
            ].map(({ label, accent }) => (
              <span
                key={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  padding: "var(--space-1) var(--space-3)",
                  borderRadius: "var(--radius-full)",
                  border: `1px solid ${accent ? "var(--color-accent)" : "var(--color-border)"}`,
                  color: accent ? "var(--color-accent)" : "var(--color-text-muted)",
                  background: accent
                    ? "var(--color-accent-subtle)"
                    : "var(--color-surface)",
                }}
              >
                ✈ {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}