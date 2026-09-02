import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airshow-gallery.vercel.app"
).replace(/\/$/, "");

const SITE_NAME = "MGYT AirShow Gallery";

const DEFAULT_TITLE = "MGYT AirShow Gallery – pokazy lotnicze";

const DEFAULT_DESCRIPTION =
  "Autorska galeria zdjęć z pokazów lotniczych, relacje fotograficzne i kalendarz wydarzeń lotniczych w Polsce oraz Europie.";

const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

function escapeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#ffffff",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#0c0c0c",
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },

  description: DEFAULT_DESCRIPTION,

  applicationName: SITE_NAME,

  authors: [
    {
      name: "MGYT",
      url: SITE_URL,
    },
  ],

  creator: "MGYT",
  publisher: SITE_NAME,

  category: "Fotografia lotnicza",

  keywords: [
    "pokazy lotnicze",
    "airshow",
    "fotografia lotnicza",
    "zdjęcia samolotów",
    "galeria zdjęć lotniczych",
    "pokazy lotnicze Polska",
    "airshow Polska",
    "kalendarz pokazów lotniczych",
    "NATO Days",
    "Mazury AirShow",
    "MGYT AirShow Gallery",
  ],

  alternates: {
    canonical: SITE_URL,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    locale: "pl_PL",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "MGYT AirShow Gallery – zdjęcia i pokazy lotnicze",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },

  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
      },
    ],
  },

  manifest: "/site.webmanifest",

  verification: {
    /*
     * Po weryfikacji strony w Google Search Console wklej tylko kod,
     * np. "abcdEfghIJKlMNop", a nie pełny tag HTML.
     */
    // google: "TWÓJ_KOD_GOOGLE_SEARCH_CONSOLE",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: "AirShow Gallery",
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  inLanguage: "pl-PL",
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/apple-touch-icon.png`,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  logo: `${SITE_URL}/apple-touch-icon.png`,
  founder: {
    "@type": "Person",
    name: "MGYT",
  },
  sameAs: [
    /*
     * Dodaj wyłącznie autentyczne, publiczne profile marki.
     * Przykład:
     * "https://www.instagram.com/twoj_profil/",
     * "https://www.facebook.com/twoj_profil/",
     * "https://www.youtube.com/@twoj_kanal",
     */
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: escapeJsonLd(websiteJsonLd),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: escapeJsonLd(organizationJsonLd),
          }}
        />
      </head>

      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var root = document.documentElement;
                  var theme = window.matchMedia(
                    "(prefers-color-scheme: dark)"
                  ).matches
                    ? "dark"
                    : "light";

                  root.setAttribute("data-theme", theme);
                } catch (error) {}
              })();
            `,
          }}
        />

        <Navbar />
        <Analytics />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}