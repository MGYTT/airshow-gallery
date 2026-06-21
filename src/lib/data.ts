// src/lib/data.ts
// ✅ Tylko typy i puste tablice — dane są w Supabase, nie tutaj!

export interface AirShow {
  id:          string;
  name:        string;
  location:    string;
  date:        string;
  year:        number;
  description: string;
  coverImage:  string;
  photoCount:  number;
  tags:        string[];
  featured?:   boolean;
  published?:  boolean;
}

export interface Photo {
  id:        string;
  showId:    string;
  src:       string;
  alt:       string;
  aircraft:  string;
  width:     number;
  height:    number;
  tags?:     string[];
  featured?: boolean;
}

// ✅ Puste — dane są w Supabase. Importy nie pękają, ale tablica jest pusta.
// Strony które jej używały (upload, admin) zostają przepisane na fetch z API.
export const airShows: AirShow[] = [];
export const photos:   Photo[]   = [];

export function getShowById(id: string): AirShow | undefined {
  return airShows.find((s) => s.id === id);
}

export function getPhotosByShow(showId: string): Photo[] {
  return photos.filter((p) => p.showId === showId);
}