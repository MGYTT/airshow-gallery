export type BlogCategory =
  | "aktualnosci"
  | "relacje"
  | "poradniki-fotograficzne"
  | "przewodniki"
  | "sprzet";

export interface DbBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;

  cover_image: string;
  cover_image_alt: string;

  category: BlogCategory;
  tags: string[];

  author_name: string;

  related_show_id: string | null;
  related_event_id: string | null;

  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapBlogPost(post: DbBlogPost) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? "",
    content: post.content ?? "",

    coverImage: post.cover_image ?? "",
    coverImageAlt: post.cover_image_alt ?? "",

    category: post.category,
    tags: post.tags ?? [],

    authorName: post.author_name ?? "MGYT",

    relatedShowId: post.related_show_id,
    relatedEventId: post.related_event_id,

    published: post.published,
    publishedAt: post.published_at,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  };
}

export type BlogPost = ReturnType<typeof mapBlogPost>;

export const BLOG_CATEGORY_LABELS: Record<BlogCategory, string> = {
  aktualnosci: "Aktualności",
  relacje: "Relacje",
  "poradniki-fotograficzne": "Poradniki fotograficzne",
  przewodniki: "Przewodniki",
  sprzet: "Sprzęt",
};