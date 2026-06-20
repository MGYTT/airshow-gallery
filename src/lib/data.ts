export interface AirShow {
  id: string;
  name: string;
  location: string;
  date: string;
  year: number;
  description: string;
  coverImage: string;
  photoCount: number;
  tags: string[];
  featured?: boolean;
}

export interface Photo {
  id:       string;
  showId:   string;
  src:      string;       // ← nie url!
  alt:      string;
  aircraft: string;
  width:    number;
  height:   number;
  featured?: boolean;     // ← dodaj to
}

export const airShows: AirShow[] = [
  {
    id: "radom-2024",
    name: "Air Show Radom",
    location: "Radom, Polska",
    date: "27–28 sierpień",
    year: 2024,
    description:
      "Największy pokaz lotniczy w Polsce. Akrobacje myśliwców F-16, przeloty historycznych maszyn oraz spektakularne pokazy zespołów akrobacyjnych z całej Europy.",
    coverImage: "https://picsum.photos/seed/radom-airshow/1200/700",
    photoCount: 48,
    tags: ["F-16", "Akrobacje", "Polska"],
    featured: true,
  },
  {
    id: "leszno-2024",
    name: "Leszno Air Show",
    location: "Leszno, Polska",
    date: "14–15 wrzesień",
    year: 2024,
    description:
      "Prestiżowy pokaz szybowcowy i sportowy. Mistrzowie świata w akrobacji lotniczej, pokazy szybowców i lekkich samolotów.",
    coverImage: "https://picsum.photos/seed/leszno-planes/1200/700",
    photoCount: 32,
    tags: ["Szybowce", "Akrobacje", "Sporty lotnicze"],
    featured: true,
  },
  {
    id: "riat-2024",
    name: "Royal International Air Tattoo",
    location: "RAF Fairford, Wielka Brytania",
    date: "19–21 lipiec",
    year: 2024,
    description:
      "Jeden z największych pokazów lotniczych na świecie. Setki samolotów wojskowych, pokazy Red Arrows i maszyn z całego globu.",
    coverImage: "https://picsum.photos/seed/riat-jets/1200/700",
    photoCount: 124,
    tags: ["NATO", "Myśliwce", "Wielka Brytania"],
    featured: false,
  },
  {
    id: "paris-2023",
    name: "Paris Air Show — Le Bourget",
    location: "Paryż, Francja",
    date: "19–25 czerwiec",
    year: 2023,
    description:
      "Prestiżowe targi lotnicze i pokazy w Le Bourget. Premiera Airbus A350F, akrobacje Rafale i wiele innych premier.",
    coverImage: "https://picsum.photos/seed/paris-airshow/1200/700",
    photoCount: 87,
    tags: ["Airbus", "Rafale", "Francja"],
    featured: false,
  },
  {
    id: "maks-2023",
    name: "MAKS Air Show",
    location: "Żukowski, Rosja",
    date: "archiwalne",
    year: 2023,
    description:
      "Archiwalne zdjęcia ze wschodnioeuropejskich pokazów. Akrobacje Su-30, MiG-29 oraz demonstracje cywilnych samolotów.",
    coverImage: "https://picsum.photos/seed/maks-mig/1200/700",
    photoCount: 55,
    tags: ["Sukhoi", "MiG", "Archiwum"],
    featured: false,
  },
  {
    id: "goraszka-2024",
    name: "Goraszka Air Picnic",
    location: "Goraszka, Polska",
    date: "13–14 lipiec",
    year: 2024,
    description:
      "Kameralny, rodzinny piknik lotniczy z pokazami akrobatycznymi, samolotami historycznymi i możliwością zwiedzania maszyn.",
    coverImage: "https://picsum.photos/seed/goraszka-picnic/1200/700",
    photoCount: 29,
    tags: ["Historyczne", "Rodzinny", "Polska"],
    featured: false,
  },
];

export const photos: Photo[] = [
  {
    id: "p1",
    showId: "radom-2024",
    src: "https://picsum.photos/seed/f16-radom1/900/600",
    alt: "F-16 Fighting Falcon w pełnym przeciążeniu nad Radomiem",
    aircraft: "F-16 Fighting Falcon",
    width: 900,
    height: 600,
  },
  {
    id: "p2",
    showId: "radom-2024",
    src: "https://picsum.photos/seed/display-team/900/600",
    alt: "Zespół akrobacyjny w formacji diamentowej",
    aircraft: "Zespół akrobacyjny — formacja",
    width: 900,
    height: 600,
  },
  {
    id: "p3",
    showId: "radom-2024",
    src: "https://picsum.photos/seed/smoke-trail/600/900",
    alt: "Barwne dymy na niebie podczas pokazu",
    aircraft: "Extra 330SC — Aerobatics",
    width: 600,
    height: 900,
  },
  {
    id: "p4",
    showId: "riat-2024",
    src: "https://picsum.photos/seed/typhoon-riat/900/600",
    alt: "Eurofighter Typhoon podczas dynamicznego pokazu",
    aircraft: "Eurofighter Typhoon",
    width: 900,
    height: 600,
  },
  {
    id: "p5",
    showId: "riat-2024",
    src: "https://picsum.photos/seed/redarrows/900/500",
    alt: "Red Arrows w formacji diamentowej z czerwonymi smugami",
    aircraft: "BAe Hawk T1 — Red Arrows",
    width: 900,
    height: 500,
  },
  {
    id: "p6",
    showId: "leszno-2024",
    src: "https://picsum.photos/seed/glider-leszno/900/600",
    alt: "Szybowiec w korkociągu nad lotniskiem w Lesznie",
    aircraft: "Szybowiec PW-6U",
    width: 900,
    height: 600,
  },
];

export function getShowById(id: string): AirShow | undefined {
  return airShows.find((s) => s.id === id);
}

export function getPhotosByShow(showId: string): Photo[] {
  return photos.filter((p) => p.showId === showId);
}