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
export type MappedStory = ReturnType<typeof mapStory>;

// ─────────────────────────────────────────────────────────────
// AIRSHOW CALENDAR — EVENTS
// ─────────────────────────────────────────────────────────────
export type AirshowEventStatus =
  | "scheduled"
  | "rescheduled"
  | "postponed"
  | "cancelled"
  | "completed";

export type AirshowEventType =
  | "military"
  | "civil"
  | "aerobatic"
  | "mixed"
  | "other";

export type AirshowAdmissionType =
  | "free"
  | "ticketed"
  | "registration_required"
  | "unknown";

export type AirshowLineupCategory =
  | "flying_display"
  | "static_display"
  | "team"
  | "ground_demo"
  | "other";

export type AirshowLineupStatus =
  | "confirmed"
  | "expected"
  | "unconfirmed"
  | "cancelled";

export interface AirshowPracticalInfo {
  tickets:       string;
  transport:     string;
  parking:       string;
  photography:   string;
  accessibility: string;
  notes:         string;
}

export interface AirshowFaqItem {
  question: string;
  answer:   string;
}

export interface DbAirshowEvent {
  id:                  string;
  slug:                string;
  name:                string;
  short_description:   string;
  long_description:    string;
  start_date:          string;
  end_date:            string | null;
  timezone:            string;
  country:             string;
  country_code:        string;
  city:                string;
  venue_name:          string;
  address:             string;
  latitude:            number | null;
  longitude:           number | null;
  status:              AirshowEventStatus;
  event_type:          AirshowEventType;
  admission_type:      AirshowAdmissionType;
  official_url:        string;
  tickets_url:         string;
  program_url:         string;
  parking_url:         string;
  directions_url:      string;
  cover_image:         string;
  image_alt:           string;
  practical_info:      AirshowPracticalInfo | null;
  faq:                 AirshowFaqItem[] | null;
  source_urls:         string[] | null;
  last_verified_at:    string | null;
  published_at:        string | null;
  featured:            boolean;
  published:           boolean;
  created_at:          string;
  updated_at:          string;
}

export interface DbAirshowEventLineup {
  id:          string;
  event_id:    string;
  title:       string;
  description: string;
  category:    AirshowLineupCategory;
  status:      AirshowLineupStatus;
  country:     string;
  start_time:  string | null;
  end_time:    string | null;
  source_url:  string;
  sort_order:  number;
  created_at:  string;
  updated_at:  string;
}

export interface DbAirshowEventUpdate {
  id:           string;
  event_id:     string;
  title:        string;
  content:      string;
  published_at: string;
  sort_order:   number;
  created_at:   string;
  updated_at:   string;
}

export interface DbAirshowEventShowLink {
  id:         string;
  event_id:   string;
  show_id:    string;
  label:      string;
  sort_order: number;
  created_at: string;
}

const EMPTY_PRACTICAL_INFO: AirshowPracticalInfo = {
  tickets:       "",
  transport:     "",
  parking:       "",
  photography:   "",
  accessibility: "",
  notes:         "",
};

function mapPracticalInfo(value: AirshowPracticalInfo | null | undefined): AirshowPracticalInfo {
  return {
    ...EMPTY_PRACTICAL_INFO,
    ...(value ?? {}),
  };
}

export function mapAirshowEvent(event: DbAirshowEvent) {
  return {
    id:                event.id,
    slug:              event.slug,
    name:              event.name,
    shortDescription:  event.short_description ?? "",
    longDescription:   event.long_description ?? "",
    startDate:         event.start_date,
    endDate:           event.end_date,
    timezone:          event.timezone,
    country:           event.country,
    countryCode:       event.country_code,
    city:              event.city,
    venueName:         event.venue_name ?? "",
    address:           event.address ?? "",
    latitude:          event.latitude,
    longitude:         event.longitude,
    status:            event.status,
    eventType:         event.event_type,
    admissionType:     event.admission_type,
    officialUrl:       event.official_url ?? "",
    ticketsUrl:        event.tickets_url ?? "",
    programUrl:        event.program_url ?? "",
    parkingUrl:        event.parking_url ?? "",
    directionsUrl:     event.directions_url ?? "",
    coverImage:        event.cover_image ?? "",
    imageAlt:          event.image_alt ?? "",
    practicalInfo:     mapPracticalInfo(event.practical_info),
    faq:               event.faq ?? [],
    sourceUrls:        event.source_urls ?? [],
    lastVerifiedAt:    event.last_verified_at,
    publishedAt:       event.published_at,
    featured:          event.featured,
    published:         event.published,
    createdAt:         event.created_at,
    updatedAt:         event.updated_at,
  };
}

export function mapAirshowEventLineup(item: DbAirshowEventLineup) {
  return {
    id:          item.id,
    eventId:     item.event_id,
    title:       item.title,
    description: item.description ?? "",
    category:    item.category,
    status:      item.status,
    country:     item.country ?? "",
    startTime:   item.start_time,
    endTime:     item.end_time,
    sourceUrl:   item.source_url ?? "",
    sortOrder:   item.sort_order,
    createdAt:   item.created_at,
    updatedAt:   item.updated_at,
  };
}

export function mapAirshowEventUpdate(item: DbAirshowEventUpdate) {
  return {
    id:          item.id,
    eventId:     item.event_id,
    title:       item.title,
    content:     item.content ?? "",
    publishedAt: item.published_at,
    sortOrder:   item.sort_order,
    createdAt:   item.created_at,
    updatedAt:   item.updated_at,
  };
}

export function mapAirshowEventShowLink(item: DbAirshowEventShowLink) {
  return {
    id:        item.id,
    eventId:   item.event_id,
    showId:    item.show_id,
    label:     item.label ?? "",
    sortOrder: item.sort_order,
    createdAt: item.created_at,
  };
}

export type MappedAirshowEvent = ReturnType<typeof mapAirshowEvent>;
export type MappedAirshowEventLineup = ReturnType<typeof mapAirshowEventLineup>;
export type MappedAirshowEventUpdate = ReturnType<typeof mapAirshowEventUpdate>;
export type MappedAirshowEventShowLink = ReturnType<typeof mapAirshowEventShowLink>;