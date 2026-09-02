import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Camera,
  Clock3,
  Compass,
  Tag,
} from "lucide-react";
import {
  BLOG_CATEGORY_LABELS,
  type BlogCategory,
} from "@/lib/blog/types";
import { getPublishedBlogPosts } from "@/lib/blog/data";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airshow-gallery.vercel.app"
).replace(/\/$/, "");

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog – relacje i poradniki o pokazach lotniczych",
  description:
    "Relacje z pokazów lotniczych, poradniki fotografii lotniczej, praktyczne przewodniki i aktualności z AirShow Gallery.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    siteName: "MGYT AirShow Gallery",
    locale: "pl_PL",
    title: "Blog – relacje i poradniki o pokazach lotniczych",
    description:
      "Relacje fotograficzne, poradniki i praktyczne przewodniki dla miłośników lotnictwa.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "MGYT AirShow Gallery – blog o pokazach lotniczych",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog – relacje i poradniki o pokazach lotniczych",
    description:
      "Relacje fotograficzne, poradniki i praktyczne przewodniki dla miłośników lotnictwa.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function escapeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function BlogIndexPage() {
  const posts = await getPublishedBlogPosts();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog MGYT AirShow Gallery",
    url: `${SITE_URL}/blog`,
    inLanguage: "pl-PL",
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      description: post.excerpt,
      datePublished: post.publishedAt || undefined,
      dateModified: post.updatedAt,
      image: post.coverImage || undefined,
      author: {
        "@type": "Person",
        name: post.authorName,
      },
    })),
  };

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
        name: "Blog",
        item: `${SITE_URL}/blog`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: escapeJsonLd(itemListJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: escapeJsonLd(breadcrumbJsonLd),
        }}
      />

      <style>{`
        .blog-page {
          min-height: 100dvh;
          padding: 64px 0 clamp(72px, 10vw, 130px);
        }

        .blog-hero {
          position: relative;
          overflow: hidden;
          padding: clamp(58px, 8vw, 108px) 0 clamp(42px, 6vw, 74px);
          border-bottom: 1px solid var(--color-divider);
          background:
            radial-gradient(
              circle at 82% 15%,
              color-mix(in srgb, var(--color-accent) 18%, transparent),
              transparent 28%
            ),
            var(--color-surface);
        }

        .blog-hero::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.35;
          background-image:
            linear-gradient(
              color-mix(in srgb, var(--color-border) 45%, transparent) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              color-mix(in srgb, var(--color-border) 45%, transparent) 1px,
              transparent 1px
            );
          background-size: 42px 42px;
          mask-image: linear-gradient(
            to bottom,
            rgba(0,0,0,.72),
            transparent 92%
          );
        }

        .blog-hero-content,
        .blog-content {
          position: relative;
          z-index: 1;
          width: min(100% - 40px, var(--content-wide));
          margin: 0 auto;
        }

        .blog-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 11px;
          border: 1px solid color-mix(
            in srgb,
            var(--color-accent) 35%,
            transparent
          );
          border-radius: var(--radius-full);
          background: var(--color-accent-subtle);
          color: var(--color-accent);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .blog-title {
          max-width: 790px;
          margin: 20px 0 0;
          font-family: var(--font-display);
          font-size: clamp(2.3rem, 6vw, 5rem);
          font-weight: 900;
          letter-spacing: -.06em;
          line-height: .96;
          color: var(--color-text);
        }

        .blog-title span {
          color: var(--color-accent);
        }

        .blog-lead {
          max-width: 700px;
          margin: 22px 0 0;
          color: var(--color-text-muted);
          font-size: clamp(1rem, 2vw, 1.12rem);
          line-height: 1.75;
        }

        .blog-content {
          padding-top: clamp(34px, 6vw, 64px);
        }

        .blog-summary {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 26px;
          color: var(--color-text-faint);
          font-size: var(--text-sm);
        }

        .blog-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(16px, 2.5vw, 26px);
        }

        .blog-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          color: inherit;
          text-decoration: none;
          transition:
            transform .2s ease,
            box-shadow .2s ease,
            border-color .2s ease;
        }

        .blog-card:hover {
          transform: translateY(-4px);
          border-color: color-mix(
            in srgb,
            var(--color-accent) 42%,
            transparent
          );
          box-shadow: var(--shadow-md);
        }

        .blog-card:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 3px;
        }

        .blog-card-image {
          position: relative;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background:
            linear-gradient(
              135deg,
              var(--color-surface-offset),
              var(--color-surface-dynamic)
            );
        }

        .blog-card-image img {
          object-fit: cover;
          transition: transform .45s cubic-bezier(.16,1,.3,1);
        }

        .blog-card:hover .blog-card-image img {
          transform: scale(1.05);
        }

        .blog-card-image-placeholder {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: var(--color-text-faint);
        }

        .blog-card-body {
          display: flex;
          flex: 1;
          flex-direction: column;
          padding: 20px;
        }

        .blog-card-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: var(--color-text-faint);
          font-size: 11px;
          font-weight: 700;
        }

        .blog-category {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--color-accent);
        }

        .blog-card-title {
          margin: 15px 0 0;
          font-family: var(--font-display);
          font-size: clamp(1.1rem, 2vw, 1.35rem);
          font-weight: 900;
          letter-spacing: -.028em;
          line-height: 1.15;
          color: var(--color-text);
        }

        .blog-card-excerpt {
          display: -webkit-box;
          overflow: hidden;
          margin: 11px 0 0;
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          line-height: 1.65;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        .blog-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: auto;
          padding-top: 20px;
          color: var(--color-text-faint);
          font-size: 11px;
          font-weight: 700;
        }

        .blog-read-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: var(--color-accent);
        }

        .blog-empty {
          display: grid;
          min-height: 310px;
          place-items: center;
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          color: var(--color-text-muted);
          text-align: center;
        }

        .blog-empty-inner {
          max-width: 420px;
          padding: 34px;
        }

        .blog-empty-icon {
          display: grid;
          width: 52px;
          height: 52px;
          margin: 0 auto 16px;
          place-items: center;
          border-radius: var(--radius-lg);
          background: var(--color-accent-subtle);
          color: var(--color-accent);
        }

        .blog-empty h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-weight: 900;
          letter-spacing: -.03em;
          color: var(--color-text);
        }

        .blog-empty p {
          margin: 10px 0 0;
          font-size: var(--text-sm);
          line-height: 1.65;
        }

        @media (max-width: 960px) {
          .blog-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .blog-page {
            padding-top: 64px;
          }

          .blog-hero-content,
          .blog-content {
            width: min(100% - 32px, var(--content-wide));
          }

          .blog-grid {
            grid-template-columns: 1fr;
          }

          .blog-card-body {
            padding: 18px;
          }
        }
      `}</style>

      <main className="blog-page">
        <section className="blog-hero">
          <div className="blog-hero-content">
            <span className="blog-kicker">
              <BookOpen size={14} />
              AirShow Journal
            </span>

            <h1 className="blog-title">
              Relacje, poradniki i <span>lotnicze historie.</span>
            </h1>

            <p className="blog-lead">
              Autorskie relacje z pokazów lotniczych, praktyczne wskazówki dla
              fotografów oraz informacje, które pomagają lepiej przygotować się
              do kolejnego wyjazdu.
            </p>
          </div>
        </section>

        <section className="blog-content" aria-labelledby="posts-heading">
          <div className="blog-summary">
            <Compass size={16} />
            <span>
              {posts.length === 0
                ? "Pierwsze materiały są w przygotowaniu."
                : `Opublikowane materiały: ${posts.length}.`}
            </span>
          </div>

          {posts.length > 0 ? (
            <div id="posts-heading" className="blog-grid">
              {posts.map((post) => {
                const publishedDate = formatDate(
                  post.publishedAt ?? post.createdAt
                );

                const readTime = estimateReadTime(post.content);

                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="blog-card"
                  >
                    <div className="blog-card-image">
                      {post.coverImage ? (
                        <Image
                          src={post.coverImage}
                          alt={
                            post.coverImageAlt ||
                            `${post.title} — obraz wyróżniający artykułu`
                          }
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
                        />
                      ) : (
                        <div
                          className="blog-card-image-placeholder"
                          aria-hidden="true"
                        >
                          <Camera size={38} />
                        </div>
                      )}
                    </div>

                    <div className="blog-card-body">
                      <div className="blog-card-topline">
                        <span className="blog-category">
                          <Tag size={12} />
                          {
                            BLOG_CATEGORY_LABELS[
                              post.category as BlogCategory
                            ] ?? "Artykuł"
                          }
                        </span>

                        <span>{readTime} min czytania</span>
                      </div>

                      <h2 className="blog-card-title">{post.title}</h2>

                      <p className="blog-card-excerpt">
                        {post.excerpt ||
                          "Autorski materiał z MGYT AirShow Gallery."}
                      </p>

                      <div className="blog-card-footer">
                        <span>
                          <CalendarDays size={12} style={{ marginRight: 5 }} />
                          {publishedDate || "Wkrótce"}
                        </span>

                        <span className="blog-read-link">
                          Czytaj
                          <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="blog-empty">
              <div className="blog-empty-inner">
                <span className="blog-empty-icon">
                  <BookOpen size={25} />
                </span>

                <h2>Blog startuje wkrótce</h2>

                <p>
                  Przygotowuję relacje z pokazów lotniczych, poradniki
                  fotograficzne oraz praktyczne przewodniki przed wyjazdem.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}