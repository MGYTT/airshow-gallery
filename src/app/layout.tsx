import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";

// ── Stałe ─────────────────────────────────────────────────────
const SITE_URL  = "https://airshow-gallery.vercel.app/";
const SITE_NAME = "MGYT AirShow Gallery";
const TITLE     = "MGYT AirShow Gallery — Pokazy Lotnicze";
const DESC      = "Fotograficzna kronika nieba — zdjęcia z pokazów lotniczych, relacje z eventów i kalendarz imprez na 2026 rok.";
const OG_IMAGE  = `${SITE_URL}/og-image.png`; // ← dodaj plik 1200×630px do /public

// ── Viewport ──────────────────────────────────────────────────
export const viewport: Viewport = {
  width:              "device-width",
  initialScale:       1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0c0c0c" },
  ],
};

// ── Metadata ──────────────────────────────────────────────────
export const metadata: Metadata = {
  // ── Podstawowe ──
  metadataBase: new URL(SITE_URL),
  title: {
    default:  TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESC,
  keywords: [
    "pokazy lotnicze", "airshow", "fotografia lotnicza", "airshow Polska",
    "galeria zdjęć lotniczych", "NATO Days", "Mazury AirShow", "MGYT",
    "kalendarz pokazów lotniczych 2026",
  ],
  authors:  [{ name: "MGYT" }],
  creator:  "MGYT",
  publisher: "MGYT AirShow Gallery",

  // ── Open Graph (Facebook, Messenger, WhatsApp, Discord…) ──
  openGraph: {
    type:        "website",
    url:         SITE_URL,
    siteName:    SITE_NAME,
    title:       TITLE,
    description: DESC,
    locale:      "pl_PL",
    images: [
      {
        url:    OG_IMAGE,
        width:  1200,
        height: 630,
        alt:    "MGYT AirShow Gallery — Pokazy Lotnicze",
      },
    ],
  },

  // ── Twitter / X Card ──
  twitter: {
    card:        "summary_large_image",
    title:       TITLE,
    description: DESC,
    images:      [OG_IMAGE],
  },

  // ── Canonical & robots ──
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index:          true,
    follow:         true,
    googleBot: {
      index:             true,
      follow:            true,
      "max-image-preview": "large",
      "max-snippet":       -1,
    },
  },

  // ── Ikony ──
  icons: {
    icon:        "/favicon.ico",
    shortcut:    "/favicon.ico",
    apple:       "/apple-touch-icon.png",  // 180×180px w /public
  },

  // ── Weryfikacja (opcjonalne — dodaj gdy masz) ──
  // verification: {
  //   google: "TWÓJ_KOD_GOOGLE_SEARCH_CONSOLE",
  // },
};

// ── Layout ────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        {/* Preconnect do fontów — szybsze ładowanie */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous"/>

        {/* JSON-LD — strukturalne dane dla Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type":    "WebSite",
            "name":     SITE_NAME,
            "url":      SITE_URL,
            "description": DESC,
            "inLanguage":  "pl-PL",
            "author": {
              "@type": "Person",
              "name":  "MGYT",
            },
            "potentialAction": {
              "@type":       "SearchAction",
              "target":      `${SITE_URL}/gallery?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          })}}
        />
      </head>
      <body>
        {/* Blokuje FOUC — ustawia motyw przed renderem */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var d = document.documentElement;
              var sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              d.setAttribute('data-theme', sys);
            } catch(e) {}
          })();
        `}} />
        <Navbar />
        <Analytics />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}