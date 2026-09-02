"use client";

import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
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

interface GalleryOption {
  id: string;
  name: string;
  year: number;
  location: string;
}

interface EventOption {
  id: string;
  slug: string;
  name: string;
  startDate: string;
  city: string;
  country: string;
}

interface ApiEventPayload {
  id: string;
  slug: string;
  name: string;
  startDate?: string;
  start_date?: string;
  city?: string;
  country?: string;
}

type DraftPost = Omit<
  BlogPost,
  "id" | "publishedAt" | "createdAt" | "updatedAt"
>;

type VisibilityFilter = "all" | "published" | "draft";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airshow-gallery.vercel.app"
).replace(/\/$/, "");

const CATEGORIES: Array<{
  value: BlogCategory;
  label: string;
  description: string;
}> = [
  {
    value: "aktualnosci",
    label: "Aktualności",
    description: "Nowe informacje, komunikaty i zapowiedzi",
  },
  {
    value: "relacje",
    label: "Relacje",
    description: "Autorskie relacje z pokazów lotniczych",
  },
  {
    value: "poradniki-fotograficzne",
    label: "Poradniki fotograficzne",
    description: "Technika, ustawienia aparatu i praktyka",
  },
  {
    value: "przewodniki",
    label: "Przewodniki",
    description: "Dojazd, przygotowanie i organizacja wyjazdu",
  },
  {
    value: "sprzet",
    label: "Sprzęt",
    description: "Aparaty, obiektywy i akcesoria fotograficzne",
  },
];

const EMPTY_DRAFT: DraftPost = {
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

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function categoryLabel(category: BlogCategory) {
  return (
    CATEGORIES.find((item) => item.value === category)?.label ?? "Artykuł"
  );
}

function categoryDescription(category: BlogCategory) {
  return (
    CATEGORIES.find((item) => item.value === category)?.description ?? ""
  );
}

function formatDate(value: string | null | undefined) {
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

function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function truncateSeoText(value: string, maxLength = 158) {
  const text = normalizeText(value);

  if (text.length <= maxLength) {
    return text;
  }

  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function getInitialDraft(): DraftPost {
  return {
    ...EMPTY_DRAFT,
    tags: [],
  };
}

function isBlogCategory(value: string): value is BlogCategory {
  return CATEGORIES.some((category) => category.value === value);
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [shows, setShows] = useState<GalleryOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftPost>(getInitialDraft);
  const [slugTouched, setSlugTouched] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [postsResponse, showsResponse, eventsResponse] =
        await Promise.all([
          fetch("/api/blog?all=true", { cache: "no-store" }),
          fetch("/api/shows?all=true", { cache: "no-store" }),
          fetch("/api/airshow-events?all=true", { cache: "no-store" }),
        ]);

      if (
        postsResponse.status === 401 ||
        showsResponse.status === 401 ||
        eventsResponse.status === 401
      ) {
        window.location.href = "/admin/login?redirect=/admin/blog";
        return;
      }

      if (!postsResponse.ok) {
        const payload = await postsResponse
          .json()
          .catch(() => ({ error: "" }));

        throw new Error(
          payload.error ??
            `Nie udało się pobrać wpisów bloga. HTTP ${postsResponse.status}.`
        );
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
          showsData
            .filter((show) => Boolean(show.id && show.name))
            .map((show) => ({
              id: show.id,
              name: show.name,
              year: Number(show.year) || 0,
              location: show.location || "",
            }))
        );
      } else {
        setShows([]);
      }

      if (eventsResponse.ok) {
        const eventsData = (await eventsResponse.json()) as ApiEventPayload[];

        setEvents(
          eventsData
            .filter((event) => Boolean(event.id && event.name))
            .map((event) => ({
              id: event.id,
              slug: event.slug ?? "",
              name: event.name,
              startDate: event.startDate ?? event.start_date ?? "",
              city: event.city ?? "",
              country: event.country ?? "",
            }))
        );
      } else {
        setEvents([]);
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

  useEffect(() => {
    if (!editorOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        closeEditor();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    const timer = window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 60);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
    };
  }, [editorOpen, saving]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      const searchableText = [
        post.title,
        post.slug,
        post.excerpt,
        post.authorName,
        post.category,
        ...post.tags,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesVisibility =
        visibility === "all" ||
        (visibility === "published" && post.published) ||
        (visibility === "draft" && !post.published);

      return matchesSearch && matchesVisibility;
    });
  }, [posts, search, visibility]);

  const publishedCount = useMemo(
    () => posts.filter((post) => post.published).length,
    [posts]
  );

  const draftCount = posts.length - publishedCount;
  const isEditing = editingId !== null;

  const publicPath = draft.slug
    ? `/blog/${slugify(draft.slug)}`
    : draft.title
      ? `/blog/${slugify(draft.title)}`
      : "";

  const publicUrl = publicPath ? `${SITE_URL}${publicPath}` : "";

  const seoTitle = draft.title
    ? `${draft.title} | MGYT AirShow Gallery`
    : "Tytuł artykułu | MGYT AirShow Gallery";

  const seoDescription = truncateSeoText(
    draft.excerpt ||
      "Krótki, konkretny opis artykułu, który może zostać użyty w wynikach wyszukiwania."
  );

  const canSave =
    draft.title.trim().length > 0 &&
    draft.excerpt.trim().length > 0 &&
    draft.content.trim().length > 0 &&
    slugify(draft.slug || draft.title).length > 0;

  function clearMessages() {
    setError(null);
    setNotice(null);
  }

  function openNewPost() {
    clearMessages();
    setEditingId(null);
    setDraft(getInitialDraft());
    setSlugTouched(false);
    setTagInput("");
    setEditorOpen(true);
  }

  function openEditPost(post: BlogPost) {
    clearMessages();
    setEditingId(post.id);
    setDraft({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      coverImageAlt: post.coverImageAlt,
      category: post.category,
      tags: [...post.tags],
      authorName: post.authorName,
      relatedShowId: post.relatedShowId,
      relatedEventId: post.relatedEventId,
      published: post.published,
    });
    setSlugTouched(true);
    setTagInput("");
    setEditorOpen(true);
  }

  function closeEditor() {
    if (saving) {
      return;
    }

    setEditorOpen(false);
    setEditingId(null);
    setDraft(getInitialDraft());
    setSlugTouched(false);
    setTagInput("");
  }

  function updateDraft<K extends keyof DraftPost>(
    key: K,
    value: DraftPost[K]
  ) {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function handleTitleChange(value: string) {
    setDraft((previous) => ({
      ...previous,
      title: value,
      slug: slugTouched ? previous.slug : slugify(value),
    }));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    updateDraft("slug", slugify(value));
  }

  function generateSlugFromTitle() {
    if (!draft.title.trim()) {
      setError("Najpierw wpisz tytuł artykułu.");
      titleInputRef.current?.focus();
      return;
    }

    setSlugTouched(true);
    updateDraft("slug", slugify(draft.title));
  }

  function addTag() {
    const tag = normalizeText(tagInput);

    if (!tag) {
      return;
    }

    if (draft.tags.length >= 12) {
      setError("Możesz dodać maksymalnie 12 tagów.");
      return;
    }

    const exists = draft.tags.some(
      (existingTag) =>
        existingTag.toLocaleLowerCase("pl-PL") ===
        tag.toLocaleLowerCase("pl-PL")
    );

    if (exists) {
      setTagInput("");
      return;
    }

    updateDraft("tags", [...draft.tags, tag]);
    setTagInput("");

    window.setTimeout(() => {
      tagInputRef.current?.focus();
    }, 0);
  }

  function removeTag(tag: string) {
    updateDraft(
      "tags",
      draft.tags.filter((item) => item !== tag)
    );
  }

  async function copyPublicUrl() {
    if (!publicUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      setNotice("Skopiowano adres publicznego wpisu.");
    } catch {
      setError("Nie udało się skopiować adresu.");
    }
  }

  async function savePost() {
    clearMessages();

    if (!draft.title.trim()) {
      setError("Uzupełnij tytuł wpisu.");
      titleInputRef.current?.focus();
      return;
    }

    if (!draft.excerpt.trim()) {
      setError("Uzupełnij zajawkę artykułu.");
      return;
    }

    if (!draft.content.trim()) {
      setError("Uzupełnij treść artykułu.");
      return;
    }

    const slug = slugify(draft.slug || draft.title);

    if (!slug) {
      setError("Nie udało się utworzyć poprawnego adresu wpisu.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        isEditing ? `/api/blog/${editingId}` : "/api/blog",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...draft,
            slug,
          }),
        }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error ?? `Nie udało się zapisać wpisu. HTTP ${response.status}.`
        );
      }

      const savedPost = payload as BlogPost;

      setPosts((previous) => {
        const exists = previous.some((post) => post.id === savedPost.id);

        if (!exists) {
          return [savedPost, ...previous];
        }

        return previous.map((post) =>
          post.id === savedPost.id ? savedPost : post
        );
      });

      setNotice(
        savedPost.published
          ? "Wpis został zapisany i opublikowany."
          : "Szkic został zapisany."
      );

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

  async function togglePublication(post: BlogPost) {
    clearMessages();
    setActionId(post.id);

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

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error ??
            `Nie udało się zmienić publikacji. HTTP ${response.status}.`
        );
      }

      const updatedPost = payload as BlogPost;

      setPosts((previous) =>
        previous.map((item) =>
          item.id === updatedPost.id ? updatedPost : item
        )
      );

      setNotice(
        updatedPost.published
          ? "Wpis został opublikowany."
          : "Wpis został ukryty i jest teraz szkicem."
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Nie udało się zmienić statusu wpisu."
      );
    } finally {
      setActionId(null);
    }
  }

  async function deletePost() {
    if (!deleteTarget) {
      return;
    }

    clearMessages();
    setActionId(deleteTarget.id);

    try {
      const response = await fetch(`/api/blog/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error ?? `Nie udało się usunąć wpisu. HTTP ${response.status}.`
        );
      }

      setPosts((previous) =>
        previous.filter((post) => post.id !== deleteTarget.id)
      );

      if (editingId === deleteTarget.id) {
        closeEditor();
      }

      setDeleteTarget(null);
      setNotice("Wpis został trwale usunięty.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Nie udało się usunąć wpisu."
      );
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return (
      <>
        <style>{`
          @keyframes admin-blog-spin {
            to { transform: rotate(360deg); }
          }

          .admin-blog-loading {
            display: grid;
            min-height: 48dvh;
            place-items: center;
            color: var(--color-text-muted);
          }

          .admin-blog-loading-inner {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: var(--text-sm);
            font-weight: 650;
          }
        `}</style>

        <div className="admin-blog-loading">
          <div className="admin-blog-loading-inner">
            <Loader2
              size={19}
              style={{ animation: "admin-blog-spin 1s linear infinite" }}
            />
            Ładowanie panelu bloga…
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes admin-blog-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes admin-blog-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .admin-blog-page {
          max-width: 1280px;
          padding: 6px 0 44px;
        }

        .admin-blog-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .admin-blog-title {
          margin: 0;
          color: var(--color-text);
          font-family: var(--font-display);
          font-size: var(--text-xl);
          font-weight: 900;
          letter-spacing: -.035em;
        }

        .admin-blog-subtitle {
          margin: 7px 0 0;
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          line-height: 1.5;
        }

        .admin-blog-new,
        .admin-blog-save {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          gap: 8px;
          padding: 0 15px;
          border: 0;
          border-radius: var(--radius-md);
          background: var(--color-accent);
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-size: var(--text-sm);
          font-weight: 800;
          text-decoration: none;
          transition: background .18s, transform .15s, opacity .18s;
        }

        .admin-blog-new:hover,
        .admin-blog-save:not(:disabled):hover {
          background: var(--color-accent-hover);
          transform: translateY(-1px);
        }

        .admin-blog-new:focus-visible,
        .admin-blog-save:focus-visible,
        .admin-blog-icon-btn:focus-visible,
        .admin-blog-mini-btn:focus-visible,
        .admin-blog-input:focus-visible,
        .admin-blog-textarea:focus-visible,
        .admin-blog-select:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        .admin-blog-save:disabled {
          cursor: not-allowed;
          opacity: .55;
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
          flex: 1 1 280px;
        }

        .admin-blog-search-icon {
          position: absolute;
          top: 50%;
          left: 12px;
          color: var(--color-text-faint);
          pointer-events: none;
          transform: translateY(-50%);
        }

        .admin-blog-search-input {
          box-sizing: border-box;
          width: 100%;
          min-height: 42px;
          padding: 0 38px 0 37px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          outline: none;
          background: var(--color-surface);
          color: var(--color-text);
          font: inherit;
          font-size: var(--text-sm);
        }

        .admin-blog-search-input:focus {
          border-color: var(--color-accent);
        }

        .admin-blog-search-clear {
          position: absolute;
          top: 50%;
          right: 7px;
          display: grid;
          width: 28px;
          height: 28px;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--color-text-faint);
          cursor: pointer;
          transform: translateY(-50%);
        }

        .admin-blog-search-clear:hover {
          background: var(--color-surface-offset);
          color: var(--color-text);
        }

        .admin-blog-filter {
          min-height: 42px;
          padding: 0 34px 0 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text);
          font: inherit;
          font-size: var(--text-sm);
        }

        .admin-blog-alert,
        .admin-blog-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 16px;
          padding: 12px 14px;
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          line-height: 1.5;
          animation: admin-blog-in .2s ease both;
        }

        .admin-blog-alert {
          border: 1px solid rgba(239, 68, 68, .28);
          background: rgba(239, 68, 68, .09);
          color: #ef4444;
        }

        .admin-blog-notice {
          border: 1px solid rgba(34, 197, 94, .28);
          background: rgba(34, 197, 94, .09);
          color: #16a34a;
        }

        .admin-blog-message-close {
          display: grid;
          margin-left: auto;
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .admin-blog-list {
          display: grid;
          gap: 10px;
        }

        .admin-blog-post {
          display: grid;
          grid-template-columns: 86px minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          padding: 10px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          transition: border-color .18s, box-shadow .18s, transform .18s;
          animation: admin-blog-in .22s ease both;
        }

        .admin-blog-post:hover {
          border-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
          box-shadow: var(--shadow-sm);
          transform: translateY(-1px);
        }

        .admin-blog-post--draft {
          opacity: .78;
        }

        .admin-blog-thumb {
          position: relative;
          display: grid;
          width: 86px;
          aspect-ratio: 1 / 1;
          place-items: center;
          overflow: hidden;
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

        .admin-blog-post-excerpt {
          display: -webkit-box;
          overflow: hidden;
          margin: 6px 0 0;
          color: var(--color-text-muted);
          font-size: 12px;
          line-height: 1.45;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .admin-blog-post-meta {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 8px;
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
          background: rgba(34, 197, 94, .13);
          color: #16a34a;
        }

        .admin-blog-pill--draft {
          background: rgba(234, 179, 8, .14);
          color: #a16207;
        }

        .admin-blog-actions {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .admin-blog-icon-btn {
          display: grid;
          width: 35px;
          height: 35px;
          place-items: center;
          padding: 0;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface-offset);
          color: var(--color-text-muted);
          cursor: pointer;
          text-decoration: none;
          transition: border-color .15s, background .15s, color .15s;
        }

        .admin-blog-icon-btn:hover {
          border-color: var(--color-accent);
          background: var(--color-accent-subtle);
          color: var(--color-accent);
        }

        .admin-blog-icon-btn:disabled {
          cursor: wait;
          opacity: .55;
        }

        .admin-blog-icon-btn--danger:hover {
          border-color: #ef4444;
          background: rgba(239, 68, 68, .08);
          color: #ef4444;
        }

        .admin-blog-empty {
          display: grid;
          min-height: 270px;
          place-items: center;
          padding: 30px;
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          color: var(--color-text-muted);
          text-align: center;
        }

        .admin-blog-empty-icon {
          display: grid;
          width: 54px;
          height: 54px;
          margin: 0 auto 14px;
          place-items: center;
          border-radius: var(--radius-lg);
          background: var(--color-accent-subtle);
          color: var(--color-accent);
        }

        .admin-blog-empty h2 {
          margin: 0;
          color: var(--color-text);
          font-family: var(--font-display);
          font-size: var(--text-lg);
          font-weight: 900;
          letter-spacing: -.03em;
        }

        .admin-blog-empty p {
          max-width: 430px;
          margin: 8px 0 0;
          font-size: var(--text-sm);
          line-height: 1.55;
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
          background: rgba(0, 0, 0, .66);
          backdrop-filter: blur(4px);
          animation: admin-blog-in .18s ease both;
        }

        .admin-blog-modal {
          width: min(100%, 960px);
          max-height: calc(100dvh - 36px);
          overflow: auto;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          box-shadow: var(--shadow-xl);
        }

        .admin-blog-modal-head {
          position: sticky;
          z-index: 4;
          top: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 17px 20px;
          border-bottom: 1px solid var(--color-divider);
          background: var(--color-surface);
        }

        .admin-blog-modal-title {
          margin: 0;
          color: var(--color-text);
          font-family: var(--font-display);
          font-size: var(--text-lg);
          font-weight: 900;
          letter-spacing: -.03em;
        }

        .admin-blog-modal-copy {
          margin: 4px 0 0;
          color: var(--color-text-faint);
          font-size: 11px;
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

        .admin-blog-close:disabled {
          cursor: wait;
          opacity: .5;
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
          letter-spacing: .085em;
          text-transform: uppercase;
        }

        .admin-blog-input,
        .admin-blog-textarea,
        .admin-blog-select {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          outline: none;
          background: var(--color-surface-offset);
          color: var(--color-text);
          font: inherit;
          font-size: var(--text-sm);
          transition: border-color .15s, box-shadow .15s;
        }

        .admin-blog-input:focus,
        .admin-blog-textarea:focus,
        .admin-blog-select:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-subtle);
        }

        .admin-blog-input,
        .admin-blog-select {
          min-height: 42px;
          padding: 0 12px;
        }

        .admin-blog-textarea {
          display: block;
          min-height: 108px;
          padding: 11px 12px;
          line-height: 1.65;
          resize: vertical;
        }

        .admin-blog-content {
          min-height: 390px;
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
          align-items: stretch;
          gap: 8px;
        }

        .admin-blog-slug-prefix {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          min-height: 42px;
          padding: 0 10px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text-faint);
          font-size: 11px;
          font-weight: 700;
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
          cursor: pointer;
          font: inherit;
          font-size: var(--text-xs);
          font-weight: 750;
          text-decoration: none;
          transition: border-color .15s, color .15s, background .15s;
        }

        .admin-blog-mini-btn:hover:not(:disabled) {
          border-color: var(--color-accent);
          background: var(--color-accent-subtle);
          color: var(--color-accent);
        }

        .admin-blog-mini-btn:disabled {
          cursor: not-allowed;
          opacity: .5;
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
          aspect-ratio: 16 / 7;
          overflow: hidden;
          margin-top: 10px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-offset);
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
          position: absolute;
          top: 4px;
          left: 4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,.3);
          content: "";
          transition: transform .18s ease;
        }

        .admin-blog-switch[aria-checked="true"] {
          background: var(--color-accent);
        }

        .admin-blog-switch[aria-checked="true"]::after {
          transform: translateX(20px);
        }

        .admin-blog-seo-preview {
          padding: 16px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-offset);
        }

        .admin-blog-seo-preview-title {
          overflow: hidden;
          color: #1a0dab;
          font-family: Arial, sans-serif;
          font-size: 18px;
          line-height: 1.3;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        [data-theme="dark"] .admin-blog-seo-preview-title {
          color: #8ab4f8;
        }

        .admin-blog-seo-preview-url {
          overflow: hidden;
          margin-top: 4px;
          color: #188038;
          font-family: Arial, sans-serif;
          font-size: 12px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        [data-theme="dark"] .admin-blog-seo-preview-url {
          color: #81c995;
        }

        .admin-blog-seo-preview-description {
          display: -webkit-box;
          overflow: hidden;
          margin: 6px 0 0;
          color: var(--color-text-muted);
          font-family: Arial, sans-serif;
          font-size: 13px;
          line-height: 1.5;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .admin-blog-modal-foot {
          position: sticky;
          z-index: 4;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px 20px;
          border-top: 1px solid var(--color-divider);
          background: var(--color-surface);
        }

        .admin-blog-modal-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-blog-public-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .admin-blog-public-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          overflow: hidden;
          color: var(--color-accent);
          font-size: var(--text-xs);
          font-weight: 800;
          text-decoration: none;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-blog-confirm {
          width: min(100%, 430px);
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
          letter-spacing: -.03em;
        }

        .admin-blog-confirm p {
          margin: 11px 0 0;
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          line-height: 1.6;
        }

        .admin-blog-confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
        }

        .admin-blog-danger {
          background: #dc2626;
        }

        .admin-blog-danger:hover:not(:disabled) {
          background: #b91c1c;
        }

        @media (max-width: 720px) {
          .admin-blog-post {
            grid-template-columns: 62px minmax(0, 1fr);
          }

          .admin-blog-thumb {
            width: 62px;
          }

          .admin-blog-actions {
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
            flex-wrap: wrap;
          }

          .admin-blog-slug-prefix {
            width: fit-content;
          }

          .admin-blog-modal-foot {
            align-items: flex-start;
            flex-direction: column-reverse;
          }

          .admin-blog-public-actions {
            width: 100%;
          }

          .admin-blog-modal-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }

        @media (max-width: 480px) {
          .admin-blog-page {
            padding-bottom: 28px;
          }

          .admin-blog-header {
            margin-bottom: 18px;
          }

          .admin-blog-new {
            width: 100%;
          }

          .admin-blog-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .admin-blog-filter {
            width: 100%;
          }

          .admin-blog-modal-backdrop {
            align-items: flex-end;
            padding: 0;
          }

          .admin-blog-modal {
            max-height: 94dvh;
            border-right: 0;
            border-bottom: 0;
            border-left: 0;
            border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          }

          .admin-blog-modal-head,
          .admin-blog-form,
          .admin-blog-modal-foot {
            padding-right: 16px;
            padding-left: 16px;
          }

          .admin-blog-modal-actions {
            justify-content: stretch;
          }

          .admin-blog-modal-actions button {
            flex: 1;
          }
        }
      `}</style>

      <div className="admin-blog-page">
        <header className="admin-blog-header">
          <div>
            <h1 className="admin-blog-title">Blog</h1>

            <p className="admin-blog-subtitle">
              {posts.length} wpisów · {publishedCount} opublikowanych ·{" "}
              {draftCount} szkiców
            </p>
          </div>

          <button className="admin-blog-new" onClick={openNewPost}>
            <Plus size={17} />
            Nowy wpis
          </button>
        </header>

        <div className="admin-blog-toolbar">
          <div className="admin-blog-search">
            <Search className="admin-blog-search-icon" size={16} />

            <input
              className="admin-blog-search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Szukaj po tytule, slugu, autorze lub tagu…"
              aria-label="Szukaj wpisów bloga"
            />

            {search && (
              <button
                className="admin-blog-search-clear"
                onClick={() => setSearch("")}
                aria-label="Wyczyść wyszukiwanie"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <select
            className="admin-blog-filter"
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as VisibilityFilter)
            }
            aria-label="Filtruj według statusu"
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

            <button
              className="admin-blog-message-close"
              onClick={() => setError(null)}
              aria-label="Zamknij komunikat błędu"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {notice && (
          <div className="admin-blog-notice" role="status">
            <Check size={17} />
            <span>{notice}</span>

            <button
              className="admin-blog-message-close"
              onClick={() => setNotice(null)}
              aria-label="Zamknij komunikat"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {filteredPosts.length > 0 ? (
          <section className="admin-blog-list" aria-label="Lista wpisów bloga">
            {filteredPosts.map((post) => {
              const isProcessing = actionId === post.id;

              return (
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
                      <FileText size={24} aria-hidden="true" />
                    )}
                  </div>

                  <div className="admin-blog-post-main">
                    <h2 className="admin-blog-post-title">{post.title}</h2>

                    <p className="admin-blog-post-excerpt">
                      {post.excerpt ||
                        "Brak zajawki — uzupełnij opis dla Google i czytelników."}
                    </p>

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
                      <span>·</span>
                      <span>{estimateReadTime(post.content)} min</span>
                    </div>
                  </div>

                  <div className="admin-blog-actions">
                    {post.published && (
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-blog-icon-btn"
                        title="Otwórz wpis publicznie"
                        aria-label={`Otwórz wpis publicznie: ${post.title}`}
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}

                    <button
                      className="admin-blog-icon-btn"
                      onClick={() => togglePublication(post)}
                      title={post.published ? "Ukryj wpis" : "Opublikuj wpis"}
                      aria-label={
                        post.published
                          ? `Ukryj wpis: ${post.title}`
                          : `Opublikuj wpis: ${post.title}`
                      }
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2
                          size={15}
                          style={{
                            animation: "admin-blog-spin 1s linear infinite",
                          }}
                        />
                      ) : post.published ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </button>

                    <button
                      className="admin-blog-icon-btn"
                      onClick={() => openEditPost(post)}
                      title="Edytuj wpis"
                      aria-label={`Edytuj wpis: ${post.title}`}
                      disabled={isProcessing}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      className="admin-blog-icon-btn admin-blog-icon-btn--danger"
                      onClick={() => setDeleteTarget(post)}
                      title="Usuń wpis"
                      aria-label={`Usuń wpis: ${post.title}`}
                      disabled={isProcessing}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="admin-blog-empty">
            <div>
              <span className="admin-blog-empty-icon">
                <BookOpen size={26} />
              </span>

              <h2>
                {posts.length === 0
                  ? "Nie masz jeszcze wpisów"
                  : "Brak wyników"}
              </h2>

              <p>
                {posts.length === 0
                  ? "Utwórz pierwszy artykuł, relację lub poradnik fotograficzny."
                  : "Zmień wyszukiwanie albo filtr statusu, aby zobaczyć wpisy."}
              </p>
            </div>
          </section>
        )}
      </div>

      {editorOpen && (
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
            aria-labelledby="admin-blog-editor-title"
          >
            <header className="admin-blog-modal-head">
              <div>
                <h2
                  id="admin-blog-editor-title"
                  className="admin-blog-modal-title"
                >
                  {isEditing ? "Edytuj wpis" : "Nowy wpis"}
                </h2>

                <p className="admin-blog-modal-copy">
                  Uzupełnij dane artykułu, a następnie zapisz go jako szkic lub
                  opublikuj.
                </p>
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
                    <span>Tytuł artykułu</span>
                    <span>{draft.title.length}/180</span>
                  </label>

                  <input
                    ref={titleInputRef}
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
                    <span>Adres wpisu</span>
                    <span>unikalny slug</span>
                  </label>

                  <div className="admin-blog-slug-row">
                    <span className="admin-blog-slug-prefix">/blog/</span>

                    <input
                      id="blog-slug"
                      className="admin-blog-input"
                      value={draft.slug}
                      maxLength={90}
                      onChange={(event) => handleSlugChange(event.target.value)}
                      placeholder="jak-fotografowac-pokazy-lotnicze"
                    />

                    <button
                      type="button"
                      className="admin-blog-mini-btn"
                      onClick={generateSlugFromTitle}
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
                    <span>Zajawka i meta description</span>
                    <span>{draft.excerpt.length}/350</span>
                  </label>

                  <textarea
                    id="blog-excerpt"
                    className="admin-blog-textarea"
                    value={draft.excerpt}
                    maxLength={350}
                    onChange={(event) =>
                      updateDraft("excerpt", event.target.value)
                    }
                    placeholder="Napisz konkretną zajawkę: czego użytkownik dowie się z artykułu?"
                  />

                  <p className="admin-blog-help">
                    Najlepiej 120–160 znaków. To podstawowy kandydat na opis
                    wyniku wyszukiwania Google.
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
                    onChange={(event) => {
                      const category = event.target.value;

                      if (isBlogCategory(category)) {
                        updateDraft("category", category);
                      }
                    }}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>

                  <p className="admin-blog-help">
                    {categoryDescription(draft.category)}
                  </p>
                </div>

                <div className="admin-blog-field">
                  <label className="admin-blog-label" htmlFor="blog-author">
                    <span>Autor</span>
                    <span>{draft.authorName.length}/100</span>
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
                  <label className="admin-blog-label" htmlFor="blog-cover-url">
                    <span>URL okładki</span>
                  </label>

                  <input
                    id="blog-cover-url"
                    className="admin-blog-input"
                    value={draft.coverImage}
                    onChange={(event) =>
                      updateDraft("coverImage", event.target.value)
                    }
                    placeholder="https://..."
                  />

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
                    placeholder="np. F-16 Fighting Falcon podczas pokazu lotniczego"
                  />

                  <p className="admin-blog-help">
                    Opisz faktycznie widoczny obraz. Nie wypełniaj tego pola
                    samymi słowami kluczowymi.
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
                        {show.name}
                        {show.year ? ` (${show.year})` : ""} · {show.location}
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
                        {event.name}
                        {event.city ? ` · ${event.city}` : ""}
                        {event.country ? `, ${event.country}` : ""}
                      </option>
                    ))}
                  </select>

                  {events.length === 0 && (
                    <p className="admin-blog-help">
                      Nie pobrano wydarzeń. Sprawdź endpoint
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
                      ref={tagInputRef}
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
                      placeholder="np. fotografia lotnicza, F-16, NATO Days"
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
                            aria-label={`Usuń tag ${tag}`}
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
                    placeholder={`Wpisz artykuł.

## Nagłówek drugiego poziomu

To jest pierwszy akapit treści.

- Pierwszy punkt listy
- Drugi punkt listy

### Nagłówek trzeciego poziomu

Kolejny akapit.`}
                  />

                  <p className="admin-blog-help">
                    Formatowanie: pusta linia tworzy nowy akapit, `##` tworzy
                    nagłówek H2, `###` tworzy H3, a linie zaczynające się od
                    `- ` tworzą listę.
                  </p>
                </div>

                <div className="admin-blog-field admin-blog-field--full">
                  <div className="admin-blog-seo-preview">
                    <div className="admin-blog-label">
                      <span>Podgląd wyniku Google</span>
                      <span>orientacyjny</span>
                    </div>

                    <div className="admin-blog-seo-preview-title">
                      {seoTitle}
                    </div>

                    <div className="admin-blog-seo-preview-url">
                      {publicUrl || `${SITE_URL}/blog/twoj-artykul`}
                    </div>

                    <p className="admin-blog-seo-preview-description">
                      {seoDescription}
                    </p>
                  </div>
                </div>

                <div className="admin-blog-field admin-blog-field--full">
                  <div className="admin-blog-toggle">
                    <div>
                      <span className="admin-blog-toggle-title">
                        Opublikowany
                      </span>

                      <span className="admin-blog-toggle-copy">
                        Publikacja udostępni artykuł pod publicznym adresem i
                        doda go do dynamicznej mapy witryny.
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
                      aria-label="Zmień status publikacji wpisu"
                    />
                  </div>
                </div>
              </div>
            </div>

            <footer className="admin-blog-modal-foot">
              <div className="admin-blog-public-actions">
                {isEditing && draft.published && publicPath ? (
                  <>
                    <a
                      href={publicPath}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-blog-public-link"
                    >
                      <ExternalLink size={14} />
                      Otwórz wpis
                    </a>

                    <button
                      type="button"
                      className="admin-blog-icon-btn"
                      onClick={copyPublicUrl}
                      title="Skopiuj adres wpisu"
                      aria-label="Skopiuj adres wpisu"
                    >
                      <Copy size={14} />
                    </button>
                  </>
                ) : (
                  <span />
                )}
              </div>

              <div className="admin-blog-modal-actions">
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
                        size={16}
                        style={{
                          animation: "admin-blog-spin 1s linear infinite",
                        }}
                      />
                      Zapisywanie…
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {isEditing
                        ? "Zapisz zmiany"
                        : draft.published
                          ? "Opublikuj wpis"
                          : "Zapisz szkic"}
                    </>
                  )}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="admin-blog-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && actionId === null) {
              setDeleteTarget(null);
            }
          }}
        >
          <section
            className="admin-blog-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-blog-post-title"
          >
            <h2 id="delete-blog-post-title">Usunąć wpis?</h2>

            <p>
              Wpis „{deleteTarget.title}” zostanie trwale usunięty. Nie będzie
              można przywrócić jego treści, adresu ani danych SEO.
            </p>

            <div className="admin-blog-confirm-actions">
              <button
                className="admin-blog-mini-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={actionId === deleteTarget.id}
              >
                Anuluj
              </button>

              <button
                className="admin-blog-save admin-blog-danger"
                onClick={deletePost}
                disabled={actionId === deleteTarget.id}
              >
                {actionId === deleteTarget.id ? (
                  <>
                    <Loader2
                      size={15}
                      style={{
                        animation: "admin-blog-spin 1s linear infinite",
                      }}
                    />
                    Usuwanie…
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Usuń wpis
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}