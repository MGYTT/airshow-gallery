// ─────────────────────────────────────────────────────────────
// AIR SHOWS
// ─────────────────────────────────────────────────────────────
export interface DbAirShow {
  id:           string;
  name:         string;
  location:     string;
  date:         string;
  year:         number;
  description:  string;
  cover_image:  string;
  photo_count:  number;
  tags:         string[];
  featured:     boolean;
  published:    boolean;
  created_at:   string;
  updated_at:   string;
}

export function mapShow(s: DbAirShow) {
  return {
    id:          s.id,
    name:        s.name,
    location:    s.location,
    date:        s.date,
    year:        s.year,
    description: s.description,
    coverImage:  s.cover_image,
    photoCount:  s.photo_count,
    tags:        s.tags ?? [],
    featured:    s.featured,
    published:   s.published,
  };
}

export type MappedShow = ReturnType<typeof mapShow>;

// ─────────────────────────────────────────────────────────────
// PHOTOS
// ─────────────────────────────────────────────────────────────
export interface DbPhoto {
  id:         string;
  show_id:    string;
  src:        string;
  alt:        string;
  aircraft:   string;
  width:      number;
  height:     number;
  tags:       string[];
  featured:   boolean;
  created_at: string;
}

export function mapPhoto(p: DbPhoto) {
  return {
    id:       p.id,
    showId:   p.show_id,
    src:      p.src,
    alt:      p.alt,
    aircraft: p.aircraft,
    width:    p.width,
    height:   p.height,
    tags:     p.tags ?? [],
    featured: p.featured,
  };
}

export type MappedPhoto = ReturnType<typeof mapPhoto>;

// ─────────────────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────────────────
export type FrameType = "photo" | "burst" | "text" | "stat" | "fact";

export interface DbStoryFrame {
  id:              string;
  story_id:        string;
  type:            FrameType;
  image_src:       string | null;
  image_alt:       string | null;
  caption:         string | null;
  subcaption:      string | null;
  aircraft:        string | null;
  timestamp_label: string | null;
  stat_value:      string | null;
  stat_label:      string | null;
  fact_text:       string | null;
  sort_order:      number;
  duration:        number;
}

export interface DbStory {
  id:           string;
  show_id:      string;
  title:        string;
  subtitle:     string | null;
  cover_image:  string | null;
  accent_color: string;
  published:    boolean;
  sort_order:   number;
  views:        number;
  created_at:   string;
  story_frames: DbStoryFrame[];
}

export function mapStoryFrame(f: DbStoryFrame) {
  return {
    id:             f.id,
    storyId:        f.story_id,
    type:           f.type,
    imageSrc:       f.image_src,
    imageAlt:       f.image_alt,
    caption:        f.caption,
    subcaption:     f.subcaption,
    aircraft:       f.aircraft,
    timestampLabel: f.timestamp_label,
    statValue:      f.stat_value,
    statLabel:      f.stat_label,
    factText:       f.fact_text,
    sortOrder:      f.sort_order,
    duration:       f.duration,
  };
}

export function mapStory(s: DbStory) {
  return {
    id:          s.id,
    showId:      s.show_id,
    title:       s.title,
    subtitle:    s.subtitle,
    coverImage:  s.cover_image,
    accentColor: s.accent_color,
    published:   s.published,
    sortOrder:   s.sort_order,
    views:       s.views,
    createdAt:   s.created_at,
    frames:      (s.story_frames ?? []).map(mapStoryFrame),
  };
}

export type MappedStoryFrame = ReturnType<typeof mapStoryFrame>;
export type MappedStory      = ReturnType<typeof mapStory>;