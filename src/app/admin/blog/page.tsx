"use client";

import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  ImageIcon,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type BlogCategory =
  | "aktualnosci"
  | "relacje"
  | "poradniki-fotograficzne"
  | "przewodniki"
  | "sprzet";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverImageAlt: string;
  category: BlogCategory;
  tags: string[];
  authorName: string;
  relatedShowId: string | null;
  relatedEventId: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SelectShow {
  id: string;
  name: string;
  year: number;
  location: string;
}

interface SelectEvent {
  id: string;
  slug: string;
  name: string;
  startDate: string;
  city: string;
  country: string;
}

type PostDraft = Omit<
  BlogPost,
  "id" | "publishedAt" | "createdAt" | "updatedAt"
>;

const CATEGORIES: Array<{
  value: BlogCategory;
  label: string;
}> = [
  { value: "aktualnosci", label: "Aktualności" },
  { value: "relacje", label: "Relacje" },
  {
    value: "poradniki-fotograficzne",
    label: "Poradniki fotograficzne",
  },
  { value: "przewodniki", label: "Przewodniki" },
  { value: "sprzet", label: "Sprzęt" },
];

const EMPTY_DRAFT: PostDraft = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  coverImageAlt: "",
  category: "aktualnosci",
  tags: [],
  authorName: "MGYT",
  relatedShowId: null,
  relatedEventId: null,
  published: false,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź|ż/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function categoryLabel(category: BlogCategory) {
  return CATEGORIES.find((item) => item.value === category)?.label ??
    "Artykuł";
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getExcerptCounter(value: string) {
  return `${value.length}/350`;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [shows, setShows] = useState<SelectShow[]>([]);
  const [events, setEvents] = useState<SelectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<
    "all" | "published" | "draft"
  >("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PostDraft>(EMPTY_DRAFT);
  const [tagInput, setTagInput] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  const coverUrlInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [postsResponse, showsResponse, eventsResponse] =
        await Promise.all([
          fetch("/api/blog?all=true"),
          fetch("/api/shows?all=true"),
          fetch("/api/airshow-events?all=true"),
        ]);

      if (postsResponse.status === 401) {
        window.location.href = "/admin/login?redirect=/admin/blog";
        return;
      }

      if (!postsResponse.ok) {
        throw new Error(`Nie udało się pobrać wpisów. HTTP ${postsResponse.status}.`);
      }

      const postsData = (await postsResponse.json()) as BlogPost[];
      setPosts(postsData);

      if (showsResponse.ok) {
        const showsData = (await showsResponse.json()) as Array<{
          id: string;
          name: string;
          year: number;
          location: string;
        }>;

        setShows(
          showsData.map((show) => ({
            id: show.id,
            name: show.name,
            year: show.year,
            location: show.location,
          }))
        );
      }

      /*
       * Endpoint wydarzeń może nie istnieć jeszcze w Twoim projekcie.
       * Panel nadal będzie działał — po prostu lista wydarzeń będzie pusta.
       */
      if (eventsResponse.ok) {
        const eventsData = (await eventsResponse.json()) as Array<{
          id: string;
          slug: string;
          name: string;
          startDate?: string;
          start_date?: string;
          city: string;
          country: string;
        }>;

        setEvents(
          eventsData.map((event) => ({
            id: event.id,
            slug: event.slug,
            name: event.name,
            startDate: event.startDate ?? event.start_date ?? "",
            city: event.city,
            country: event.country,
          }))
        );
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nie udało się załadować panelu bloga."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.slug.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query));

      const matchesVisibility =
        visibility === "all" ||
        (visibility === "published" && post.published) ||
        (visibility === "draft" && !post.published);

      return matchesSearch && matchesVisibility;
    });
  }, [posts, search, visibility]);

  const isEditing = editingId !== null;

  function openNewPost() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setTagInput("");
    setSlugTouched(false);
    setError(null);
  }

  function openEditPost(post: BlogPost) {
    setEditingId(post.id);
    setDraft({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      coverImageAlt: post.coverImageAlt,
      category: post.category,
      tags: post.tags,
      authorName: post.authorName,
      relatedShowId: post.relatedShowId,
      relatedEventId: post.relatedEventId,
      published: post.published,
    });
    setTagInput("");
    setSlugTouched(true);
    setError(null);
  }

  function closeEditor() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setTagInput("");
    setSlugTouched(false);
  }

  function updateDraft<K extends keyof PostDraft>(
    key: K,
    value: PostDraft[K]
  ) {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function handleTitleChange(title: string) {
    setDraft((previous) => ({
      ...previous,
      title,
      slug: slugTouched ? previous.slug : slugify(title),
    }));
  }

  function addTag() {
    const tag = tagInput.trim().replace(/\s+/g, " ");

    if (!tag || draft.tags.includes(tag) || draft.tags.length >= 12) {
      return;
    }

    updateDraft("tags", [...draft.tags, tag]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    updateDraft(
      "tags",
      draft.tags.filter((item) => item !== tag)
    );
  }

  async function savePost() {
    if (!draft.title.trim()) {
      setError("Uzupełnij tytuł wpisu.");
      return;
    }

    if (!draft.excerpt.trim()) {
      setError("Uzupełnij zajawkę artykułu (excerpt).");
      return;
    }

    if (!draft.content.trim()) {
      setError("Uzupełnij treść artykułu.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      ...draft,
      slug: slugify(draft.slug || draft.title),
    };

    try {
      const response = await fetch(
        isEditing ? `/api/blog/${editingId}` : "/api/blog",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }

      const savedPost = data as BlogPost;

      setPosts((previous) => {
        if (isEditing) {
          return previous.map((post) =>
            post.id === savedPost.id ? savedPost : post
          );
        }

        return [savedPost, ...previous];
      });

      closeEditor();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Nie udało się zapisać wpisu."
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(post: BlogPost) {
    setError(null);

    try {
      const response = await fetch(`/api/blog/${post.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          published: !post.published,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }

      const updatedPost = data as BlogPost;

      setPosts((previous) =>
        previous.map((item) =>
          item.id === updatedPost.id ? updatedPost : item
        )
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Nie udało się zmienić publikacji wpisu."
      );
    }
  }

  async function deletePost() {
    if (!deleteTarget) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/blog/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }

      setPosts((previous) =>
        previous.filter((post) => post.id !== deleteTarget.id)
      );

      if (editingId === deleteTarget.id) {
        closeEditor();
      }

      setDeleteTarget(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Nie udało się usunąć wpisu."
      );
    }
  }

  const publicUrl = draft.slug
    ? `/blog/${slugify(draft.slug)}`
    : "";

  const canSave =
    draft.title.trim().length > 0 &&
    draft.excerpt.trim().length > 0 &&
    draft.content.trim().length > 0;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "50dvh",
          display: "grid",
          placeItems: "center",
          color: "var(--color-text-muted)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            fontSize: "var(--text-sm)",
          }}
        >
          <Loader2
            size={18}
            style={{ animation: "admin-blog-spin 1s linear infinite" }}
          />
          Ładowanie panelu bloga…
        </div>

        <style>{`
          @keyframes admin-blog-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes admin-blog-spin {
          to { transform: rotate(360deg); }
        }

        .admin-blog-page {
          padding: 8px 0 40px;
        }

        .admin-blog-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .admin-blog-title {
          margin: 0;
          font-family: var(--font-display);
          font-size: var(--text-xl);
          font-weight: 900;
          letter-spacing: -.03em;
          color: var(--color-text);
        }

        .admin-blog-subtitle {
          margin: 7px 0 0;
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }

        .admin-blog-new {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 14px;
          border: 0;
          border-radius: var(--radius-md);
          background: var(--color-accent);
          color: #fff;
          font-size: var(--text-sm);
          font-weight: 800;
          cursor: pointer;
        }

        .admin-blog-new:hover {
          background: var(--color-accent-hover);
        }

        .admin-blog-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .admin-blog-search {
          position: relative;
          flex: 1 1 240px;
        }

        .admin-blog-search svg {
          position: absolute;
          left: 12px;
          top: 50%;
          color: var(--color-text-faint);
          pointer-events: none;
          transform: translateY(-50%);
        }

        .admin-blog-search input {
          width: 100%;
          min-height: 40px;
          padding: 0 12px 0 36px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text);
          font: inherit;
          font-size: var(--text-sm);
        }

        .admin-blog-filter {
          min-height: 40px;
          padding: 0 34px 0 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text);
          font: inherit;
          font-size: var(--text-sm);
        }

        .admin-blog-alert {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 18px;
          padding: 12px 14px;
          border: 1px solid rgba(239, 68, 68, .28);
          border-radius: var(--radius-lg);
          background: rgba(239, 68, 68, .08);
          color: #ef4444;
          font-size: var(--text-sm);
          line-height: 1.45;
        }

        .admin-blog-alert button {
          display: grid;
          margin-left: auto;
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .admin-blog-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 20px;
        }

        .admin-blog-list {
          display: grid;
          gap: 10px;
        }

        .admin-blog-post {
          display: grid;
          grid-template-columns: 82px minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          padding: 10px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface);
        }

        .admin-blog-post--draft {
          opacity: .72;
        }

        .admin-blog-thumb {
          position: relative;
          width: 82px;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          display: grid;
          place-items: center;
          border-radius: var(--radius-lg);
          background: var(--color-surface-offset);
          color: var(--color-text-faint);
        }

        .admin-blog-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .admin-blog-post-main {
          min-width: 0;
        }

        .admin-blog-post-title {
          overflow: hidden;
          margin: 0;
          color: var(--color-text);
          font-size: var(--text-sm);
          font-weight: 850;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-blog-post-meta {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 6px;
          color: var(--color-text-faint);
          font-size: 11px;
          flex-wrap: wrap;
        }

        .admin-blog-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 7px;
          border-radius: var(--radius-full);
          background: var(--color-surface-offset);
          color: var(--color-text-muted);
          font-size: 10px;
          font-weight: 800;
        }

        .admin-blog-pill--published {
          background: rgba(34, 197, 94, .12);
          color: #16a34a;
        }

        .admin-blog-pill--draft {
          background: rgba(234, 179, 8, .12);
          color: #a16207;
        }

        .admin-blog-post-actions {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .admin-blog-icon-btn {
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          padding: 0;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface-offset);
          color: var(--color-text-muted);
          cursor: pointer;
        }

        .admin-blog-icon-btn:hover {
          border-color: var(--color-accent);
          color: var(--color-accent);
        }

        .admin-blog-icon-btn--danger:hover {
          border-color: #ef4444;
          color: #ef4444;
        }

        .admin-blog-empty {
          display: grid;
          min-height: 240px;
          place-items: center;
          padding: 28px;
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-xl);
          color: var(--color-text-muted);
          text-align: center;
        }

        .admin-blog-empty h2 {
          margin: 12px 0 0;
          color: var(--color-text);
          font-size: var(--text-base);
        }

        .admin-blog-empty p {
          margin: 6px 0 0;
          font-size: var(--text-sm);
        }

        .admin-blog-modal-backdrop {
          position: fixed;
          z-index: 1000;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          overflow-y: auto;
          background: rgba(0, 0, 0, .62);
          backdrop-filter: blur(4px);
        }

        .admin-blog-modal {
          width: min(100%, 920px);
          max-height: min(900px, calc(100dvh - 36px));
          overflow: auto;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          box-shadow: var(--shadow-xl);
        }

        .admin-blog-modal-head {
          position: sticky;
          z-index: 2;
          top: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 18px 20px;
          border-bottom: 1px solid var(--color-divider);
          background: var(--color-surface);
        }

        .admin-blog-modal-title {
          margin: 0;
          font-family: var(--font-display);
          font-size: var(--text-lg);
          font-weight: 900;
          letter-spacing: -.03em;
        }

        .admin-blog-close {
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--color-text-muted);
          cursor: pointer;
        }

        .admin-blog-close:hover {
          background: var(--color-surface-offset);
          color: var(--color-text);
        }

        .admin-blog-form {
          display: grid;
          gap: 20px;
          padding: 20px;
        }

        .admin-blog-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .admin-blog-field {
          min-width: 0;
        }

        .admin-blog-field--full {
          grid-column: 1 / -1;
        }

        .admin-blog-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 7px;
          color: var(--color-text-faint);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .admin-blog-input,
        .admin-blog-textarea,
        .admin-blog-select {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface-offset);
          color: var(--color-text);
          font: inherit;
          font-size: var(--text-sm);
        }

        .admin-blog-input,
        .admin-blog-select {
          min-height: 42px;
          padding: 0 12px;
        }

        .admin-blog-textarea {
          display: block;
          min-height: 106px;
          padding: 11px 12px;
          line-height: 1.65;
          resize: vertical;
        }

        .admin-blog-content {
          min-height: 360px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
        }

        .admin-blog-help {
          margin: 7px 0 0;
          color: var(--color-text-faint);
          font-size: 11px;
          line-height: 1.5;
        }

        .admin-blog-slug-row,
        .admin-blog-tag-row {
          display: flex;
          gap: 8px;
        }

        .admin-blog-slug-prefix {
          display: inline-flex;
          align-items: center;
          flex: 0 0 auto;
          min-height: 42px;
          padding: 0 10px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text-faint);
          font-size: 11px;
          white-space: nowrap;
        }

        .admin-blog-slug-row .admin-blog-input,
        .admin-blog-tag-row .admin-blog-input {
          min-width: 0;
        }

        .admin-blog-mini-btn {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          gap: 7px;
          padding: 0 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text);
          font: inherit;
          font-size: var(--text-xs);
          font-weight: 750;
          cursor: pointer;
        }

        .admin-blog-mini-btn:hover {
          border-color: var(--color-accent);
          color: var(--color-accent);
        }

        .admin-blog-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 10px;
        }

        .admin-blog-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          background: var(--color-surface);
          color: var(--color-text-muted);
          font-size: 11px;
          font-weight: 700;
        }

        .admin-blog-tag button {
          display: grid;
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .admin-blog-cover-preview {
          position: relative;
          overflow: hidden;
          margin-top: 10px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-offset);
          aspect-ratio: 16 / 7;
        }

        .admin-blog-cover-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .admin-blog-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-offset);
        }

        .admin-blog-toggle-title {
          display: block;
          color: var(--color-text);
          font-size: var(--text-sm);
          font-weight: 800;
        }

        .admin-blog-toggle-copy {
          display: block;
          margin-top: 3px;
          color: var(--color-text-faint);
          font-size: 11px;
          line-height: 1.45;
        }

        .admin-blog-switch {
          position: relative;
          width: 46px;
          height: 26px;
          flex: 0 0 auto;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: var(--color-surface-dynamic);
          cursor: pointer;
          transition: background .18s ease;
        }

        .admin-blog-switch::after {
          content: "";
          position: absolute;
          top: 4px;
          left: 4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,.3);
          transition: transform .18s ease;
        }

        .admin-blog-switch[aria-checked="true"] {
          background: var(--color-accent);
        }

        .admin-blog-switch[aria-checked="true"]::after {
          transform: translateX(20px);
        }

        .admin-blog-modal-foot {
          position: sticky;
          z-index: 2;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px 20px;
          border-top: 1px solid var(--color-divider);
          background: var(--color-surface);
        }

        .admin-blog-save {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 16px;
          border: 0;
          border-radius: var(--radius-md);
          background: var(--color-accent);
          color: #fff;
          font: inherit;
          font-size: var(--text-sm);
          font-weight: 800;
          cursor: pointer;
        }

        .admin-blog-save:disabled {
          cursor: not-allowed;
          opacity: .55;
        }

        .admin-blog-save:not(:disabled):hover {
          background: var(--color-accent-hover);
        }

        .admin-blog-public-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--color-accent);
          font-size: var(--text-xs);
          font-weight: 800;
          text-decoration: none;
        }

        .admin-blog-confirm {
          width: min(100%, 420px);
          padding: 22px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          box-shadow: var(--shadow-xl);
        }

        .admin-blog-confirm h2 {
          margin: 0;
          color: var(--color-text);
          font-family: var(--font-display);
          font-size: var(--text-lg);
          font-weight: 900;
        }

        .admin-blog-confirm p {
          margin: 11px 0 0;
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          line-height: 1.55;
        }

        .admin-blog-confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
        }

        .admin-blog-danger {
          border-color: #dc2626;
          background: #dc2626;
        }

        .admin-blog-danger:hover {
          border-color: #b91c1c;
          background: #b91c1c;
        }

        @media (max-width: 680px) {
          .admin-blog-post {
            grid-template-columns: 58px minmax(0, 1fr);
          }

          .admin-blog-thumb {
            width: 58px;
          }

          .admin-blog-post-actions {
            grid-column: 1 / -1;
            justify-content: flex-end;
          }

          .admin-blog-grid {
            grid-template-columns: 1fr;
          }

          .admin-blog-field--full {
            grid-column: auto;
          }

          .admin-blog-slug-row {
            flex-direction: column;
          }

          .admin-blog-slug-prefix {
            width: fit-content;
          }

          .admin-blog-modal-foot {
            align-items: flex-start;
            flex-direction: column-reverse;
          }
        }
      `}</style>

      <div className="admin-blog-page">
        <header className="admin-blog-header">
          <div>
            <h1 className="admin-blog-title">Blog</h1>
            <p className="admin-blog-subtitle">
              {posts.length} wpisów ·{" "}
              {posts.filter((post) => post.published).length} opublikowanych ·{" "}
              {posts.filter((post) => !post.published).length} szkiców
            </p>
          </div>

          <button className="admin-blog-new" onClick={openNewPost}>
            <Plus size={16} />
            Nowy wpis
          </button>
        </header>

        <div className="admin-blog-toolbar">
          <div className="admin-blog-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Szukaj po tytule, slugu lub tagu…"
              aria-label="Szukaj wpisów"
            />
          </div>

          <select
            className="admin-blog-filter"
            value={visibility}
            onChange={(event) =>
              setVisibility(
                event.target.value as "all" | "published" | "draft"
              )
            }
            aria-label="Filtruj wpisy według statusu"
          >
            <option value="all">Wszystkie wpisy</option>
            <option value="published">Opublikowane</option>
            <option value="draft">Szkice</option>
          </select>
        </div>

        {error && (
          <div className="admin-blog-alert" role="alert">
            <AlertCircle size={17} />
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Zamknij błąd">
              <X size={15} />
            </button>
          </div>
        )}

        <div className="admin-blog-layout">
          {filteredPosts.length > 0 ? (
            <div className="admin-blog-list">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className={`admin-blog-post ${
                    post.published ? "" : "admin-blog-post--draft"
                  }`}
                >
                  <div className="admin-blog-thumb">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <FileText size={24} />
                    )}
                  </div>

                  <div className="admin-blog-post-main">
                    <h2 className="admin-blog-post-title">{post.title}</h2>

                    <div className="admin-blog-post-meta">
                      <span
                        className={`admin-blog-pill ${
                          post.published
                            ? "admin-blog-pill--published"
                            : "admin-blog-pill--draft"
                        }`}
                      >
                        {post.published ? (
                          <>
                            <Check size={11} />
                            Opublikowany
                          </>
                        ) : (
                          <>
                            <FileText size={11} />
                            Szkic
                          </>
                        )}
                      </span>

                      <span>{categoryLabel(post.category)}</span>
                      <span>·</span>
                      <span>
                        {post.published
                          ? `Publikacja: ${formatDate(post.publishedAt)}`
                          : `Aktualizacja: ${formatDate(post.updatedAt)}`}
                      </span>
                    </div>
                  </div>

                  <div className="admin-blog-post-actions">
                    {post.published && (
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-blog-icon-btn"
                        title="Otwórz publiczny wpis"
                        aria-label={`Otwórz wpis: ${post.title}`}
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}

                    <button
                      className="admin-blog-icon-btn"
                      onClick={() => togglePublished(post)}
                      title={post.published ? "Ukryj wpis" : "Opublikuj wpis"}
                      aria-label={
                        post.published
                          ? `Ukryj wpis: ${post.title}`
                          : `Opublikuj wpis: ${post.title}`
                      }
                    >
                      {post.published ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>

                    <button
                      className="admin-blog-icon-btn"
                      onClick={() => openEditPost(post)}
                      title="Edytuj wpis"
                      aria-label={`Edytuj wpis: ${post.title}`}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      className="admin-blog-icon-btn admin-blog-icon-btn--danger"
                      onClick={() => setDeleteTarget(post)}
                      title="Usuń wpis"
                      aria-label={`Usuń wpis: ${post.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-blog-empty">
              <div>
                <FileText size={36} style={{ opacity: 0.35 }} />
                <h2>
                  {posts.length === 0
                    ? "Nie masz jeszcze wpisów"
                    : "Brak wpisów spełniających wybrane kryteria"}
                </h2>
                <p>
                  {posts.length === 0
                    ? "Utwórz pierwszy artykuł, relację lub poradnik."
                    : "Zmień wyszukiwanie albo filtr widoczności."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {(editingId !== null || draft.title || draft.content || draft.excerpt) && (
        <div
          className="admin-blog-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeEditor();
            }
          }}
        >
          <section
            className="admin-blog-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="blog-editor-title"
          >
            <header className="admin-blog-modal-head">
              <div>
                <h2 id="blog-editor-title" className="admin-blog-modal-title">
                  {isEditing ? "Edytuj wpis" : "Nowy wpis"}
                </h2>
              </div>

              <button
                className="admin-blog-close"
                onClick={closeEditor}
                disabled={saving}
                aria-label="Zamknij edytor"
              >
                <X size={18} />
              </button>
            </header>

            <div className="admin-blog-form">
              <div className="admin-blog-grid">
                <div className="admin-blog-field admin-blog-field--full">
                  <label className="admin-blog-label" htmlFor="blog-title">
                    <span>Tytuł wpisu</span>
                    <span>{draft.title.length}/180</span>
                  </label>

                  <input
                    id="blog-title"
                    className="admin-blog-input"
                    value={draft.title}
                    maxLength={180}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    placeholder="np. Jak fotografować pokazy lotnicze"
                  />
                </div>

                <div className="admin-blog-field admin-blog-field--full">
                  <label className="admin-blog-label" htmlFor="blog-slug">
                    <span>Adres artykułu</span>
                  </label>

                  <div className="admin-blog-slug-row">
                    <span className="admin-blog-slug-prefix">/blog/</span>

                    <input
                      id="blog-slug"
                      className="admin-blog-input"
                      value={draft.slug}
                      maxLength={90}
                      onChange={(event) => {
                        setSlugTouched(true);
                        updateDraft("slug", slugify(event.target.value));
                      }}
                      placeholder="jak-fotografowac-pokazy-lotnicze"
                    />

                    <button
                      type="button"
                      className="admin-blog-mini-btn"
                      onClick={() => {
                        setSlugTouched(true);
                        updateDraft("slug", slugify(draft.title));
                      }}
                      disabled={!draft.title.trim()}
                    >
                      <Link2 size={14} />
                      Generuj
                    </button>
                  </div>

                  {publicUrl && (
                    <p className="admin-blog-help">
                      Docelowy adres: <strong>{publicUrl}</strong>
                    </p>
                  )}
                </div>

                <div className="admin-blog-field admin-blog-field--full">
                  <label className="admin-blog-label" htmlFor="blog-excerpt">
                    <span>Zajawka / meta description</span>
                    <span>{getExcerptCounter(draft.excerpt)}</span>
                  </label>

                  <textarea
                    id="blog-excerpt"
                    className="admin-blog-textarea"
                    value={draft.excerpt}
                    maxLength={350}
                    onChange={(event) =>
                      updateDraft("excerpt", event.target.value)
                    }
                    placeholder="Krótki, konkretny opis artykułu. Google może użyć go jako opisu wyniku wyszukiwania."
                  />

                  <p className="admin-blog-help">
                    Zalecane: około 120–160 znaków. Pierwsze zdanie powinno
                    jasno mówić, co czytelnik znajdzie w artykule.
                  </p>
                </div>

                <div className="admin-blog-field">
                  <label className="admin-blog-label" htmlFor="blog-category">
                    <span>Kategoria</span>
                  </label>

                  <select
                    id="blog-category"
                    className="admin-blog-select"
                    value={draft.category}
                    onChange={(event) =>
                      updateDraft(
                        "category",
                        event.target.value as BlogCategory
                      )
                    }
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-blog-field">
                  <label className="admin-blog-label" htmlFor="blog-author">
                    <span>Autor</span>
                  </label>

                  <input
                    id="blog-author"
                    className="admin-blog-input"
                    value={draft.authorName}
                    maxLength={100}
                    onChange={(event) =>
                      updateDraft("authorName", event.target.value)
                    }
                    placeholder="MGYT"
                  />
                </div>

                <div className="admin-blog-field admin-blog-field--full">
                  <label className="admin-blog-label" htmlFor="blog-cover">
                    <span>URL okładki</span>
                  </label>

                  <div className="admin-blog-slug-row">
                    <input
                      ref={coverUrlInputRef}
                      id="blog-cover"
                      className="admin-blog-input"
                      value={draft.coverImage}
                      onChange={(event) =>
                        updateDraft("coverImage", event.target.value)
                      }
                      placeholder="https://..."
                    />

                    <button
                      type="button"
                      className="admin-blog-mini-btn"
                      onClick={() => coverUrlInputRef.current?.focus()}
                    >
                      <ImageIcon size={14} />
                      Okładka
                    </button>
                  </div>

                  {draft.coverImage && (
                    <div className="admin-blog-cover-preview">
                      <img
                        src={draft.coverImage}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="admin-blog-field admin-blog-field--full">
                  <label
                    className="admin-blog-label"
                    htmlFor="blog-cover-alt"
                  >
                    <span>Alt tekst okładki</span>
                    <span>{draft.coverImageAlt.length}/250</span>
                  </label>

                  <input
                    id="blog-cover-alt"
                    className="admin-blog-input"
                    value={draft.coverImageAlt}
                    maxLength={250}
                    onChange={(event) =>
                      updateDraft("coverImageAlt", event.target.value)
                    }
                    placeholder="np. F-16 podczas pokazu lotniczego"
                  />

                  <p className="admin-blog-help">
                    Opisz rzeczywistą zawartość obrazu. Nie powtarzaj bez
                    potrzeby listy fraz SEO.
                  </p>
                </div>

                <div className="admin-blog-field">
                  <label className="admin-blog-label" htmlFor="blog-show">
                    <span>Powiązana galeria</span>
                  </label>

                  <select
                    id="blog-show"
                    className="admin-blog-select"
                    value={draft.relatedShowId ?? ""}
                    onChange={(event) =>
                      updateDraft(
                        "relatedShowId",
                        event.target.value || null
                      )
                    }
                  >
                    <option value="">Brak powiązania</option>

                    {shows.map((show) => (
                      <option key={show.id} value={show.id}>
                        {show.name} {show.year ? `(${show.year})` : ""} ·{" "}
                        {show.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-blog-field">
                  <label className="admin-blog-label" htmlFor="blog-event">
                    <span>Powiązane wydarzenie</span>
                  </label>

                  <select
                    id="blog-event"
                    className="admin-blog-select"
                    value={draft.relatedEventId ?? ""}
                    onChange={(event) =>
                      updateDraft(
                        "relatedEventId",
                        event.target.value || null
                      )
                    }
                  >
                    <option value="">Brak powiązania</option>

                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name} · {event.city}, {event.country}
                      </option>
                    ))}
                  </select>

                  {events.length === 0 && (
                    <p className="admin-blog-help">
                      Lista wydarzeń będzie dostępna po dodaniu endpointu
                      `/api/airshow-events?all=true`.
                    </p>
                  )}
                </div>

                <div className="admin-blog-field admin-blog-field--full">
                  <label className="admin-blog-label" htmlFor="blog-tag-input">
                    <span>Tagi</span>
                    <span>{draft.tags.length}/12</span>
                  </label>

                  <div className="admin-blog-tag-row">
                    <input
                      id="blog-tag-input"
                      className="admin-blog-input"
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="np. F-16, NATO Days, fotografia lotnicza"
                    />

                    <button
                      type="button"
                      className="admin-blog-mini-btn"
                      onClick={addTag}
                      disabled={!tagInput.trim() || draft.tags.length >= 12}
                    >
                      <Plus size={14} />
                      Dodaj
                    </button>
                  </div>

                  {draft.tags.length > 0 && (
                    <div className="admin-blog-tags">
                      {draft.tags.map((tag) => (
                        <span className="admin-blog-tag" key={tag}>
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            aria-label={`Usuń tag: ${tag}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="admin-blog-field admin-blog-field--full">
                  <label className="admin-blog-label" htmlFor="blog-content">
                    <span>Treść artykułu</span>
                    <span>{draft.content.length}/50000</span>
                  </label>

                  <textarea
                    id="blog-content"
                    className="admin-blog-textarea admin-blog-content"
                    value={draft.content}
                    maxLength={50000}
                    onChange={(event) =>
                      updateDraft("content", event.target.value)
                    }
                    placeholder={`Wpisz treść artykułu.

## Nagłówek drugiego poziomu

Akapit tekstu.

- Element listy
- Kolejny element listy

### Nagłówek trzeciego poziomu

Kolejny akapit.`}
                  />

                  <p className="admin-blog-help">
                    Formatowanie: pusta linia tworzy akapit, `##` tworzy H2,
                    `###` tworzy H3, a linie zaczynające się od `- ` tworzą
                    listę.
                  </p>
                </div>

                <div className="admin-blog-field admin-blog-field--full">
                  <div className="admin-blog-toggle">
                    <div>
                      <span className="admin-blog-toggle-title">
                        Opublikowany
                      </span>
                      <span className="admin-blog-toggle-copy">
                        Opublikowany artykuł będzie widoczny pod publicznym
                        adresem i zostanie dodany do sitemapy.
                      </span>
                    </div>

                    <button
                      type="button"
                      className="admin-blog-switch"
                      role="switch"
                      aria-checked={draft.published}
                      onClick={() =>
                        updateDraft("published", !draft.published)
                      }
                      aria-label="Zmień status publikacji"
                    />
                  </div>
                </div>
              </div>
            </div>

            <footer className="admin-blog-modal-foot">
              {publicUrl && isEditing && draft.published ? (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-blog-public-link"
                >
                  <ExternalLink size={14} />
                  Otwórz wpis publicznie
                </a>
              ) : (
                <span />
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="admin-blog-mini-btn"
                  onClick={closeEditor}
                  disabled={saving}
                >
                  Anuluj
                </button>

                <button
                  type="button"
                  className="admin-blog-save"
                  onClick={savePost}
                  disabled={!canSave || saving}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={15}
                        style={{
                          animation: "admin-blog-spin 1s linear infinite",
                        }}
                      />
                      Zapisywanie…
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {isEditing ? "Zapisz zmiany" : "Utwórz wpis"}
                    </>
                  )}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="admin-blog-modal-backdrop">
          <section
            className="admin-blog-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-blog-post-title"
          >
            <h2 id="delete-blog-post-title">Usunąć wpis?</h2>

            <p>
              Wpis „{deleteTarget.title}” zostanie trwale usunięty. Ta operacja
              nie może zostać cofnięta.
            </p>

            <div className="admin-blog-confirm-actions">
              <button
                className="admin-blog-mini-btn"
                onClick={() => setDeleteTarget(null)}
              >
                Anuluj
              </button>

              <button
                className="admin-blog-save admin-blog-danger"
                onClick={deletePost}
              >
                <Trash2 size={15} />
                Usuń wpis
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}