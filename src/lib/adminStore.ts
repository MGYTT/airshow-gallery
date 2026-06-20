export interface AdminPhoto {
  id: string;
  showId: string;
  showName: string;
  url: string;
  alt: string;
  featured: boolean;
  tags: string[];
  uploadedAt: string;
  size: number;
}

export interface AdminShow {
  id: string;
  name: string;
  date: string;
  year: number;
  location: string;
  country: string;
  description: string;
  coverImage: string;
  featured: boolean;
  published: boolean;
  tags: string[];
  photoCount: number;
}

let _photos: AdminPhoto[] = [];
let _shows: AdminShow[] = [];

export const adminStore = {
  getPhotos: () => _photos,
  getShows: () => _shows,
  addPhoto: (photo: AdminPhoto) => {
    _photos = [photo, ..._photos];
  },
  updatePhoto: (id: string, patch: Partial<AdminPhoto>) => {
    _photos = _photos.map((p) => (p.id === id ? { ...p, ...patch } : p));
  },
  deletePhoto: (id: string) => {
    _photos = _photos.filter((p) => p.id !== id);
  },
  addShow: (show: AdminShow) => {
    _shows = [show, ..._shows];
  },
  updateShow: (id: string, patch: Partial<AdminShow>) => {
    _shows = _shows.map((s) => (s.id === id ? { ...s, ...patch } : s));
  },
  deleteShow: (id: string) => {
    _shows = _shows.filter((s) => s.id !== id);
    _photos = _photos.filter((p) => p.showId !== id);
  },
};