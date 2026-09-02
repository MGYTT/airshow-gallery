import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Compass,
  Home,
  Images,
  Plane,
  Search,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Nie znaleziono strony",
  description:
    "Podany adres nie prowadzi do dostępnej strony MGYT AirShow Gallery.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <>
      <style>{`
        .nf-page {
          position: relative;
          min-height: calc(100dvh - 64px);
          overflow: hidden;
          display: grid;
          place-items: center;
          padding: clamp(48px, 8vw, 112px) 20px;
          background:
            radial-gradient(
              circle at 76% 18%,
              color-mix(in srgb, var(--color-accent) 16%, transparent),
              transparent 28%
            ),
            radial-gradient(
              circle at 16% 86%,
              color-mix(in srgb, var(--color-accent) 10%, transparent),
              transparent 32%
            ),
            var(--color-bg);
        }

        .nf-grid {
          position: absolute;
          inset: 0;
          opacity: 0.4;
          pointer-events: none;
          background-image:
            linear-gradient(
              color-mix(in srgb, var(--color-border) 50%, transparent) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              color-mix(in srgb, var(--color-border) 50%, transparent) 1px,
              transparent 1px
            );
          background-size: 44px 44px;
          mask-image: linear-gradient(
            to bottom,
            transparent,
            rgba(0, 0, 0, 0.85) 20%,
            rgba(0, 0, 0, 0.85) 80%,
            transparent
          );
        }

        .nf-orbit {
          position: absolute;
          width: min(76vw, 920px);
          aspect-ratio: 1;
          border: 1px solid color-mix(
            in srgb,
            var(--color-accent) 22%,
            transparent
          );
          border-radius: 50%;
          right: -27vw;
          top: -30vw;
          pointer-events: none;
        }

        .nf-orbit::before,
        .nf-orbit::after {
          content: "";
          position: absolute;
          border: 1px solid color-mix(
            in srgb,
            var(--color-accent) 14%,
            transparent
          );
          border-radius: 50%;
        }

        .nf-orbit::before {
          width: 70%;
          aspect-ratio: 1;
          inset: 15%;
        }

        .nf-orbit::after {
          width: 42%;
          aspect-ratio: 1;
          inset: 29%;
        }

        .nf-plane-mark {
          position: absolute;
          top: 17%;
          right: 12%;
          color: var(--color-accent);
          opacity: 0.24;
          transform: rotate(-25deg);
          pointer-events: none;
        }

        .nf-content {
          position: relative;
          z-index: 1;
          width: min(100%, 820px);
          text-align: center;
        }

        .nf-code {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding: 7px 13px;
          border: 1px solid color-mix(
            in srgb,
            var(--color-accent) 34%,
            transparent
          );
          border-radius: 999px;
          background: color-mix(
            in srgb,
            var(--color-accent) 9%,
            transparent
          );
          color: var(--color-accent);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .nf-title {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(5.5rem, 18vw, 11rem);
          font-weight: 900;
          line-height: 0.8;
          letter-spacing: -0.09em;
          color: var(--color-text);
        }

        .nf-title span {
          color: var(--color-accent);
        }

        .nf-heading {
          max-width: 680px;
          margin: 30px auto 0;
          font-family: var(--font-display);
          font-size: clamp(1.65rem, 4vw, 2.5rem);
          font-weight: 900;
          letter-spacing: -0.045em;
          line-height: 1.05;
          color: var(--color-text);
        }

        .nf-copy {
          max-width: 550px;
          margin: 18px auto 0;
          color: var(--color-text-muted);
          font-size: clamp(0.95rem, 1.8vw, 1.06rem);
          line-height: 1.75;
        }

        .nf-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }

        .nf-action {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 0 18px;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text);
          font-size: var(--text-sm);
          font-weight: 750;
          text-decoration: none;
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .nf-action:hover {
          transform: translateY(-2px);
          background: var(--color-surface-offset);
          border-color: color-mix(
            in srgb,
            var(--color-accent) 42%,
            transparent
          );
          box-shadow: var(--shadow-sm);
        }

        .nf-action:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 3px;
        }

        .nf-action-primary {
          border-color: var(--color-accent);
          background: var(--color-accent);
          color: #ffffff;
        }

        .nf-action-primary:hover {
          border-color: var(--color-accent-hover);
          background: var(--color-accent-hover);
        }

        .nf-divider {
          width: min(100%, 680px);
          height: 1px;
          margin: clamp(42px, 7vw, 62px) auto 0;
          background: var(--color-divider);
        }

        .nf-suggestions-label {
          margin: 24px 0 14px;
          color: var(--color-text-faint);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .nf-suggestions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          text-align: left;
        }

        .nf-card {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 76px;
          padding: 14px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: color-mix(
            in srgb,
            var(--color-surface) 88%,
            transparent
          );
          color: var(--color-text);
          text-decoration: none;
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .nf-card:hover {
          transform: translateY(-3px);
          border-color: color-mix(
            in srgb,
            var(--color-accent) 42%,
            transparent
          );
          background: var(--color-surface-offset);
          box-shadow: var(--shadow-sm);
        }

        .nf-card:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 3px;
        }

        .nf-card-icon {
          width: 38px;
          height: 38px;
          display: grid;
          flex: 0 0 auto;
          place-items: center;
          border-radius: var(--radius-md);
          background: var(--color-accent-subtle);
          color: var(--color-accent);
        }

        .nf-card-text {
          min-width: 0;
        }

        .nf-card-title {
          display: block;
          font-size: var(--text-sm);
          font-weight: 800;
          line-height: 1.25;
        }

        .nf-card-copy {
          display: block;
          margin-top: 3px;
          color: var(--color-text-faint);
          font-size: 11px;
          line-height: 1.4;
        }

        .nf-footnote {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 28px;
          color: var(--color-text-faint);
          font-size: 12px;
        }

        @media (max-width: 720px) {
          .nf-page {
            min-height: calc(100dvh - 64px);
            padding: 48px 18px 62px;
          }

          .nf-orbit {
            width: 135vw;
            right: -72vw;
            top: -50vw;
          }

          .nf-plane-mark {
            right: 6%;
            top: 10%;
          }

          .nf-title {
            font-size: clamp(5rem, 27vw, 8rem);
          }

          .nf-heading {
            margin-top: 24px;
          }

          .nf-suggestions {
            grid-template-columns: 1fr;
          }

          .nf-card {
            min-height: 68px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nf-action,
          .nf-card {
            transition: none;
          }

          .nf-action:hover,
          .nf-card:hover {
            transform: none;
          }
        }
      `}</style>

      <main className="nf-page">
        <div className="nf-grid" aria-hidden="true" />
        <div className="nf-orbit" aria-hidden="true" />
        <Plane className="nf-plane-mark" size={114} aria-hidden="true" />

        <section className="nf-content" aria-labelledby="not-found-title">
          <div className="nf-code">
            <Compass size={14} />
            Błąd nawigacji · 404
          </div>

          <h1 id="not-found-title" className="nf-title">
            4<span>0</span>4
          </h1>

          <p className="nf-heading">Ten kierunek nie prowadzi do pokazu.</p>

          <p className="nf-copy">
            Strona mogła zostać przeniesiona, usunięta albo podany adres jest
            nieprawidłowy. Wróć do galerii, sprawdź kalendarz najbliższych
            wydarzeń lub przejdź na stronę główną.
          </p>

          <div className="nf-actions">
            <Link href="/" className="nf-action nf-action-primary">
              <Home size={17} />
              Strona główna
            </Link>

            <Link href="/gallery" className="nf-action">
              <Images size={17} />
              Zobacz galerie
            </Link>

            <Link href="/kalendarz" className="nf-action">
              <CalendarDays size={17} />
              Kalendarz pokazów
            </Link>
          </div>

          <div className="nf-divider" />

          <p className="nf-suggestions-label">Najpopularniejsze kierunki</p>

          <nav className="nf-suggestions" aria-label="Przydatne strony">
            <Link href="/gallery" className="nf-card">
              <span className="nf-card-icon">
                <Camera size={19} />
              </span>

              <span className="nf-card-text">
                <span className="nf-card-title">Galerie zdjęć</span>
                <span className="nf-card-copy">
                  Fotografie samolotów i pokazów lotniczych
                </span>
              </span>
            </Link>

            <Link href="/kalendarz" className="nf-card">
              <span className="nf-card-icon">
                <CalendarDays size={19} />
              </span>

              <span className="nf-card-text">
                <span className="nf-card-title">Kalendarz</span>
                <span className="nf-card-copy">
                  Nadchodzące wydarzenia lotnicze
                </span>
              </span>
            </Link>

            <Link href="/" className="nf-card">
              <span className="nf-card-icon">
                <Search size={19} />
              </span>

              <span className="nf-card-text">
                <span className="nf-card-title">Odkrywaj stronę</span>
                <span className="nf-card-copy">
                  Wróć do najnowszych materiałów
                </span>
              </span>
            </Link>
          </nav>

          <p className="nf-footnote">
            <ArrowLeft size={14} />
            Możesz też użyć przycisku „Wstecz” w przeglądarce.
          </p>
        </section>
      </main>
    </>
  );
}