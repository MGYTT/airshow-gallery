import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Images,
  ChevronLeft,
  Star,
  Tag,
  ArrowRight,
  Home,
  Hash,
  Plane,
} from "lucide-react";
import PhotoGrid from "@/components/PhotoGrid";
import StoriesBar from "@/components/stories/StoriesBar";
import ShareButton from "@/components/ShareButton";

interface AirShow {
  id: string;
  name: string;
  location: string;
  date: string;
  year: number;
  description: string;
  coverImage: string;
  photoCount: number;
  tags: string[];
  featured: boolean;
}

interface Photo {
  id: string;
  showId: string;
  src: string;
  alt: string;
  aircraft: string;
  width: number;
  height: number;
  tags: string[];
  featured: boolean;
}

export const revalidate = 300;

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airshow-gallery.vercel.app"
).replace(/\/$/, "");

const SITE_NAME = "MGYT AirShow Gallery";
const FALLBACK_OG_IMAGE = `${SITE_URL}/og-image.png`;

function getSbHeaders(): Record<string, string> | null {
  if (!BASE || !API_KEY) {
    console.error(
      "Brak NEXT_PUBLIC_SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_ANON_KEY w zmiennych środowiskowych."
    );

    return null;
  }

  return {
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
  };
}

function mapShow(value: Record<string, unknown>): AirShow {
  return {
    id: value.id as string,
    name: (value.name as string) ?? "",
    location: (value.location as string) ?? "",
    date: (value.date as string) ?? "",
    year: (value.year as number) ?? 0,
    description: (value.description as string) ?? "",
    coverImage: (value.cover_image as string) ?? "",
    photoCount: (value.photo_count as number) ?? 0,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    featured: Boolean(value.featured),
  };
}

function mapPhoto(value: Record<string, unknown>): Photo {
  return {
    id: value.id as string,
    showId: value.show_id as string,
    src: (value.src as string) ?? "",
    alt: (value.alt as string) ?? "",
    aircraft: (value.aircraft as string) ?? "",
    width: Number(value.width) || 0,
    height: Number(value.height) || 0,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    featured: Boolean(value.featured),
  };
}

function formatShowDate(dateStr: string, year: number): string {
  if (!dateStr) {
    return year ? String(year) : "Data nieznana";
  }

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getNameWithYear(show: AirShow) {
  const hasYearInName =
    show.year > 0 && new RegExp(`\\b${show.year}\\b`).test(show.name);

  return hasYearInName
    ? show.name.trim()
    : `${show.name.trim()}${show.year ? ` ${show.year}` : ""}`.trim();
}

function getLocationParts(location: string) {
  return location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getCity(location: string) {
  return getLocationParts(location)[0] ?? "";
}

function getCountry(location: string) {
  const parts = getLocationParts(location);

  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function photoCountLabel(count: number) {
  if (count === 1) {
    return "1 zdjęcie";
  }

  if (count >= 2 && count <= 4) {
    return `${count} zdjęcia`;
  }

  return `${count} zdjęć`;
}

function photographCountLabel(count: number) {
  if (count === 1) {
    return "1 fotografię";
  }

  if (count >= 2 && count <= 4) {
    return `${count} fotografie`;
  }

  return `${count} fotografii`;
}

function truncateMetaDescription(value: string, maxLength = 158) {
  const normalized = normalizeText(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const shortened = normalized.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  const cleanValue =
    lastSpace > 90 ? shortened.slice(0, lastSpace) : shortened;

  return `${cleanValue.trimEnd()}…`;
}

function makeGalleryTitle(show: AirShow) {
  const nameWithYear = getNameWithYear(show);
  const city = getCity(show.location);

  if (city) {
    return `${nameWithYear} – zdjęcia z pokazów w ${city}`;
  }

  return `${nameWithYear} – zdjęcia`;
}

function makeGalleryDescription(show: AirShow, photoCount: number) {
  const nameWithYear = getNameWithYear(show);
  const city = getCity(show.location);
  const country = getCountry(show.location);
  const description = normalizeText(show.description);

  /*
   * Przy dłuższym, własnym opisie galerii wykorzystujemy go jako bazę
   * snippetu. Nie zastępujemy jednak opisu losową treścią UI.
   */
  if (description.length >= 70) {
    const hasPhotoContext = /zdjęci|fotograf|galeri/i.test(description);

    return truncateMetaDescription(
      hasPhotoContext
        ? description
        : `${description} Zobacz ${photographCountLabel(photoCount)} z galerii.`
    );
  }

  /*
   * Wyjątek dla naturalnej odmiany konkretnej nazwy własnej.
   * Pozostałych nazw pokazów nie odmieniamy automatycznie, aby uniknąć błędów.
   */
  if (nameWithYear === "Nowotarski Piknik Lotniczy 2025") {
    return truncateMetaDescription(
      `Zdjęcia z Nowotarskiego Pikniku Lotniczego 2025. Zobacz ${photographCountLabel(photoCount)} samolotów wykonanych podczas pokazów w Nowym Targu.`
    );
  }

  if (city && country) {
    return truncateMetaDescription(
      `${nameWithYear} w ${city} – zobacz ${photographCountLabel(photoCount)} samolotów z pokazów lotniczych w ${country}.`
    );
  }

  if (city) {
    return truncateMetaDescription(
      `${nameWithYear} – zobacz ${photographCountLabel(photoCount)} samolotów z pokazów lotniczych w ${city}.`
    );
  }

  return truncateMetaDescription(
    `${nameWithYear} – zobacz ${photographCountLabel(photoCount)} samolotów z tej galerii pokazów lotniczych.`
  );
}

function getJsonLdSafe(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function uniqueAircraftNames(photos: Photo[]) {
  const seen = new Set<string>();
  const aircraft: string[] = [];

  for (const photo of photos) {
    const name = normalizeText(photo.aircraft);

    if (!name) {
      continue;
    }

    const key = name.toLocaleLowerCase("pl-PL");

    if (!seen.has(key)) {
      seen.add(key);
      aircraft.push(name);
    }
  }

  return aircraft;
}

const getShow = cache(async (id: string): Promise<AirShow | null> => {
  const headers = getSbHeaders();

  if (!headers || !BASE || !id) {
    return null;
  }

  try {
    const response = await fetch(
      `${BASE}/rest/v1/air_shows?select=*&id=eq.${encodeURIComponent(id)}&published=eq.true&limit=1`,
      {
        headers,
        next: { revalidate },
      }
    );

    if (!response.ok) {
      console.error(`Nie udało się pobrać galerii. HTTP ${response.status}.`);
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>[];

    return data[0] ? mapShow(data[0]) : null;
  } catch (error) {
    console.error("Błąd pobierania pokazu:", error);
    return null;
  }
});

const getPhotos = cache(async (showId: string): Promise<Photo[]> => {
  const headers = getSbHeaders();

  if (!headers || !BASE || !showId) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE}/rest/v1/photos?select=*&show_id=eq.${encodeURIComponent(showId)}&order=featured.desc,created_at.asc`,
      {
        headers,
        next: { revalidate },
      }
    );

    if (!response.ok) {
      console.error(`Nie udało się pobrać zdjęć. HTTP ${response.status}.`);
      return [];
    }

    const data = (await response.json()) as Record<string, unknown>[];

    return data
      .map(mapPhoto)
      .filter((photo) => Boolean(photo.id && photo.src));
  } catch (error) {
    console.error("Błąd pobierania zdjęć:", error);
    return [];
  }
});

async function getOtherShows(excludeId: string): Promise<AirShow[]> {
  const headers = getSbHeaders();

  if (!headers || !BASE) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE}/rest/v1/air_shows?select=*&published=eq.true&id=neq.${encodeURIComponent(excludeId)}&order=year.desc&limit=3`,
      {
        headers,
        next: { revalidate },
      }
    );

    if (!response.ok) {
      console.error(
        `Nie udało się pobrać innych galerii. HTTP ${response.status}.`
      );
      return [];
    }

    const data = (await response.json()) as Record<string, unknown>[];

    return data.map(mapShow);
  } catch (error) {
    console.error("Błąd pobierania innych pokazów:", error);
    return [];
  }
}

export async function generateStaticParams() {
  const headers = getSbHeaders();

  if (!headers || !BASE) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE}/rest/v1/air_shows?select=id&published=eq.true`,
      {
        headers,
        next: { revalidate },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as Array<{ id: string }>;

    return data
      .filter((show) => Boolean(show.id))
      .map((show) => ({ id: show.id }));
  } catch (error) {
    console.error("Błąd generateStaticParams dla /pokaz/[id]:", error);
    return [];
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const show = await getShow(id);

  if (!show) {
    return {
      title: "Galeria nie została znaleziona",
      description:
        "Ta galeria pokazów lotniczych nie istnieje lub nie jest opublikowana.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const photos = await getPhotos(show.id);
  const title = makeGalleryTitle(show);
  const description = makeGalleryDescription(show, photos.length);
  const pageUrl = `${SITE_URL}/pokaz/${encodeURIComponent(show.id)}`;
  const image = show.coverImage || FALLBACK_OG_IMAGE;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      siteName: SITE_NAME,
      locale: "pl_PL",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${getNameWithYear(show)} — galeria zdjęć z pokazów lotniczych`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function ShowPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const [show, photos, otherShows] = await Promise.all([
    getShow(id),
    getPhotos(id),
    getOtherShows(id),
  ]);

  if (!show) {
    notFound();
  }

  const pageUrl = `${SITE_URL}/pokaz/${encodeURIComponent(show.id)}`;
  const formattedDate = formatShowDate(show.date, show.year);
  const pageTitle = makeGalleryTitle(show);
  const pageDescription = makeGalleryDescription(show, photos.length);
  const aircraft = uniqueAircraftNames(photos);
  const featuredPhotos = photos.filter((photo) => photo.featured);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Strona główna",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Galeria",
        item: `${SITE_URL}/gallery`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: getNameWithYear(show),
        item: pageUrl,
      },
    ],
  };

  const galleryJsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: pageTitle,
    description: pageDescription,
    url: pageUrl,
    image: photos.slice(0, 20).map((photo) => ({
      "@type": "ImageObject",
      contentUrl: photo.src,
      url: photo.src,
      caption: photo.alt || photo.aircraft || getNameWithYear(show),
      width: photo.width || undefined,
      height: photo.height || undefined,
    })),
    about: {
      "@type": "Event",
      name: getNameWithYear(show),
      startDate: show.date || undefined,
      location: show.location
        ? {
            "@type": "Place",
            name: show.location,
          }
        : undefined,
    },
    creator: {
      "@type": "Person",
      name: "MGYT",
    },
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: getJsonLdSafe(breadcrumbJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: getJsonLdSafe(galleryJsonLd),
        }}
      />

      <style>{`
        .sp-wrap { padding-top:64px; min-height:100dvh; }

        @keyframes sp-up {
          from { opacity:0; transform:translateY(20px); }
          to { opacity:1; transform:translateY(0); }
        }

        @keyframes sp-zoom {
          from { transform:scale(1.08); }
          to { transform:scale(1); }
        }

        .sp-anim-1 { animation:sp-up .5s cubic-bezier(.16,1,.3,1) both; }
        .sp-anim-2 { animation:sp-up .5s .07s cubic-bezier(.16,1,.3,1) both; }
        .sp-anim-3 { animation:sp-up .5s .14s cubic-bezier(.16,1,.3,1) both; }

        @media (prefers-reduced-motion: reduce) {
          .sp-anim-1,
          .sp-anim-2,
          .sp-anim-3 {
            animation:none;
            opacity:1;
          }

          .sp-hero-img {
            animation:none !important;
          }
        }

        .sp-hero {
          position:relative;
          height:clamp(340px,52vw,620px);
          background:#0a0a0a;
          overflow:hidden;
        }

        .sp-hero-img {
          animation:sp-zoom 8s cubic-bezier(.16,1,.3,1) both;
        }

        .sp-hero-overlay {
          position:absolute;
          inset:0;
          background:linear-gradient(
            160deg,
            rgba(0,0,0,.05) 0%,
            rgba(0,0,0,.55) 55%,
            rgba(0,0,0,.88) 100%
          );
          z-index:1;
        }

        .sp-hero-content {
          position:absolute;
          bottom:0;
          left:0;
          right:0;
          z-index:2;
          padding:clamp(var(--space-6),5vw,var(--space-12))
            clamp(var(--space-5),5vw,var(--space-12));
        }

        .sp-hero-inner {
          max-width:var(--content-wide);
          margin:0 auto;
        }

        .sp-hero-placeholder {
          position:absolute;
          inset:0;
          display:flex;
          align-items:center;
          justify-content:center;
          background:linear-gradient(
            135deg,
            var(--color-surface-offset) 0%,
            var(--color-surface-dynamic) 100%
          );
        }

        .sp-title {
          font-family:var(--font-display);
          font-weight:900;
          font-size:var(--text-2xl);
          letter-spacing:-0.04em;
          color:#fff;
          line-height:1.05;
          margin-bottom:var(--space-4);
          text-shadow:0 2px 24px rgba(0,0,0,.4);
        }

        @media(max-width:640px) {
          .sp-title {
            font-size:var(--text-xl);
          }
        }

        .sp-chips {
          display:flex;
          flex-wrap:wrap;
          gap:var(--space-2);
          margin-bottom:var(--space-4);
        }

        .sp-chip {
          display:inline-flex;
          align-items:center;
          gap:5px;
          font-size:var(--text-xs);
          font-weight:600;
          color:rgba(255,255,255,.9);
          background:rgba(255,255,255,.1);
          backdrop-filter:blur(8px);
          -webkit-backdrop-filter:blur(8px);
          padding:var(--space-2) var(--space-3);
          border-radius:var(--radius-full);
          border:1px solid rgba(255,255,255,.18);
          white-space:nowrap;
        }

        .sp-chip--featured {
          background:rgba(251,191,36,.18);
          border-color:rgba(251,191,36,.4);
          color:#fde68a;
        }

        .sp-hero-actions {
          display:flex;
          align-items:center;
          gap:var(--space-3);
          margin-bottom:var(--space-5);
        }

        .sp-back-btn {
          display:inline-flex;
          align-items:center;
          gap:var(--space-2);
          color:rgba(255,255,255,.65);
          font-size:var(--text-xs);
          font-weight:600;
          text-decoration:none;
          padding:var(--space-2) var(--space-3);
          border-radius:var(--radius-full);
          background:rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.12);
          transition:background .15s,color .15s;
        }

        .sp-back-btn:hover {
          background:rgba(255,255,255,.15);
          color:#fff;
        }

        .sp-back-btn:focus-visible {
          outline:2px solid #fff;
          outline-offset:2px;
        }

        .sp-nav-bar {
          border-bottom:1px solid var(--color-divider);
          background:var(--color-surface);
        }

        .sp-nav-bar-inner {
          max-width:var(--content-wide);
          margin:0 auto;
          padding:var(--space-3)
            clamp(var(--space-5),5vw,var(--space-12));
        }

        .sp-breadcrumb {
          display:flex;
          align-items:center;
          gap:var(--space-2);
          font-size:var(--text-xs);
          color:var(--color-text-faint);
          flex-wrap:wrap;
        }

        .sp-breadcrumb a {
          color:var(--color-text-faint);
          text-decoration:none;
          transition:color .15s;
          display:inline-flex;
          align-items:center;
          gap:4px;
        }

        .sp-breadcrumb a:hover {
          color:var(--color-text);
        }

        .sp-breadcrumb-sep {
          opacity:.4;
        }

        .sp-breadcrumb-current {
          color:var(--color-text-muted);
          font-weight:600;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
          max-width:280px;
        }

        .sp-body {
          max-width:var(--content-wide);
          margin:0 auto;
          padding:var(--space-8)
            clamp(var(--space-5),5vw,var(--space-12));
        }

        .sp-desc {
          font-size:var(--text-base);
          color:var(--color-text-muted);
          max-width:72ch;
          line-height:1.8;
          margin-bottom:var(--space-6);
        }

        .sp-meta-strip {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(120px,1fr));
          gap:var(--space-3);
          margin-bottom:var(--space-6);
        }

        .sp-meta-card {
          display:flex;
          align-items:center;
          gap:var(--space-3);
          padding:var(--space-3) var(--space-4);
          background:var(--color-surface);
          border:1px solid var(--color-border);
          border-radius:var(--radius-lg);
        }

        .sp-meta-icon {
          width:32px;
          height:32px;
          border-radius:var(--radius-md);
          background:var(--color-surface-offset);
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
          color:var(--color-accent);
        }

        .sp-meta-text {
          display:flex;
          flex-direction:column;
          gap:1px;
          min-width:0;
        }

        .sp-meta-label {
          font-size:10px;
          font-weight:700;
          text-transform:uppercase;
          letter-spacing:.08em;
          color:var(--color-text-faint);
          white-space:nowrap;
        }

        .sp-meta-value {
          font-size:var(--text-sm);
          font-weight:700;
          color:var(--color-text);
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
          font-variant-numeric:tabular-nums;
        }

        @media(max-width:480px) {
          .sp-meta-strip {
            grid-template-columns:1fr 1fr;
          }
        }

        .sp-tags {
          display:flex;
          flex-wrap:wrap;
          gap:var(--space-2);
          align-items:center;
          margin-bottom:var(--space-2);
        }

        .sp-tag {
          font-size:var(--text-xs);
          padding:3px 12px;
          border-radius:var(--radius-full);
          background:var(--color-surface-offset);
          border:1px solid var(--color-border);
          color:var(--color-text-muted);
          text-decoration:none;
          transition:background .15s,color .15s,border-color .15s;
          white-space:nowrap;
          font-weight:500;
        }

        .sp-tag:hover {
          background:var(--color-surface-dynamic);
          color:var(--color-text);
          border-color:color-mix(
            in srgb,
            var(--color-accent) 40%,
            transparent
          );
        }

        .sp-tag:focus-visible {
          outline:2px solid var(--color-accent);
          outline-offset:2px;
        }

        .sp-section-head {
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:var(--space-5);
          padding-top:var(--space-8);
          border-top:1px solid var(--color-divider);
          flex-wrap:wrap;
          gap:var(--space-3);
        }

        .sp-section-title {
          font-family:var(--font-display);
          font-weight:900;
          font-size:var(--text-lg);
          letter-spacing:-0.02em;
          display:flex;
          align-items:center;
        }

        .sp-section-count {
          font-weight:400;
          color:var(--color-text-faint);
          font-size:var(--text-sm);
          margin-left:var(--space-2);
          font-family:inherit;
        }

        .sp-section-link {
          display:inline-flex;
          align-items:center;
          gap:4px;
          font-size:var(--text-xs);
          font-weight:700;
          color:var(--color-accent);
          text-decoration:none;
        }

        .sp-section-link:hover {
          text-decoration:underline;
        }

        .sp-featured-strip {
          display:grid;
          grid-auto-flow:column;
          grid-auto-columns:minmax(240px,1fr);
          gap:var(--space-4);
          overflow-x:auto;
          padding-bottom:var(--space-2);
          scroll-snap-type:x proximity;
        }

        .sp-featured-strip::-webkit-scrollbar {
          height:6px;
        }

        .sp-featured-strip::-webkit-scrollbar-thumb {
          background:var(--color-border);
          border-radius:var(--radius-full);
        }

        .sp-featured-item {
          position:relative;
          aspect-ratio:4/3;
          border-radius:var(--radius-lg);
          overflow:hidden;
          background:var(--color-surface-offset);
          scroll-snap-align:start;
          border:1px solid var(--color-border);
        }

        .sp-featured-badge {
          position:absolute;
          top:var(--space-2);
          left:var(--space-2);
          display:inline-flex;
          align-items:center;
          gap:4px;
          background:rgba(0,0,0,.65);
          backdrop-filter:blur(4px);
          color:#fde68a;
          font-size:10px;
          font-weight:700;
          padding:3px 9px;
          border-radius:var(--radius-full);
          border:1px solid rgba(251,191,36,.35);
        }

        .sp-photos-empty {
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:var(--space-3);
          padding:var(--space-16) var(--space-6);
          color:var(--color-text-faint);
          text-align:center;
          background:var(--color-surface);
          border:1px dashed var(--color-border);
          border-radius:var(--radius-xl);
        }

        .sp-other-grid {
          display:grid;
          grid-template-columns:repeat(
            auto-fill,
            minmax(min(260px,100%),1fr)
          );
          gap:var(--space-5);
        }

        .sp-other-card {
          display:flex;
          flex-direction:column;
          border-radius:var(--radius-xl);
          overflow:hidden;
          border:1px solid var(--color-border);
          background:var(--color-surface);
          text-decoration:none;
          color:inherit;
          transition:
            box-shadow .2s cubic-bezier(.16,1,.3,1),
            transform .2s cubic-bezier(.16,1,.3,1),
            border-color .2s;
        }

        .sp-other-card:hover,
        .sp-other-card:focus-visible {
          box-shadow:var(--shadow-md);
          transform:translateY(-3px);
          border-color:color-mix(
            in srgb,
            var(--color-accent) 30%,
            transparent
          );
        }

        .sp-other-card:focus-visible {
          outline:2px solid var(--color-accent);
          outline-offset:2px;
        }

        .sp-other-card-img {
          position:relative;
          aspect-ratio:16/9;
          background:var(--color-surface-offset);
          overflow:hidden;
        }

        .sp-other-card-img img {
          transition:transform .5s cubic-bezier(.16,1,.3,1);
        }

        .sp-other-card:hover .sp-other-card-img img {
          transform:scale(1.06);
        }

        .sp-other-card-body {
          padding:var(--space-4) var(--space-5);
        }

        .sp-other-card-name {
          font-size:var(--text-sm);
          font-weight:700;
          margin-bottom:var(--space-1);
          line-height:1.3;
        }

        .sp-other-card-meta {
          font-size:var(--text-xs);
          color:var(--color-text-faint);
          display:flex;
          align-items:center;
          gap:var(--space-2);
        }

        .sp-photo-pill {
          position:absolute;
          bottom:var(--space-2);
          right:var(--space-2);
          background:rgba(0,0,0,.65);
          backdrop-filter:blur(4px);
          border:1px solid rgba(255,255,255,.12);
          border-radius:var(--radius-full);
          padding:2px 8px;
          font-size:10px;
          font-weight:700;
          color:rgba(255,255,255,.9);
          display:flex;
          align-items:center;
          gap:4px;
        }
      `}</style>

      <main className="sp-wrap">
        <section className="sp-hero" aria-labelledby="show-title">
          {show.coverImage ? (
            <Image
              src={show.coverImage}
              alt={`${getNameWithYear(show)} — zdjęcie główne z pokazu lotniczego w ${show.location}`}
              fill
              quality={90}
              className="sp-hero-img"
              style={{ objectFit: "cover" }}
              priority
              sizes="100vw"
            />
          ) : (
            <div className="sp-hero-placeholder" aria-hidden="true">
              <Images size={48} style={{ opacity: 0.15 }} />
            </div>
          )}

          <div className="sp-hero-overlay" />

          <div className="sp-hero-content">
            <div className="sp-hero-inner">
              <div className="sp-hero-actions sp-anim-1">
                <Link href="/gallery" className="sp-back-btn">
                  <ChevronLeft size={13} />
                  Galeria
                </Link>

                <ShareButton
                  title={getNameWithYear(show)}
                  url={pageUrl}
                />
              </div>

              <h1 id="show-title" className="sp-title sp-anim-2">
                {getNameWithYear(show)}
              </h1>

              <div className="sp-chips sp-anim-3">
                {show.location && (
                  <span className="sp-chip">
                    <MapPin size={12} />
                    {show.location}
                  </span>
                )}

                <span className="sp-chip">
                  <Calendar size={12} />
                  {formattedDate}
                </span>

                <span className="sp-chip">
                  <Images size={12} />
                  {photoCountLabel(photos.length)}
                </span>

                {show.featured && (
                  <span className="sp-chip sp-chip--featured">
                    <Star size={12} fill="currentColor" />
                    Wyróżniony
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="sp-nav-bar">
          <div className="sp-nav-bar-inner">
            <nav className="sp-breadcrumb" aria-label="Ścieżka nawigacji">
              <Link href="/">
                <Home size={12} />
                Strona główna
              </Link>

              <span className="sp-breadcrumb-sep" aria-hidden="true">
                ›
              </span>

              <Link href="/gallery">Galeria</Link>

              <span className="sp-breadcrumb-sep" aria-hidden="true">
                ›
              </span>

              <span
                className="sp-breadcrumb-current"
                aria-current="page"
                title={getNameWithYear(show)}
              >
                {getNameWithYear(show)}
              </span>
            </nav>
          </div>
        </div>

        <div
          style={{
            maxWidth: "var(--content-wide)",
            margin: "0 auto",
            padding: "0 clamp(var(--space-5),5vw,var(--space-12))",
          }}
        >
          <StoriesBar showId={show.id} showTitle={getNameWithYear(show)} />
        </div>

        <div className="sp-body">
          {show.description ? (
            <p className="sp-desc">{show.description}</p>
          ) : (
            <p
              className="sp-desc"
              style={{ fontStyle: "italic", opacity: 0.6 }}
            >
              Autorska galeria zdjęć z pokazu lotniczego{" "}
              {getNameWithYear(show)}.
            </p>
          )}

          <section aria-label="Informacje o galerii">
            <div className="sp-meta-strip">
              <div className="sp-meta-card">
                <div className="sp-meta-icon">
                  <Images size={15} />
                </div>

                <div className="sp-meta-text">
                  <span className="sp-meta-label">Zdjęcia</span>
                  <span className="sp-meta-value">
                    {photoCountLabel(photos.length)}
                  </span>
                </div>
              </div>

              <div className="sp-meta-card">
                <div className="sp-meta-icon">
                  <Calendar size={15} />
                </div>

                <div className="sp-meta-text">
                  <span className="sp-meta-label">Data</span>
                  <span className="sp-meta-value" title={formattedDate}>
                    {formattedDate}
                  </span>
                </div>
              </div>

              {show.location && (
                <div className="sp-meta-card">
                  <div className="sp-meta-icon">
                    <MapPin size={15} />
                  </div>

                  <div className="sp-meta-text">
                    <span className="sp-meta-label">Lokalizacja</span>
                    <span className="sp-meta-value" title={show.location}>
                      {show.location}
                    </span>
                  </div>
                </div>
              )}

              {aircraft.length > 0 && (
                <div className="sp-meta-card">
                  <div className="sp-meta-icon">
                    <Plane size={15} />
                  </div>

                  <div className="sp-meta-text">
                    <span className="sp-meta-label">Samoloty</span>
                    <span className="sp-meta-value">
                      {aircraft.length}
                    </span>
                  </div>
                </div>
              )}

              {show.tags.length > 0 && (
                <div className="sp-meta-card">
                  <div className="sp-meta-icon">
                    <Hash size={15} />
                  </div>

                  <div className="sp-meta-text">
                    <span className="sp-meta-label">Tagi</span>
                    <span className="sp-meta-value">
                      {show.tags.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {show.tags.length > 0 && (
            <nav className="sp-tags" aria-label="Tagi galerii">
              <Tag
                size={13}
                style={{
                  color: "var(--color-text-faint)",
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />

              {show.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/gallery?tag=${encodeURIComponent(tag)}`}
                  className="sp-tag"
                >
                  {tag}
                </Link>
              ))}
            </nav>
          )}

          {featuredPhotos.length > 0 && (
            <section aria-labelledby="featured-photos-heading">
              <div className="sp-section-head">
                <h2 id="featured-photos-heading" className="sp-section-title">
                  <Star
                    size={18}
                    fill="currentColor"
                    style={{ marginRight: 8, color: "#eab308" }}
                  />
                  Wyróżnione zdjęcia
                  <span className="sp-section-count">
                    ({featuredPhotos.length})
                  </span>
                </h2>
              </div>

              <div className="sp-featured-strip">
                {featuredPhotos.map((photo) => (
                  <div key={photo.id} className="sp-featured-item">
                    <Image
                      src={photo.src}
                      alt={
                        photo.alt ||
                        photo.aircraft ||
                        `${getNameWithYear(show)} — zdjęcie z pokazu`
                      }
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width:768px) 60vw, 300px"
                      loading="lazy"
                    />

                    <span className="sp-featured-badge">
                      <Star size={10} fill="currentColor" />
                      Wyróżnione
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="all-photos-heading">
            <div className="sp-section-head">
              <h2 id="all-photos-heading" className="sp-section-title">
                Wszystkie zdjęcia
                <span className="sp-section-count">
                  ({photos.length})
                </span>
              </h2>
            </div>

            {photos.length > 0 ? (
              <PhotoGrid photos={photos} />
            ) : (
              <div className="sp-photos-empty">
                <Images size={36} style={{ opacity: 0.3 }} aria-hidden="true" />
                <p style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>
                  Zdjęcia z tego pokazu jeszcze się pojawią.
                </p>
              </div>
            )}
          </section>

          {otherShows.length > 0 && (
            <section aria-labelledby="other-shows-heading">
              <div className="sp-section-head">
                <h2 id="other-shows-heading" className="sp-section-title">
                  Inne pokazy lotnicze
                </h2>

                <Link href="/gallery" className="sp-section-link">
                  Wszystkie galerie
                  <ArrowRight size={13} />
                </Link>
              </div>

              <div className="sp-other-grid">
                {otherShows.map((other) => (
                  <Link
                    key={other.id}
                    href={`/pokaz/${encodeURIComponent(other.id)}`}
                    className="sp-other-card"
                  >
                    <div className="sp-other-card-img">
                      {other.coverImage ? (
                        <Image
                          src={other.coverImage}
                          alt={`${getNameWithYear(other)} — pokaz lotniczy w ${other.location}`}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="(max-width:768px) 100vw, 33vw"
                        />
                      ) : (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          aria-hidden="true"
                        >
                          <Images size={28} style={{ opacity: 0.15 }} />
                        </div>
                      )}

                      <div className="sp-photo-pill">
                        <Images size={10} />
                        {photoCountLabel(other.photoCount)}
                      </div>
                    </div>

                    <div className="sp-other-card-body">
                      <p className="sp-other-card-name">
                        {getNameWithYear(other)}
                      </p>

                      <p className="sp-other-card-meta">
                        <MapPin size={10} />
                        {other.location}
                        {other.year ? ` · ${other.year}` : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}