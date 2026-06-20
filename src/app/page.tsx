import HeroSection from "@/components/HeroSection";
import ShowCard from "@/components/ShowCard";
import { airShows } from "@/lib/data";
import { Plane, ArrowRight, Camera } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const featured = airShows.filter((s) => s.featured);
  const rest = airShows.filter((s) => !s.featured);
  const totalPhotos = airShows.reduce((sum, s) => sum + s.photoCount, 0);

  return (
    <>
      <style>{`
        .section-cta-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--color-accent);
          text-decoration: none;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: gap 0.2s ease, opacity 0.2s ease;
        }
        .section-cta-link:hover {
          gap: var(--space-3);
          opacity: 0.8;
        }
        .timeline-row {
          display: flex;
          gap: var(--space-4);
          align-items: center;
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .timeline-row:hover {
          transform: translateX(4px);
        }
      `}</style>

      <HeroSection />

      {/* ═══════════════════════════════════════
          SEKCJA POKAZÓW
      ═══════════════════════════════════════ */}
      <section
        id="pokazy"
        style={{
          padding: "clamp(var(--space-16), 8vw, var(--space-32)) 0",
        }}
      >
        <div className="container">

          {/* ── Section header ── */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "var(--space-12)",
              gap: "var(--space-6)",
              flexWrap: "wrap",
            }}
          >
            <div>
              <span
                className="badge"
                style={{ marginBottom: "var(--space-3)" }}
              >
                <Plane size={11} />
                Wyróżnione pokazy
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: "var(--text-2xl)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                }}
              >
                Najpiękniejsze
                <br />
                <span style={{ color: "var(--color-accent)" }}>
                  chwile w powietrzu
                </span>
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "var(--space-4)",
              }}
            >
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-muted)",
                  maxWidth: "300px",
                  textAlign: "right",
                  lineHeight: 1.6,
                }}
              >
                Wybrane relacje fotograficzne z największych eventów lotniczych
              </p>
              <Link href="/gallery" className="section-cta-link">
                Cała galeria
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* ── Featured 2-column grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(400px, 100%), 1fr))",
              gap: "var(--space-6)",
              marginBottom: "var(--space-20)",
            }}
          >
            {featured.map((show) => (
              <ShowCard key={show.id} show={show} featured />
            ))}
          </div>

          {/* ── Divider with label ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-4)",
              marginBottom: "var(--space-10)",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "1px",
                background:
                  "linear-gradient(to right, var(--color-accent), var(--color-divider))",
              }}
            />
            <span
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--color-text-faint)",
                whiteSpace: "nowrap",
              }}
            >
              Pozostałe pokazy
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "var(--color-divider)",
              }}
            />
          </div>

          {/* ── 3-column grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
              gap: "var(--space-6)",
            }}
          >
            {rest.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>

          {/* ── Bottom CTA row ── */}
          <div
            style={{
              marginTop: "var(--space-12)",
              paddingTop: "var(--space-10)",
              borderTop: "1px solid var(--color-divider)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "var(--space-4)",
            }}
          >
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              Łącznie{" "}
              <strong style={{ color: "var(--color-text)" }}>
                {totalPhotos}
              </strong>{" "}
              zdjęć z{" "}
              <strong style={{ color: "var(--color-text)" }}>
                {airShows.length}
              </strong>{" "}
              pokazów
            </p>
            <Link href="/gallery" className="btn btn-primary">
              <Camera size={15} />
              Przeglądaj wszystkie zdjęcia
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SEKCJA O MNIE
      ═══════════════════════════════════════ */}
      <section
        id="o-mnie"
        style={{
          padding: "clamp(var(--space-16), 8vw, var(--space-32)) 0",
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-divider)",
          borderBottom: "1px solid var(--color-divider)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ghost background */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-2%",
            bottom: "-10%",
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "clamp(8rem, 22vw, 22rem)",
            lineHeight: 1,
            color: "var(--color-text)",
            opacity: 0.025,
            userSelect: "none",
            pointerEvents: "none",
            letterSpacing: "-0.06em",
          }}
        >
          NT
        </div>

        <div
          className="container--narrow"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "3px 1fr",
              gap: "var(--space-8)",
              alignItems: "start",
            }}
          >
            {/* Red accent bar */}
            <div
              style={{
                width: "3px",
                background:
                  "linear-gradient(to bottom, var(--color-accent), transparent)",
                borderRadius: "var(--radius-full)",
                alignSelf: "stretch",
              }}
            />

            <div>
              <span
                className="badge"
                style={{ marginBottom: "var(--space-5)" }}
              >
                O mnie
              </span>

              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: "var(--text-2xl)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  marginBottom: "var(--space-8)",
                }}
              >
                Pasja do nieba
                <br />
                <span style={{ color: "var(--color-accent)" }}>od zawsze.</span>
              </h2>

              <p
                style={{
                  fontSize: "var(--text-base)",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.8,
                  marginBottom: "var(--space-5)",
                }}
              >
                Wychowałem się w okolicach{" "}
                <strong style={{ color: "var(--color-text)" }}>
                  Nowego Targu
                </strong>{" "}
                — i już jako dziecko trafiłem na pierwsze{" "}
                <strong style={{ color: "var(--color-text)" }}>
                  Pikniki Lotnicze na Aeroklubie Nowy Targ
                </strong>
                . To tam zrodziła się miłość do lotnictwa. Ryk silników, zapach
                paliwa i maszyny sunące przez podhalańskie niebo — to coś, czego
                nie da się zapomnieć.
              </p>

              <p
                style={{
                  fontSize: "var(--text-base)",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.8,
                  marginBottom: "var(--space-8)",
                }}
              >
                W 2025 roku spełniłem marzenie i pojechałem na{" "}
                <strong style={{ color: "var(--color-accent)" }}>
                  NATO Days w Ostrawie
                </strong>{" "}
                — jeden z największych pokazów militarnych w Europie Środkowej.
                Aparat nigdy nie opuszcza mojej torby. Ta strona to mój prywatny
                album — wspomnienia, które chcę zachować i podzielić się nimi z
                innymi miłośnikami lotnictwa.
              </p>

              {/* ── Timeline ── */}
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-text-faint)",
                  marginBottom: "var(--space-3)",
                }}
              >
                Kluczowe momenty
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                {[
                  {
                    year: "dzieciństwo",
                    event: "Pierwsze Pikniki Lotnicze — Aeroklub Nowy Targ",
                    accent: false,
                  },
                  {
                    year: "2025",
                    event: "NATO Days — Ostrava, Czechy",
                    accent: true,
                  },
                ].map(({ year, event, accent }) => (
                  <div
                    key={year}
                    className="timeline-row"
                    style={{
                      border: `1px solid ${
                        accent ? "var(--color-accent)" : "var(--color-border)"
                      }`,
                      background: accent
                        ? "var(--color-accent-subtle)"
                        : "var(--color-surface-offset)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 900,
                        fontSize: "var(--text-xs)",
                        color: accent
                          ? "var(--color-accent)"
                          : "var(--color-text-faint)",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        minWidth: "90px",
                        flexShrink: 0,
                      }}
                    >
                      {year}
                    </span>
                    <span
                      style={{
                        width: "1px",
                        height: "20px",
                        background: accent
                          ? "var(--color-accent)"
                          : "var(--color-divider)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: 500,
                        color: accent
                          ? "var(--color-text)"
                          : "var(--color-text-muted)",
                      }}
                    >
                      {event}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}