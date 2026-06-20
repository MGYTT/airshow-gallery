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

// Mapowanie DB → frontend
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