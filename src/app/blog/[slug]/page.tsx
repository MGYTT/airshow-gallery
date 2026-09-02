import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Home,
  Tag,
  UserRound,
} from "lucide-react";
import {
  BLOG_CATEGORY_LABELS,
  type BlogCategory,
} from "@/lib/blog/types";
import {
  getPublishedBlogPostBySlug,
  getPublishedBlogSlugs,
} from "@/lib/blog/data";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airshow-gallery.vercel.app"
).replace(/\/$/, "");

const SITE_NAME = "MGYT AirShow Gallery";
const FALLBACK_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

function escapeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function formatDate(value: string | null | undefined) {
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

function formatIsoDate(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 200));
}

function truncateDescription(value: string, maxLength = 158) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const shortened = normalized.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(" ");

  return `${(
    lastSpace > 90 ? shortened.slice(0, lastSpace) : shortened
  ).trimEnd()}…`;
}

function renderContent(content: string) {
  /*
   * Pierwsza wersja bloga używa zwykłego tekstu:
   * - pusta linia = nowy akapit;
   * - linia zaczynająca się od ## = H2;
   * - linia zaczynająca się od ### = H3.
   *
   * Dzięki temu wpis jest czytelny w HTML bez instalowania parsera Markdown.
   */
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      if (block.startsWith("### ")) {
        return (
          <h3 key={`${block}-${index}`}>
            {block.replace(/^###\s+/, "")}
          </h3>
        );
      }

      if (block.startsWith("## ")) {
        return (
          <h2 key={`${block}-${index}`}>
            {block.replace(/^##\s+/, "")}
          </h2>
        );
      }

      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const isUnorderedList = lines.every((line) => line.startsWith("- "));

      if (isUnorderedList) {
        return (
          <ul key={`${block}-${index}`}>
            {lines.map((line) => (
              <li key={line}>{line.replace(/^- /, "")}</li>
            ))}
          </ul>
        );
      }

      const isOrderedList = lines.every((line) => /^\d+\.\s/.test(line));

      if (isOrderedList) {
        return (
          <ol key={`${block}-${index}`}>
            {lines.map((line) => (
              <li key={line}>{line.replace(/^\d+\.\s/, "")}</li>
            ))}
          </ol>
        );
      }

      return (
        <p key={`${block}-${index}`}>
          {lines.join(" ")}
        </p>
      );
    });
}

export async function generateStaticParams() {
  const slugs = await getPublishedBlogSlugs();

  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Artykuł nie został znaleziony",
      description:
        "Ten artykuł nie istnieje lub nie jest jeszcze opublikowany.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const pageUrl = `${SITE_URL}/blog/${post.slug}`;
  const description = truncateDescription(
    post.excerpt ||
      post.content ||
      `${post.title} – artykuł na blogu MGYT AirShow Gallery.`
  );
  const image = post.coverImage || FALLBACK_OG_IMAGE;

  return {
    title: post.title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "article",
      locale: "pl_PL",
      url: pageUrl,
      siteName: SITE_NAME,
      title: post.title,
      description,
      publishedTime: formatIsoDate(post.publishedAt ?? post.createdAt),
      modifiedTime: formatIsoDate(post.updatedAt),
      authors: [post.authorName],
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: post.coverImageAlt || post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
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

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const pageUrl = `${SITE_URL}/blog/${post.slug}`;
  const publishedDate = post.publishedAt ?? post.createdAt;
  const readTime = estimateReadTime(post.content);
  const categoryLabel =
    BLOG_CATEGORY_LABELS[post.category as BlogCategory] ?? "Artykuł";

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
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: pageUrl,
      },
    ],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || truncateDescription(post.content),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: formatIsoDate(publishedDate),
    dateModified: formatIsoDate(post.updatedAt),
    author: {
      "@type": "Person",
      name: post.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/apple-touch-icon.png`,
      },
    },
    articleSection: categoryLabel,
    keywords: post.tags.join(", "),
    inLanguage: "pl-PL",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: escapeJsonLd(breadcrumbJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: escapeJsonLd(articleJsonLd),
        }}
      />

      <style>{`
        .post-page {
          min-height: 100dvh;
          padding: 64px 0 clamp(72px, 10vw, 132px);
        }

        .post-hero {
          position: relative;
          min-height: min(65vw, 620px);
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          background: #0a0a0a;
        }

        .post-hero-image {
          position: absolute;
          inset: 0;
        }

        .post-hero-image img {
          object-fit: cover;
        }

        .post-hero-placeholder {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background:
            radial-gradient(
              circle at 72% 18%,
              color-mix(in srgb, var(--color-accent) 26%, transparent),
              transparent 28%
            ),
            linear-gradient(135deg, #121212, #050505);
          color: rgba(255,255,255,.35);
        }

        .post-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(0,0,0,.12) 0%,
            rgba(0,0,0,.48) 50%,
            rgba(0,0,0,.91) 100%
          );
        }

        .post-hero-content {
          position: relative;
          z-index: 1;
          width: min(100% - 40px, 940px);
          margin: 0 auto;
          padding: clamp(44px, 7vw, 82px) 0;
          color: #ffffff;
        }

        .post-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 24px;
          padding: 8px 12px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: var(--radius-full);
          background: rgba(0,0,0,.2);
          color: rgba(255,255,255,.84);
          font-size: var(--text-xs);
          font-weight: 750;
          text-decoration: none;
          backdrop-filter: blur(8px);
          transition: background .18s ease, color .18s ease;
        }

        .post-back:hover {
          background: rgba(255,255,255,.16);
          color: #fff;
        }

        .post-back:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 3px;
        }

        .post-category {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 11px;
          border-radius: var(--radius-full);
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.2);
          color: rgba(255,255,255,.92);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .post-title {
          max-width: 850px;
          margin: 18px 0 0;
          font-family: var(--font-display);
          font-size: clamp(2rem, 5.8vw, 4.7rem);
          font-weight: 900;
          letter-spacing: -.06em;
          line-height: .98;
          text-shadow: 0 3px 28px rgba(0,0,0,.35);
        }

        .post-excerpt {
          max-width: 720px;
          margin: 20px 0 0;
          color: rgba(255,255,255,.78);
          font-size: clamp(1rem, 2vw, 1.15rem);
          line-height: 1.72;
        }

        .post-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px 18px;
          margin-top: 26px;
          color: rgba(255,255,255,.76);
          font-size: var(--text-xs);
          font-weight: 650;
        }

        .post-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .post-breadcrumb-wrap {
          border-bottom: 1px solid var(--color-divider);
          background: var(--color-surface);
        }

        .post-breadcrumb {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          width: min(100% - 40px, 940px);
          margin: 0 auto;
          padding: 13px 0;
          color: var(--color-text-faint);
          font-size: var(--text-xs);
        }

        .post-breadcrumb a {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: var(--color-text-faint);
          text-decoration: none;
        }

        .post-breadcrumb a:hover {
          color: var(--color-text);
        }

        .post-breadcrumb-current {
          overflow: hidden;
          max-width: 420px;
          color: var(--color-text-muted);
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .post-divider {
          opacity: .45;
        }

        .post-content {
          width: min(100% - 40px, 760px);
          margin: 0 auto;
          padding-top: clamp(38px, 7vw, 72px);
        }

        .post-article {
          color: var(--color-text-muted);
          font-size: clamp(1rem, 1.8vw, 1.1rem);
          line-height: 1.85;
        }

        .post-article > :first-child {
          margin-top: 0;
        }

        .post-article p {
          margin: 0 0 1.45em;
        }

        .post-article h2,
        .post-article h3 {
          color: var(--color-text);
          font-family: var(--font-display);
          font-weight: 900;
          letter-spacing: -.035em;
          line-height: 1.12;
        }

        .post-article h2 {
          margin: 2.4em 0 .7em;
          font-size: clamp(1.55rem, 4vw, 2.2rem);
        }

        .post-article h3 {
          margin: 2em 0 .65em;
          font-size: clamp(1.22rem, 3vw, 1.55rem);
        }

        .post-article ul,
        .post-article ol {
          margin: 0 0 1.55em;
          padding-left: 1.3em;
        }

        .post-article li + li {
          margin-top: .42em;
        }

        .post-tags {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 9px;
          margin-top: clamp(34px, 5vw, 52px);
          padding-top: 26px;
          border-top: 1px solid var(--color-divider);
        }

        .post-tag {
          display: inline-flex;
          align-items: center;
          padding: 5px 11px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          background: var(--color-surface-offset);
          color: var(--color-text-muted);
          font-size: 11px;
          font-weight: 700;
        }

        .post-author {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: clamp(36px, 6vw, 64px);
          padding: 20px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface);
        }

        .post-author-icon {
          display: grid;
          width: 42px;
          height: 42px;
          flex: 0 0 auto;
          place-items: center;
          border-radius: var(--radius-md);
          background: var(--color-accent-subtle);
          color: var(--color-accent);
        }

        .post-author-label {
          color: var(--color-text-faint);
          font-size: 11px;
          font-weight: 750;
          letter-spacing: .07em;
          text-transform: uppercase;
        }

        .post-author-name {
          display: block;
          margin-top: 2px;
          color: var(--color-text);
          font-size: var(--text-sm);
          font-weight: 850;
        }

        @media (max-width: 640px) {
          .post-hero {
            min-height: 520px;
          }

          .post-hero-content,
          .post-breadcrumb,
          .post-content {
            width: min(100% - 32px, 940px);
          }

          .post-breadcrumb-current {
            max-width: 180px;
          }
        }
      `}</style>

      <main className="post-page">
        <section className="post-hero" aria-labelledby="post-title">
          {post.coverImage ? (
            <div className="post-hero-image">
              <Image
                src={post.coverImage}
                alt={post.coverImageAlt || post.title}
                fill
                priority
                quality={90}
                sizes="100vw"
              />
            </div>
          ) : (
            <div className="post-hero-placeholder" aria-hidden="true">
              <Tag size={68} />
            </div>
          )}

          <div className="post-hero-overlay" />

          <div className="post-hero-content">
            <Link href="/blog" className="post-back">
              <ArrowLeft size={14} />
              Wszystkie artykuły
            </Link>

            <span className="post-category">
              <Tag size={13} />
              {categoryLabel}
            </span>

            <h1 id="post-title" className="post-title">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="post-excerpt">{post.excerpt}</p>
            )}

            <div className="post-meta">
              <span className="post-meta-item">
                <CalendarDays size={14} />
                {formatDate(publishedDate) || "Data publikacji wkrótce"}
              </span>

              <span className="post-meta-item">
                <Clock3 size={14} />
                {readTime} min czytania
              </span>

              <span className="post-meta-item">
                <UserRound size={14} />
                {post.authorName}
              </span>
            </div>
          </div>
        </section>

        <div className="post-breadcrumb-wrap">
          <nav className="post-breadcrumb" aria-label="Ścieżka nawigacji">
            <Link href="/">
              <Home size={12} />
              Strona główna
            </Link>

            <span className="post-divider" aria-hidden="true">
              ›
            </span>

            <Link href="/blog">Blog</Link>

            <span className="post-divider" aria-hidden="true">
              ›
            </span>

            <span className="post-breadcrumb-current" aria-current="page">
              {post.title}
            </span>
          </nav>
        </div>

        <article className="post-content">
          <div className="post-article">
            {post.content ? (
              renderContent(post.content)
            ) : (
              <p>Treść tego artykułu jest w przygotowaniu.</p>
            )}
          </div>

          {post.tags.length > 0 && (
            <div className="post-tags" aria-label="Tagi artykułu">
              <Tag size={15} style={{ color: "var(--color-text-faint)" }} />

              {post.tags.map((tag) => (
                <span key={tag} className="post-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <aside className="post-author" aria-label="Autor artykułu">
            <span className="post-author-icon">
              <UserRound size={20} />
            </span>

            <span>
              <span className="post-author-label">Autor</span>
              <span className="post-author-name">{post.authorName}</span>
            </span>
          </aside>
        </article>
      </main>
    </>
  );
}