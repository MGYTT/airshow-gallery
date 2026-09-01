"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ExternalLink,
  FileText,
  Globe2,
  Image as ImageIcon,
  Info,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Star,
  Ticket,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type {
  AirshowAdmissionType,
  AirshowEventStatus,
  AirshowEventType,
  AirshowFaqItem,
  AirshowLineupCategory,
  AirshowLineupStatus,
  AirshowPracticalInfo,
  MappedAirshowEvent,
  MappedAirshowEventLineup,
  MappedAirshowEventShowLink,
  MappedAirshowEventUpdate,
} from "@/lib/supabase/types";

type EventTab = "basics" | "information" | "lineup" | "galleries" | "seo";

interface GalleryOption {
  id: string;
  name: string;
  year: number;
  location: string;
  coverImage: string;
  photoCount: number;
}

interface EventFormProps {
  mode: "create" | "edit";
  initialEvent?: MappedAirshowEvent;
}

interface EventFormState {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  startDate: string;
  endDate: string;
  timezone: string;
  country: string;
  countryCode: string;
  city: string;
  venueName: string;
  address: string;
  latitude: string;
  longitude: string;
  status: AirshowEventStatus;
  eventType: AirshowEventType;
  admissionType: AirshowAdmissionType;
  officialUrl: string;
  ticketsUrl: string;
  programUrl: string;
  parkingUrl: string;
  directionsUrl: string;
  coverImage: string;
  imageAlt: string;
  practicalInfo: AirshowPracticalInfo;
  faq: AirshowFaqItem[];
  sourceUrls: string[];
  lastVerifiedAt: string;
  featured: boolean;
  published: boolean;
}

interface LineupDraft {
  title: string;
  description: string;
  category: AirshowLineupCategory;
  status: AirshowLineupStatus;
  country: string;
  startTime: string;
  endTime: string;
  sourceUrl: string;
}

interface UpdateDraft {
  title: string;
  content: string;
  publishedAt: string;
}

interface GalleryDraft {
  showId: string;
  label: string;
}

const TABS: Array<{ id: EventTab; label: string; icon: typeof Info }> = [
  { id: "basics", label: "Podstawy", icon: Info },
  { id: "information", label: "Informacje", icon: Ticket },
  { id: "lineup", label: "Program", icon: CalendarDays },
  { id: "galleries", label: "Galerie", icon: ImageIcon },
  { id: "seo", label: "SEO i źródła", icon: Globe2 },
];

const COUNTRIES = [
  { name: "Polska", code: "PL" },
  { name: "Czechy", code: "CZ" },
  { name: "Słowacja", code: "SK" },
  { name: "Niemcy", code: "DE" },
  { name: "Austria", code: "AT" },
  { name: "Węgry", code: "HU" },
  { name: "Litwa", code: "LT" },
  { name: "Inne", code: "" },
];

const STATUS_OPTIONS: Array<{ value: AirshowEventStatus; label: string }> = [
  { value: "scheduled", label: "Zaplanowane" },
  { value: "rescheduled", label: "Zmieniony termin" },
  { value: "postponed", label: "Przełożone" },
  { value: "cancelled", label: "Odwołane" },
  { value: "completed", label: "Zakończone" },
];

const EVENT_TYPE_OPTIONS: Array<{ value: AirshowEventType; label: string }> = [
  { value: "mixed", label: "Mieszany / lotniczo-obronny" },
  { value: "military", label: "Wojskowy" },
  { value: "civil", label: "Cywilny" },
  { value: "aerobatic", label: "Akrobacyjny" },
  { value: "other", label: "Inny" },
];

const ADMISSION_OPTIONS: Array<{ value: AirshowAdmissionType; label: string }> = [
  { value: "unknown", label: "Brak potwierdzonej informacji" },
  { value: "free", label: "Wstęp bezpłatny" },
  { value: "ticketed", label: "Wstęp biletowany" },
  { value: "registration_required", label: "Wymagana rejestracja" },
];

const LINEUP_CATEGORY_OPTIONS: Array<{ value: AirshowLineupCategory; label: string }> = [
  { value: "flying_display", label: "Pokaz w powietrzu" },
  { value: "static_display", label: "Wystawa statyczna" },
  { value: "team", label: "Zespół / formacja" },
  { value: "ground_demo", label: "Demonstracja naziemna" },
  { value: "other", label: "Inne" },
];

const LINEUP_STATUS_OPTIONS: Array<{ value: AirshowLineupStatus; label: string }> = [
  { value: "confirmed", label: "Potwierdzone" },
  { value: "expected", label: "Oczekiwane" },
  { value: "unconfirmed", label: "Bez potwierdzenia" },
  { value: "cancelled", label: "Odwołane" },
];

function emptyPracticalInfo(): AirshowPracticalInfo {
  return {
    tickets: "",
    transport: "",
    parking: "",
    photography: "",
    accessibility: "",
    notes: "",
  };
}

function createInitialState(event?: MappedAirshowEvent): EventFormState {
  return {
    slug: event?.slug ?? "",
    name: event?.name ?? "",
    shortDescription: event?.shortDescription ?? "",
    longDescription: event?.longDescription ?? "",
    startDate: toDateTimeLocal(event?.startDate),
    endDate: toDateTimeLocal(event?.endDate),
    timezone: event?.timezone ?? "Europe/Warsaw",
    country: event?.country ?? "Polska",
    countryCode: event?.countryCode ?? "PL",
    city: event?.city ?? "",
    venueName: event?.venueName ?? "",
    address: event?.address ?? "",
    latitude: event?.latitude === null || event?.latitude === undefined ? "" : String(event.latitude),
    longitude: event?.longitude === null || event?.longitude === undefined ? "" : String(event.longitude),
    status: event?.status ?? "scheduled",
    eventType: event?.eventType ?? "mixed",
    admissionType: event?.admissionType ?? "unknown",
    officialUrl: event?.officialUrl ?? "",
    ticketsUrl: event?.ticketsUrl ?? "",
    programUrl: event?.programUrl ?? "",
    parkingUrl: event?.parkingUrl ?? "",
    directionsUrl: event?.directionsUrl ?? "",
    coverImage: event?.coverImage ?? "",
    imageAlt: event?.imageAlt ?? "",
    practicalInfo: {
      ...emptyPracticalInfo(),
      ...(event?.practicalInfo ?? {}),
    },
    faq: event?.faq ?? [],
    sourceUrls: event?.sourceUrls ?? [],
    lastVerifiedAt: toDateTimeLocal(event?.lastVerifiedAt),
    featured: event?.featured ?? false,
    published: event?.published ?? false,
  };
}

function emptyLineupDraft(): LineupDraft {
  return {
    title: "",
    description: "",
    category: "flying_display",
    status: "confirmed",
    country: "",
    startTime: "",
    endTime: "",
    sourceUrl: "",
  };
}

function emptyUpdateDraft(): UpdateDraft {
  return {
    title: "",
    content: "",
    publishedAt: toDateTimeLocal(new Date().toISOString()),
  };
}

function emptyGalleryDraft(): GalleryDraft {
  return {
    showId: "",
    label: "",
  };
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "")
    .slice(0, 90);
}

function getApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const message = (payload as { error?: unknown }).error;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Brak daty";

  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusStyle(status: AirshowLineupStatus) {
  const map: Record<AirshowLineupStatus, { color: string; bg: string }> = {
    confirmed: { color: "#16a34a", bg: "rgba(22,163,74,.10)" },
    expected: { color: "var(--color-gold)", bg: "var(--color-gold-subtle)" },
    unconfirmed: { color: "var(--color-text-muted)", bg: "var(--color-surface-offset)" },
    cancelled: { color: "#dc2626", bg: "rgba(220,38,38,.10)" },
  };

  return map[status];
}

export default function EventForm({ mode, initialEvent }: EventFormProps) {
  const isEdit = mode === "edit";
  const eventId = initialEvent?.id;

  const [activeTab, setActiveTab] = useState<EventTab>("basics");
  const [form, setForm] = useState<EventFormState>(() => createInitialState(initialEvent));
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialEvent?.slug));
  const [saving, setSaving] = useState(false);
  const [loadingRelated, setLoadingRelated] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [lineup, setLineup] = useState<MappedAirshowEventLineup[]>([]);
  const [updates, setUpdates] = useState<MappedAirshowEventUpdate[]>([]);
  const [galleryLinks, setGalleryLinks] = useState<MappedAirshowEventShowLink[]>([]);
  const [galleries, setGalleries] = useState<GalleryOption[]>([]);

  const [lineupDraft, setLineupDraft] = useState<LineupDraft>(emptyLineupDraft);
  const [updateDraft, setUpdateDraft] = useState<UpdateDraft>(emptyUpdateDraft);
  const [galleryDraft, setGalleryDraft] = useState<GalleryDraft>(emptyGalleryDraft);
  const [sourceDraft, setSourceDraft] = useState("");
  const [faqDraft, setFaqDraft] = useState<AirshowFaqItem>({ question: "", answer: "" });

  const [busyAction, setBusyAction] = useState<string | null>(null);

  const publicUrl = form.slug ? `/airshow/${form.slug}` : "/airshow/twoj-slug";

  const remainingGalleryOptions = useMemo(() => {
    const linkedShowIds = new Set(galleryLinks.map((link) => link.showId));
    return galleries.filter((gallery) => !linkedShowIds.has(gallery.id));
  }, [galleries, galleryLinks]);

  const linkedGalleryDetails = useMemo(() => {
    const galleryMap = new Map(galleries.map((gallery) => [gallery.id, gallery]));

    return galleryLinks.map((link) => ({
      link,
      gallery: galleryMap.get(link.showId),
    }));
  }, [galleryLinks, galleries]);

  useEffect(() => {
    if (!isEdit || !eventId) {
      setLoadingRelated(false);
      return;
    }

    async function loadRelatedData() {
      setLoadingRelated(true);
      setError(null);

      try {
        const [lineupResponse, updatesResponse, linksResponse, galleriesResponse] = await Promise.all([
          fetch(`/api/events/${eventId}/lineup?all=true`),
          fetch(`/api/events/${eventId}/updates?all=true`),
          fetch(`/api/events/${eventId}/links?all=true`),
          fetch("/api/shows?all=true"),
        ]);

        const responses = [lineupResponse, updatesResponse, linksResponse, galleriesResponse];
        const unauthenticated = responses.some((response) => response.status === 401);

        if (unauthenticated) {
          window.location.href = `/admin/login?redirect=/admin/calendar/${eventId}`;
          return;
        }

        for (const response of responses) {
          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            throw new Error(getApiError(payload, `Nie udało się pobrać danych (HTTP ${response.status}).`));
          }
        }

        const [lineupData, updatesData, linksData, galleriesData] = await Promise.all([
          lineupResponse.json(),
          updatesResponse.json(),
          linksResponse.json(),
          galleriesResponse.json(),
        ]);

        setLineup(lineupData as MappedAirshowEventLineup[]);
        setUpdates(updatesData as MappedAirshowEventUpdate[]);
        setGalleryLinks(linksData as MappedAirshowEventShowLink[]);

        const mappedGalleries = (galleriesData as Array<Record<string, unknown>>).map((gallery) => ({
          id: String(gallery.id ?? ""),
          name: String(gallery.name ?? ""),
          year: Number(gallery.year ?? 0),
          location: String(gallery.location ?? ""),
          coverImage: String(gallery.coverImage ?? ""),
          photoCount: Number(gallery.photoCount ?? 0),
        }));

        setGalleries(mappedGalleries.filter((gallery) => gallery.id && gallery.name));
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));
      } finally {
        setLoadingRelated(false);
      }
    }

    loadRelatedData();
  }, [eventId, isEdit]);

  function updateForm<K extends keyof EventFormState>(key: K, value: EventFormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function handleNameChange(value: string) {
    setForm((previous) => ({
      ...previous,
      name: value,
      slug: slugManuallyEdited ? previous.slug : slugify(value),
    }));
  }

  function handleCountryChange(countryName: string) {
    const selected = COUNTRIES.find((country) => country.name === countryName);

    setForm((previous) => ({
      ...previous,
      country: countryName,
      countryCode: selected?.code ?? previous.countryCode,
    }));
  }

  function updatePracticalInfo<K extends keyof AirshowPracticalInfo>(
    key: K,
    value: AirshowPracticalInfo[K]
  ) {
    setForm((previous) => ({
      ...previous,
      practicalInfo: {
        ...previous.practicalInfo,
        [key]: value,
      },
    }));
  }

  function buildPayload() {
    return {
      slug: form.slug,
      name: form.name,
      shortDescription: form.shortDescription,
      longDescription: form.longDescription,
      startDate: form.startDate,
      endDate: form.endDate || null,
      timezone: form.timezone,
      country: form.country,
      countryCode: form.countryCode,
      city: form.city,
      venueName: form.venueName,
      address: form.address,
      latitude: form.latitude || null,
      longitude: form.longitude || null,
      status: form.status,
      eventType: form.eventType,
      admissionType: form.admissionType,
      officialUrl: form.officialUrl,
      ticketsUrl: form.ticketsUrl,
      programUrl: form.programUrl,
      parkingUrl: form.parkingUrl,
      directionsUrl: form.directionsUrl,
      coverImage: form.coverImage,
      imageAlt: form.imageAlt,
      practicalInfo: form.practicalInfo,
      faq: form.faq,
      sourceUrls: form.sourceUrls,
      lastVerifiedAt: form.lastVerifiedAt || null,
      featured: form.featured,
      published: form.published,
    };
  }

  function validateClientSide() {
    if (!form.name.trim()) return "Podaj nazwę wydarzenia.";
    if (!form.startDate) return "Podaj datę rozpoczęcia wydarzenia.";
    if (!form.country.trim()) return "Podaj kraj wydarzenia.";
    if (!form.countryCode.trim()) return "Podaj dwuliterowy kod kraju, np. PL, CZ lub SK.";
    if (!form.city.trim()) return "Podaj miasto wydarzenia.";

    if (form.endDate && new Date(form.endDate).getTime() < new Date(form.startDate).getTime()) {
      return "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.";
    }

    return null;
  }

  async function saveEvent() {
    const validationError = validateClientSide();

    if (validationError) {
      setError(validationError);
      setActiveTab("basics");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(isEdit && eventId ? `/api/events/${eventId}` : "/api/events", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getApiError(payload, `Nie udało się zapisać wydarzenia (HTTP ${response.status}).`));
      }

      const savedEvent = payload as MappedAirshowEvent;

      if (!isEdit) {
        window.location.href = `/admin/calendar/${savedEvent.id}`;
        return;
      }

      setForm(createInitialState(savedEvent));
      setSlugManuallyEdited(true);
      setNotice("Zmiany w wydarzeniu zostały zapisane.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setSaving(false);
    }
  }

  async function addLineupItem() {
    if (!eventId) {
      setError("Najpierw zapisz podstawowe dane wydarzenia, aby dodać program.");
      return;
    }

    if (!lineupDraft.title.trim()) {
      setError("Podaj nazwę pozycji programu.");
      return;
    }

    setBusyAction("add-lineup");
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/events/${eventId}/lineup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lineupDraft,
          sortOrder: lineup.length,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getApiError(payload, "Nie udało się dodać pozycji programu."));
      }

      setLineup((previous) => [...previous, payload as MappedAirshowEventLineup]);
      setLineupDraft(emptyLineupDraft());
      setNotice("Dodano pozycję programu.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteLineupItem(itemId: string) {
    if (!eventId) return;

    setBusyAction(`delete-lineup-${itemId}`);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/lineup/${itemId}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getApiError(payload, "Nie udało się usunąć pozycji programu."));
      }

      setLineup((previous) => previous.filter((item) => item.id !== itemId));
      setNotice("Usunięto pozycję programu.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setBusyAction(null);
    }
  }

  async function addUpdate() {
    if (!eventId) {
      setError("Najpierw zapisz podstawowe dane wydarzenia, aby dodać aktualizację.");
      return;
    }

    if (!updateDraft.title.trim()) {
      setError("Podaj tytuł aktualizacji.");
      return;
    }

    setBusyAction("add-update");
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/events/${eventId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updateDraft,
          sortOrder: updates.length,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getApiError(payload, "Nie udało się dodać aktualizacji."));
      }

      setUpdates((previous) => [payload as MappedAirshowEventUpdate, ...previous]);
      setUpdateDraft(emptyUpdateDraft());
      setNotice("Dodano aktualizację do dziennika.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteUpdate(updateId: string) {
    if (!eventId) return;

    setBusyAction(`delete-update-${updateId}`);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/updates/${updateId}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getApiError(payload, "Nie udało się usunąć aktualizacji."));
      }

      setUpdates((previous) => previous.filter((item) => item.id !== updateId));
      setNotice("Usunięto aktualizację.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setBusyAction(null);
    }
  }

  async function addGalleryLink() {
    if (!eventId) {
      setError("Najpierw zapisz podstawowe dane wydarzenia, aby dodać galerię.");
      return;
    }

    if (!galleryDraft.showId) {
      setError("Wybierz galerię do powiązania.");
      return;
    }

    setBusyAction("add-gallery");
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/events/${eventId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId: galleryDraft.showId,
          label: galleryDraft.label,
          sortOrder: galleryLinks.length,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getApiError(payload, "Nie udało się powiązać galerii."));
      }

      setGalleryLinks((previous) => [...previous, payload as MappedAirshowEventShowLink]);
      setGalleryDraft(emptyGalleryDraft());
      setNotice("Galeria została powiązana z wydarzeniem.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteGalleryLink(linkId: string) {
    if (!eventId) return;

    setBusyAction(`delete-gallery-${linkId}`);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/links/${linkId}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getApiError(payload, "Nie udało się usunąć powiązania galerii."));
      }

      setGalleryLinks((previous) => previous.filter((item) => item.id !== linkId));
      setNotice("Usunięto powiązanie galerii.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setBusyAction(null);
    }
  }

  function addFaq() {
    const question = faqDraft.question.trim();
    const answer = faqDraft.answer.trim();

    if (!question || !answer) {
      setError("Uzupełnij zarówno pytanie, jak i odpowiedź FAQ.");
      return;
    }

    setForm((previous) => ({
      ...previous,
      faq: [...previous.faq, { question, answer }],
    }));

    setFaqDraft({ question: "", answer: "" });
    setNotice("Dodano pytanie FAQ. Zapisz wydarzenie, aby je opublikować.");
  }

  function removeFaq(index: number) {
    setForm((previous) => ({
      ...previous,
      faq: previous.faq.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function addSource() {
    const source = sourceDraft.trim();

    if (!source) {
      setError("Wklej adres źródła.");
      return;
    }

    try {
      const url = new URL(source);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error();
      }
    } catch {
      setError("Wklej poprawny adres URL rozpoczynający się od http:// lub https://.");
      return;
    }

    setForm((previous) => ({
      ...previous,
      sourceUrls: [...new Set([...previous.sourceUrls, source])],
    }));

    setSourceDraft("");
    setNotice("Dodano źródło. Zapisz wydarzenie, aby je zachować.");
  }

  function removeSource(source: string) {
    setForm((previous) => ({
      ...previous,
      sourceUrls: previous.sourceUrls.filter((item) => item !== source),
    }));
  }

  return (
    <>
      <style>{`
        @keyframes event-form-spin{to{transform:rotate(360deg)}}
        .event-form-page{max-width:1120px;margin:0 auto;padding-bottom:var(--space-12)}
        .event-form-header{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-5);flex-wrap:wrap;margin-bottom:var(--space-6)}
        .event-form-tabs{display:flex;gap:var(--space-2);overflow-x:auto;padding-bottom:var(--space-2);border-bottom:1px solid var(--color-divider);margin-bottom:var(--space-6)}
        .event-form-tab{min-height:42px;display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-4);border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:700;color:var(--color-text-muted);white-space:nowrap}
        .event-form-tab:hover{background:var(--color-surface-offset);color:var(--color-text)}
        .event-form-tab.active{background:var(--color-accent-subtle);color:var(--color-accent)}
        .event-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-5)}
        .event-form-grid--three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--space-5)}
        .event-form-section{padding:var(--space-6);background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-xl);margin-bottom:var(--space-5)}
        .event-form-section-title{display:flex;align-items:center;gap:var(--space-2);font-family:var(--font-display);font-size:var(--text-lg);font-weight:900;letter-spacing:-.02em;margin-bottom:var(--space-2)}
        .event-form-section-copy{font-size:var(--text-sm);color:var(--color-text-muted);line-height:1.6;margin-bottom:var(--space-6)}
        .event-form-field label{display:block;font-size:var(--text-xs);font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--color-text-faint);margin-bottom:var(--space-2)}
        .event-form-field small{display:block;font-size:var(--text-xs);color:var(--color-text-faint);line-height:1.45;margin-top:var(--space-2)}
        .event-form-select{width:100%;min-height:46px;padding:var(--space-3) var(--space-4);border-radius:var(--radius-md);border:1.5px solid var(--color-border-strong);background:var(--color-surface);color:var(--color-text);font-size:var(--text-sm)}
        .event-form-select:focus{outline:none;border-color:var(--color-accent);box-shadow:var(--focus-ring)}
        .event-form-textarea{min-height:132px;resize:vertical;line-height:1.65}
        .event-form-mini-textarea{min-height:88px;resize:vertical;line-height:1.6}
        .event-form-callout{display:flex;gap:var(--space-3);padding:var(--space-4);border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface-offset);font-size:var(--text-sm);color:var(--color-text-muted);line-height:1.6}
        .event-form-toggle{display:flex;align-items:center;justify-content:space-between;gap:var(--space-4);padding:var(--space-4);border-radius:var(--radius-lg);border:1px solid var(--color-border);background:var(--color-surface-offset)}
        .event-form-toggle input{width:44px;height:24px;appearance:none;border-radius:var(--radius-full);background:var(--color-surface-dynamic);position:relative;cursor:pointer;transition:background var(--transition);flex-shrink:0}
        .event-form-toggle input::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform var(--transition)}
        .event-form-toggle input:checked{background:var(--color-accent)}
        .event-form-toggle input:checked::after{transform:translateX(20px)}
        .event-form-list{display:flex;flex-direction:column;gap:var(--space-3)}
        .event-form-list-item{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-4);padding:var(--space-4);border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface-offset)}
        .event-form-item-actions{display:flex;align-items:center;gap:var(--space-2);flex-shrink:0}
        .event-form-danger{width:36px;height:36px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:#dc2626;border:1px solid rgba(220,38,38,.25);background:rgba(220,38,38,.06)}
        .event-form-danger:hover{background:rgba(220,38,38,.14)}
        .event-form-add-box{padding:var(--space-5);border:1px dashed var(--color-border-strong);border-radius:var(--radius-xl);background:color-mix(in srgb,var(--color-surface-offset) 60%,transparent)}
        .event-form-compact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-3)}
        .event-form-url-preview{display:flex;align-items:center;gap:var(--space-2);padding:var(--space-3) var(--space-4);background:var(--color-surface-offset);border:1px solid var(--color-border);border-radius:var(--radius-md);font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted);overflow:hidden}
        .event-form-url-preview span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .event-form-footer{position:sticky;bottom:var(--space-4);z-index:5;display:flex;align-items:center;justify-content:space-between;gap:var(--space-4);padding:var(--space-4);background:color-mix(in srgb,var(--color-bg) 92%,transparent);backdrop-filter:blur(12px);border:1px solid var(--color-border);border-radius:var(--radius-xl);box-shadow:var(--shadow-lg);margin-top:var(--space-6)}
        .event-form-empty{padding:var(--space-12) var(--space-6);text-align:center;border:1px dashed var(--color-border-strong);border-radius:var(--radius-xl);color:var(--color-text-muted)}
        @media(max-width:800px){
          .event-form-grid,.event-form-grid--three{grid-template-columns:1fr}
          .event-form-compact-grid{grid-template-columns:1fr}
          .event-form-section{padding:var(--space-5)}
          .event-form-footer{position:static;align-items:stretch;flex-direction:column}
          .event-form-footer > div{width:100%}
          .event-form-footer .btn{width:100%}
        }
        @media(max-width:520px){
          .event-form-list-item{flex-direction:column}
          .event-form-item-actions{width:100%;justify-content:flex-end}
        }
      `}</style>

      <div className="event-form-page">
        <div className="event-form-header">
          <div>
            <Link href="/admin/calendar" style={{ display:"inline-flex", alignItems:"center", gap:"var(--space-2)", fontSize:"var(--text-xs)", fontWeight:700, color:"var(--color-text-muted)", marginBottom:"var(--space-4)" }}>
              <ChevronLeft size={14}/> Wróć do kalendarza
            </Link>

            <span className="badge" style={{ marginBottom:"var(--space-3)" }}>
              <CalendarDays size={12}/> Kalendarz SEO
            </span>

            <h1 style={{ fontFamily:"var(--font-display)", fontSize:"var(--text-xl)", fontWeight:900, letterSpacing:"-.03em", marginBottom:"var(--space-2)" }}>
              {isEdit ? "Edytuj wydarzenie" : "Dodaj wydarzenie"}
            </h1>

            <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)", maxWidth:700 }}>
              {isEdit
                ? "Utrzymuj dane aktualne: termin, program, bilety, dojazd, źródła i informacje dla odwiedzających."
                : "Najpierw zapisz podstawowe dane. Po utworzeniu wydarzenia dodasz program, aktualizacje i swoje galerie."}
            </p>
          </div>

          {isEdit && form.published && (
            <Link href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              <ExternalLink size={15}/> Zobacz stronę
            </Link>
          )}
        </div>

        {error && (
          <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", padding:"var(--space-4)", borderRadius:"var(--radius-lg)", background:"rgba(220,38,38,.08)", border:"1px solid rgba(220,38,38,.28)", color:"#dc2626", fontSize:"var(--text-sm)", fontWeight:600, marginBottom:"var(--space-5)" }}>
            <AlertCircle size={17}/>
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Zamknij komunikat" style={{ marginLeft:"auto", padding:"var(--space-1)", color:"inherit", display:"flex" }}>
              <X size={15}/>
            </button>
          </div>
        )}

        {notice && (
          <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", padding:"var(--space-4)", borderRadius:"var(--radius-lg)", background:"rgba(22,163,74,.08)", border:"1px solid rgba(22,163,74,.28)", color:"#16a34a", fontSize:"var(--text-sm)", fontWeight:600, marginBottom:"var(--space-5)" }}>
            <Check size={17}/>
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} aria-label="Zamknij komunikat" style={{ marginLeft:"auto", padding:"var(--space-1)", color:"inherit", display:"flex" }}>
              <X size={15}/>
            </button>
          </div>
        )}

        <nav className="event-form-tabs" aria-label="Sekcje formularza wydarzenia">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`event-form-tab ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={15}/> {label}
            </button>
          ))}
        </nav>

        {activeTab === "basics" && (
          <>
            <section className="event-form-section">
              <h2 className="event-form-section-title"><Info size={19} color="var(--color-accent)"/> Podstawowe dane wydarzenia</h2>
              <p className="event-form-section-copy">
                Te informacje budują adres, nagłówek strony oraz podstawowy kontekst wydarzenia dla użytkowników i wyszukiwarki.
              </p>

              <div className="event-form-grid">
                <div className="event-form-field">
                  <label htmlFor="event-name">Nazwa wydarzenia *</label>
                  <input id="event-name" className="input" value={form.name} onChange={(event) => handleNameChange(event.target.value)} placeholder="np. NATO Days in Ostrava & Czech Air Force Days 2026" />
                </div>

                <div className="event-form-field">
                  <label htmlFor="event-slug">Adres wydarzenia (slug) *</label>
                  <input
                    id="event-slug"
                    className="input"
                    value={form.slug}
                    onChange={(event) => {
                      setSlugManuallyEdited(true);
                      updateForm("slug", slugify(event.target.value));
                    }}
                    placeholder="np. nato-days-2026"
                  />
                  <small>Małe litery, cyfry i myślniki. Adres nie powinien zmieniać się po publikacji bez ważnego powodu.</small>
                </div>
              </div>

              <div className="event-form-url-preview" style={{ marginTop:"var(--space-4)" }}>
                <Link2 size={14} style={{ color:"var(--color-accent)", flexShrink:0 }}/>
                <span>{publicUrl}</span>
              </div>

              <div className="event-form-grid" style={{ marginTop:"var(--space-5)" }}>
                <div className="event-form-field">
                  <label htmlFor="event-short-description">Krótki opis</label>
                  <textarea id="event-short-description" className="input event-form-mini-textarea" value={form.shortDescription} onChange={(event) => updateForm("shortDescription", event.target.value)} placeholder="Krótki opis widoczny na karcie w kalendarzu." maxLength={500} />
                  <small>{form.shortDescription.length}/500 znaków. Napisz konkretnie: czym jest wydarzenie i dla kogo.</small>
                </div>

                <div className="event-form-field">
                  <label htmlFor="event-long-description">Pełny opis</label>
                  <textarea id="event-long-description" className="input event-form-mini-textarea" value={form.longDescription} onChange={(event) => updateForm("longDescription", event.target.value)} placeholder="Unikalny opis wydarzenia: charakter imprezy, czego można się spodziewać i dlaczego warto przyjechać." maxLength={15000} />
                  <small>{form.longDescription.length}/15 000 znaków. Unikaj kopiowania całych opisów organizatora.</small>
                </div>
              </div>
            </section>

            <section className="event-form-section">
              <h2 className="event-form-section-title"><CalendarDays size={19} color="var(--color-accent)"/> Termin i status</h2>

              <div className="event-form-grid--three">
                <div className="event-form-field">
                  <label htmlFor="event-start-date">Rozpoczęcie *</label>
                  <input id="event-start-date" type="datetime-local" className="input" value={form.startDate} onChange={(event) => updateForm("startDate", event.target.value)} />
                </div>

                <div className="event-form-field">
                  <label htmlFor="event-end-date">Zakończenie</label>
                  <input id="event-end-date" type="datetime-local" className="input" value={form.endDate} onChange={(event) => updateForm("endDate", event.target.value)} />
                </div>

                <div className="event-form-field">
                  <label htmlFor="event-timezone">Strefa czasowa</label>
                  <input id="event-timezone" className="input" value={form.timezone} onChange={(event) => updateForm("timezone", event.target.value)} placeholder="Europe/Warsaw" />
                </div>
              </div>

              <div className="event-form-grid" style={{ marginTop:"var(--space-5)" }}>
                <div className="event-form-field">
                  <label htmlFor="event-status">Status wydarzenia</label>
                  <select id="event-status" className="event-form-select" value={form.status} onChange={(event) => updateForm("status", event.target.value as AirshowEventStatus)}>
                    {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>

                <div className="event-form-field">
                  <label htmlFor="event-type">Typ wydarzenia</label>
                  <select id="event-type" className="event-form-select" value={form.eventType} onChange={(event) => updateForm("eventType", event.target.value as AirshowEventType)}>
                    {EVENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="event-form-section">
              <h2 className="event-form-section-title"><MapPin size={19} color="var(--color-accent)"/> Lokalizacja</h2>

              <div className="event-form-grid--three">
                <div className="event-form-field">
                  <label htmlFor="event-country">Kraj *</label>
                  <select id="event-country" className="event-form-select" value={form.country} onChange={(event) => handleCountryChange(event.target.value)}>
                    {COUNTRIES.map((country) => <option key={country.name} value={country.name}>{country.name}</option>)}
                  </select>
                </div>

                <div className="event-form-field">
                  <label htmlFor="event-country-code">Kod kraju *</label>
                  <input id="event-country-code" className="input" value={form.countryCode} onChange={(event) => updateForm("countryCode", event.target.value.toUpperCase().slice(0, 2))} placeholder="PL" maxLength={2} />
                </div>

                <div className="event-form-field">
                  <label htmlFor="event-city">Miasto *</label>
                  <input id="event-city" className="input" value={form.city} onChange={(event) => updateForm("city", event.target.value)} placeholder="np. Ostrava" />
                </div>
              </div>

              <div className="event-form-grid" style={{ marginTop:"var(--space-5)" }}>
                <div className="event-form-field">
                  <label htmlFor="event-venue">Miejsce / lotnisko</label>
                  <input id="event-venue" className="input" value={form.venueName} onChange={(event) => updateForm("venueName", event.target.value)} placeholder="np. Letiště Leoše Janáčka Ostrava" />
                </div>

                <div className="event-form-field">
                  <label htmlFor="event-address">Adres</label>
                  <input id="event-address" className="input" value={form.address} onChange={(event) => updateForm("address", event.target.value)} placeholder="np. Mošnov, Czechy" />
                </div>
              </div>

              <div className="event-form-grid" style={{ marginTop:"var(--space-5)" }}>
                <div className="event-form-field">
                  <label htmlFor="event-latitude">Szerokość geograficzna</label>
                  <input id="event-latitude" type="number" step="0.000001" className="input" value={form.latitude} onChange={(event) => updateForm("latitude", event.target.value)} placeholder="49.696000" />
                </div>

                <div className="event-form-field">
                  <label htmlFor="event-longitude">Długość geograficzna</label>
                  <input id="event-longitude" type="number" step="0.000001" className="input" value={form.longitude} onChange={(event) => updateForm("longitude", event.target.value)} placeholder="18.111000" />
                </div>
              </div>
            </section>

            <section className="event-form-section">
              <h2 className="event-form-section-title"><ImageIcon size={19} color="var(--color-accent)"/> Obraz okładkowy</h2>

              <div className="event-form-grid">
                <div className="event-form-field">
                  <label htmlFor="event-cover-image">Adres obrazu okładkowego</label>
                  <input id="event-cover-image" className="input" type="url" value={form.coverImage} onChange={(event) => updateForm("coverImage", event.target.value)} placeholder="https://…" />
                  <small>Używaj wyłącznie zdjęć, do których masz prawa albo materiałów udostępnionych przez organizatora z odpowiednią licencją.</small>
                </div>

                <div className="event-form-field">
                  <label htmlFor="event-image-alt">Opis obrazu (alt)</label>
                  <input id="event-image-alt" className="input" value={form.imageAlt} onChange={(event) => updateForm("imageAlt", event.target.value)} placeholder="np. F-16 podczas NATO Days w Ostrawie" maxLength={300} />
                </div>
              </div>

              {form.coverImage && (
                <div style={{ position:"relative", marginTop:"var(--space-5)", aspectRatio:"16 / 7", maxWidth:720, overflow:"hidden", borderRadius:"var(--radius-lg)", background:"var(--color-surface-offset)", border:"1px solid var(--color-border)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.coverImage} alt={form.imageAlt || "Podgląd obrazu okładkowego"} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={(event) => { event.currentTarget.style.display = "none"; }} />
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "information" && (
          <>
            <section className="event-form-section">
              <h2 className="event-form-section-title"><Ticket size={19} color="var(--color-accent)"/> Linki i wejście</h2>
              <p className="event-form-section-copy">
                Te linki stają się praktycznymi CTA na stronie wydarzenia. Dodawaj przede wszystkim oficjalne źródła organizatora.
              </p>

              <div className="event-form-grid">
                <div className="event-form-field">
                  <label htmlFor="event-admission">Sposób wejścia</label>
                  <select id="event-admission" className="event-form-select" value={form.admissionType} onChange={(event) => updateForm("admissionType", event.target.value as AirshowAdmissionType)}>
                    {ADMISSION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>

                <div className="event-form-field">
                  <label htmlFor="event-official-url">Oficjalna strona wydarzenia</label>
                  <input id="event-official-url" className="input" type="url" value={form.officialUrl} onChange={(event) => updateForm("officialUrl", event.target.value)} placeholder="https://…" />
                </div>
              </div>

              <div className="event-form-grid" style={{ marginTop:"var(--space-5)" }}>
                <div className="event-form-field">
                  <label htmlFor="event-tickets-url">Link do biletów</label>
                  <input id="event-tickets-url" className="input" type="url" value={form.ticketsUrl} onChange={(event) => updateForm("ticketsUrl", event.target.value)} placeholder="https://…" />
                </div>

                <div className="event-form-field">
                  <label htmlFor="event-program-url">Oficjalny program</label>
                  <input id="event-program-url" className="input" type="url" value={form.programUrl} onChange={(event) => updateForm("programUrl", event.target.value)} placeholder="https://…" />
                </div>
              </div>

              <div className="event-form-grid" style={{ marginTop:"var(--space-5)" }}>
                <div className="event-form-field">
                  <label htmlFor="event-parking-url">Link do parkingu</label>
                  <input id="event-parking-url" className="input" type="url" value={form.parkingUrl} onChange={(event) => updateForm("parkingUrl", event.target.value)} placeholder="https://…" />
                </div>

                <div className="event-form-field">
                  <label htmlFor="event-directions-url">Link do dojazdu / mapy</label>
                  <input id="event-directions-url" className="input" type="url" value={form.directionsUrl} onChange={(event) => updateForm("directionsUrl", event.target.value)} placeholder="https://www.google.com/maps/…" />
                </div>
              </div>
            </section>

            <section className="event-form-section">
              <h2 className="event-form-section-title"><FileText size={19} color="var(--color-accent)"/> Informacje dla odwiedzających</h2>
              <p className="event-form-section-copy">
                To jest najważniejsza część dla użyteczności i ruchu z wyszukiwania. Pisz własnymi słowami, aktualizuj po komunikatach organizatora i nie przedstawiaj przypuszczeń jako faktów.
              </p>

              <div className="event-form-grid">
                <div className="event-form-field">
                  <label htmlFor="practical-tickets">Bilety i wejście</label>
                  <textarea id="practical-tickets" className="input event-form-textarea" value={form.practicalInfo.tickets} onChange={(event) => updatePracticalInfo("tickets", event.target.value)} placeholder="Informacje o cenach, wstępie, bramkach, rejestracji i oficjalnym linku." />
                </div>

                <div className="event-form-field">
                  <label htmlFor="practical-transport">Dojazd i transport</label>
                  <textarea id="practical-transport" className="input event-form-textarea" value={form.practicalInfo.transport} onChange={(event) => updatePracticalInfo("transport", event.target.value)} placeholder="Samochód, pociąg, autobus, transfer, wskazówki dla osób jadących z Polski." />
                </div>
              </div>

              <div className="event-form-grid" style={{ marginTop:"var(--space-5)" }}>
                <div className="event-form-field">
                  <label htmlFor="practical-parking">Parking</label>
                  <textarea id="practical-parking" className="input event-form-textarea" value={form.practicalInfo.parking} onChange={(event) => updatePracticalInfo("parking", event.target.value)} placeholder="Lokalizacja, opłaty, park-and-ride, ograniczenia i źródło informacji." />
                </div>

                <div className="event-form-field">
                  <label htmlFor="practical-photography">Informacje dla fotografów</label>
                  <textarea id="practical-photography" className="input event-form-textarea" value={form.practicalInfo.photography} onChange={(event) => updatePracticalInfo("photography", event.target.value)} placeholder="Zasady organizatora, wejście z aparatem, praktyczne wskazówki — bez niepotwierdzonych obietnic." />
                </div>
              </div>

              <div className="event-form-grid" style={{ marginTop:"var(--space-5)" }}>
                <div className="event-form-field">
                  <label htmlFor="practical-accessibility">Dostępność i udogodnienia</label>
                  <textarea id="practical-accessibility" className="input event-form-textarea" value={form.practicalInfo.accessibility} onChange={(event) => updatePracticalInfo("accessibility", event.target.value)} placeholder="Informacje dla rodzin, osób z ograniczoną mobilnością, toalety, strefy i nawierzchnia." />
                </div>

                <div className="event-form-field">
                  <label htmlFor="practical-notes">Dodatkowe uwagi</label>
                  <textarea id="practical-notes" className="input event-form-textarea" value={form.practicalInfo.notes} onChange={(event) => updatePracticalInfo("notes", event.target.value)} placeholder="Ważne komunikaty, zasady bezpieczeństwa, pogoda, rekomendacje organizacyjne." />
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "lineup" && (
          <>
            {!isEdit && (
              <div className="event-form-callout" style={{ marginBottom:"var(--space-5)" }}>
                <Info size={18} color="var(--color-accent)" style={{ flexShrink:0, marginTop:2 }}/>
                <span>Najpierw zapisz wydarzenie w zakładce „Podstawy”. Po utworzeniu wpisu wrócisz tutaj i dodasz program oraz dziennik aktualizacji.</span>
              </div>
            )}

            <section className="event-form-section">
              <h2 className="event-form-section-title"><PlaneIcon/> Co zobaczymy?</h2>
              <p className="event-form-section-copy">
                Dodawaj tylko fakty potwierdzone przez organizatora jako „Potwierdzone”. Możesz zaznaczyć element jako „Oczekiwany” lub „Bez potwierdzenia”, ale publiczna strona wyraźnie to oznaczy.
              </p>

              {loadingRelated ? (
                <div className="event-form-empty"><Loader2 size={24} style={{ margin:"0 auto var(--space-3)", animation:"event-form-spin 1s linear infinite" }}/> Ładowanie programu…</div>
              ) : lineup.length > 0 ? (
                <div className="event-form-list" style={{ marginBottom:"var(--space-6)" }}>
                  {lineup.map((item) => {
                    const style = statusStyle(item.status);

                    return (
                      <article key={item.id} className="event-form-list-item">
                        <div style={{ minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)", flexWrap:"wrap", marginBottom:"var(--space-2)" }}>
                            <span style={{ fontSize:"10px", fontWeight:800, letterSpacing:".06em", textTransform:"uppercase", padding:"3px var(--space-2)", borderRadius:"var(--radius-full)", color:style.color, background:style.bg }}>
                              {LINEUP_STATUS_OPTIONS.find((option) => option.value === item.status)?.label}
                            </span>
                            <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>
                              {LINEUP_CATEGORY_OPTIONS.find((option) => option.value === item.category)?.label}
                            </span>
                          </div>

                          <h3 style={{ fontSize:"var(--text-sm)", fontWeight:800, marginBottom:"var(--space-1)" }}>{item.title}</h3>

                          {item.description && (
                            <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-muted)", lineHeight:1.6 }}>{item.description}</p>
                          )}

                          <div style={{ display:"flex", gap:"var(--space-3)", flexWrap:"wrap", marginTop:"var(--space-3)", fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>
                            {item.country && <span>{item.country}</span>}
                            {item.startTime && <span>{item.startTime.slice(0, 5)}{item.endTime ? `–${item.endTime.slice(0, 5)}` : ""}</span>}
                            {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color:"var(--color-accent)", fontWeight:700 }}>Źródło ↗</a>}
                          </div>
                        </div>

                        <div className="event-form-item-actions">
                          <button type="button" className="event-form-danger" disabled={busyAction === `delete-lineup-${item.id}`} onClick={() => deleteLineupItem(item.id)} aria-label={`Usuń ${item.title}`}>
                            {busyAction === `delete-lineup-${item.id}` ? <Loader2 size={15} style={{ animation:"event-form-spin 1s linear infinite" }}/> : <Trash2 size={15}/>}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="event-form-empty" style={{ marginBottom:"var(--space-6)" }}>
                  <CalendarDays size={30} style={{ margin:"0 auto var(--space-3)", color:"var(--color-text-faint)" }}/>
                  <p style={{ fontSize:"var(--text-sm)", fontWeight:700 }}>Program nie został jeszcze dodany</p>
                  <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginTop:"var(--space-2)" }}>Wpisuj potwierdzonych uczestników i aktualizuj listę wraz z komunikatami organizatora.</p>
                </div>
              )}

              <div className="event-form-add-box">
                <div className="event-form-compact-grid">
                  <div className="event-form-field">
                    <label htmlFor="lineup-title">Nazwa atrakcji / maszyny *</label>
                    <input id="lineup-title" className="input" value={lineupDraft.title} onChange={(event) => setLineupDraft((previous) => ({ ...previous, title:event.target.value }))} placeholder="np. F-16 Fighting Falcon" disabled={!isEdit} />
                  </div>

                  <div className="event-form-field">
                    <label htmlFor="lineup-country">Kraj / użytkownik</label>
                    <input id="lineup-country" className="input" value={lineupDraft.country} onChange={(event) => setLineupDraft((previous) => ({ ...previous, country:event.target.value }))} placeholder="np. Polska" disabled={!isEdit} />
                  </div>
                </div>

                <div className="event-form-compact-grid" style={{ marginTop:"var(--space-4)" }}>
                  <div className="event-form-field">
                    <label htmlFor="lineup-category">Kategoria</label>
                    <select id="lineup-category" className="event-form-select" value={lineupDraft.category} onChange={(event) => setLineupDraft((previous) => ({ ...previous, category:event.target.value as AirshowLineupCategory }))} disabled={!isEdit}>
                      {LINEUP_CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>

                  <div className="event-form-field">
                    <label htmlFor="lineup-status">Status informacji</label>
                    <select id="lineup-status" className="event-form-select" value={lineupDraft.status} onChange={(event) => setLineupDraft((previous) => ({ ...previous, status:event.target.value as AirshowLineupStatus }))} disabled={!isEdit}>
                      {LINEUP_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="event-form-compact-grid" style={{ marginTop:"var(--space-4)" }}>
                  <div className="event-form-field">
                    <label htmlFor="lineup-start-time">Godzina od</label>
                    <input id="lineup-start-time" type="time" className="input" value={lineupDraft.startTime} onChange={(event) => setLineupDraft((previous) => ({ ...previous, startTime:event.target.value }))} disabled={!isEdit} />
                  </div>

                  <div className="event-form-field">
                    <label htmlFor="lineup-end-time">Godzina do</label>
                    <input id="lineup-end-time" type="time" className="input" value={lineupDraft.endTime} onChange={(event) => setLineupDraft((previous) => ({ ...previous, endTime:event.target.value }))} disabled={!isEdit} />
                  </div>
                </div>

                <div className="event-form-field" style={{ marginTop:"var(--space-4)" }}>
                  <label htmlFor="lineup-description">Opis</label>
                  <textarea id="lineup-description" className="input event-form-mini-textarea" value={lineupDraft.description} onChange={(event) => setLineupDraft((previous) => ({ ...previous, description:event.target.value }))} placeholder="Krótka informacja o prezentacji." disabled={!isEdit} />
                </div>

                <div className="event-form-field" style={{ marginTop:"var(--space-4)" }}>
                  <label htmlFor="lineup-source-url">Źródło potwierdzenia</label>
                  <input id="lineup-source-url" type="url" className="input" value={lineupDraft.sourceUrl} onChange={(event) => setLineupDraft((previous) => ({ ...previous, sourceUrl:event.target.value }))} placeholder="https://…" disabled={!isEdit} />
                </div>

                <button type="button" className="btn btn-primary" style={{ marginTop:"var(--space-5)" }} onClick={addLineupItem} disabled={!isEdit || busyAction === "add-lineup"}>
                  {busyAction === "add-lineup" ? <Loader2 size={15} style={{ animation:"event-form-spin 1s linear infinite" }}/> : <Plus size={15}/>}
                  Dodaj do programu
                </button>
              </div>
            </section>

            <section className="event-form-section">
              <h2 className="event-form-section-title"><FileText size={19} color="var(--color-accent)"/> Dziennik aktualizacji</h2>
              <p className="event-form-section-copy">
                Każda istotna zmiana, np. program, parking, bilety lub komunikat organizatora, powinna mieć datowany wpis. To buduje zaufanie użytkownika.
              </p>

              {loadingRelated ? (
                <div className="event-form-empty"><Loader2 size={24} style={{ margin:"0 auto var(--space-3)", animation:"event-form-spin 1s linear infinite" }}/> Ładowanie aktualizacji…</div>
              ) : updates.length > 0 ? (
                <div className="event-form-list" style={{ marginBottom:"var(--space-6)" }}>
                  {updates.map((item) => (
                    <article key={item.id} className="event-form-list-item">
                      <div>
                        <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginBottom:"var(--space-2)" }}>{formatDateTime(item.publishedAt)}</p>
                        <h3 style={{ fontSize:"var(--text-sm)", fontWeight:800, marginBottom:item.content ? "var(--space-2)" : 0 }}>{item.title}</h3>
                        {item.content && <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-muted)", lineHeight:1.6 }}>{item.content}</p>}
                      </div>

                      <div className="event-form-item-actions">
                        <button type="button" className="event-form-danger" disabled={busyAction === `delete-update-${item.id}`} onClick={() => deleteUpdate(item.id)} aria-label={`Usuń aktualizację: ${item.title}`}>
                          {busyAction === `delete-update-${item.id}` ? <Loader2 size={15} style={{ animation:"event-form-spin 1s linear infinite" }}/> : <Trash2 size={15}/>}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="event-form-empty" style={{ marginBottom:"var(--space-6)" }}>
                  <FileText size={30} style={{ margin:"0 auto var(--space-3)", color:"var(--color-text-faint)" }}/>
                  <p style={{ fontSize:"var(--text-sm)", fontWeight:700 }}>Brak wpisów w dzienniku</p>
                </div>
              )}

              <div className="event-form-add-box">
                <div className="event-form-compact-grid">
                  <div className="event-form-field">
                    <label htmlFor="update-title">Tytuł aktualizacji *</label>
                    <input id="update-title" className="input" value={updateDraft.title} onChange={(event) => setUpdateDraft((previous) => ({ ...previous, title:event.target.value }))} placeholder="np. Dodano oficjalny program" disabled={!isEdit} />
                  </div>

                  <div className="event-form-field">
                    <label htmlFor="update-date">Data aktualizacji</label>
                    <input id="update-date" type="datetime-local" className="input" value={updateDraft.publishedAt} onChange={(event) => setUpdateDraft((previous) => ({ ...previous, publishedAt:event.target.value }))} disabled={!isEdit} />
                  </div>
                </div>

                <div className="event-form-field" style={{ marginTop:"var(--space-4)" }}>
                  <label htmlFor="update-content">Opis zmiany</label>
                  <textarea id="update-content" className="input event-form-mini-textarea" value={updateDraft.content} onChange={(event) => setUpdateDraft((previous) => ({ ...previous, content:event.target.value }))} placeholder="Co się zmieniło i gdzie użytkownik znajdzie szczegóły?" disabled={!isEdit} />
                </div>

                <button type="button" className="btn btn-primary" style={{ marginTop:"var(--space-5)" }} onClick={addUpdate} disabled={!isEdit || busyAction === "add-update"}>
                  {busyAction === "add-update" ? <Loader2 size={15} style={{ animation:"event-form-spin 1s linear infinite" }}/> : <Plus size={15}/>}
                  Dodaj aktualizację
                </button>
              </div>
            </section>
          </>
        )}

        {activeTab === "galleries" && (
          <>
            {!isEdit && (
              <div className="event-form-callout" style={{ marginBottom:"var(--space-5)" }}>
                <Info size={18} color="var(--color-accent)" style={{ flexShrink:0, marginTop:2 }}/>
                <span>Najpierw zapisz wydarzenie. Potem będziesz mógł połączyć je z galeriami zdjęć z poprzednich edycji.</span>
              </div>
            )}

            <section className="event-form-section">
              <h2 className="event-form-section-title"><ImageIcon size={19} color="var(--color-accent)"/> AirShow Gallery z poprzednich edycji</h2>
              <p className="event-form-section-copy">
                To jest wyjątkowy element Twojej strony: osoba, która szuka informacji o przyszłym wydarzeniu, może od razu zobaczyć Twoje fotografie z wcześniejszych edycji.
              </p>

              {loadingRelated ? (
                <div className="event-form-empty"><Loader2 size={24} style={{ margin:"0 auto var(--space-3)", animation:"event-form-spin 1s linear infinite" }}/> Ładowanie galerii…</div>
              ) : linkedGalleryDetails.length > 0 ? (
                <div className="event-form-list" style={{ marginBottom:"var(--space-6)" }}>
                  {linkedGalleryDetails.map(({ link, gallery }) => (
                    <article key={link.id} className="event-form-list-item">
                      <div style={{ display:"flex", gap:"var(--space-4)", minWidth:0 }}>
                        <div style={{ width:74, aspectRatio:"4 / 3", borderRadius:"var(--radius-md)", overflow:"hidden", flexShrink:0, background:"var(--color-surface-dynamic)" }}>
                          {gallery?.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={gallery.coverImage} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                          ) : (
                            <div style={{ width:"100%", height:"100%", display:"grid", placeItems:"center", color:"var(--color-text-faint)" }}>
                              <ImageIcon size={20}/>
                            </div>
                          )}
                        </div>

                        <div style={{ minWidth:0 }}>
                          <h3 style={{ fontSize:"var(--text-sm)", fontWeight:800, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {gallery?.name ?? "Usunięta galeria"}
                          </h3>
                          <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginTop:"var(--space-1)" }}>
                            {gallery ? `${gallery.location} · ${gallery.year} · ${gallery.photoCount} zdjęć` : `ID: ${link.showId}`}
                          </p>
                          {link.label && <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-muted)", marginTop:"var(--space-2)" }}>{link.label}</p>}
                        </div>
                      </div>

                      <div className="event-form-item-actions">
                        <button type="button" className="event-form-danger" disabled={busyAction === `delete-gallery-${link.id}`} onClick={() => deleteGalleryLink(link.id)} aria-label="Usuń powiązanie galerii">
                          {busyAction === `delete-gallery-${link.id}` ? <Loader2 size={15} style={{ animation:"event-form-spin 1s linear infinite" }}/> : <Trash2 size={15}/>}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="event-form-empty" style={{ marginBottom:"var(--space-6)" }}>
                  <ImageIcon size={30} style={{ margin:"0 auto var(--space-3)", color:"var(--color-text-faint)" }}/>
                  <p style={{ fontSize:"var(--text-sm)", fontWeight:700 }}>Nie połączono jeszcze żadnej galerii</p>
                  <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginTop:"var(--space-2)" }}>Dodaj relację z poprzedniej edycji, gdy masz ją w `air_shows`.</p>
                </div>
              )}

              <div className="event-form-add-box">
                <div className="event-form-field">
                  <label htmlFor="gallery-show">Wybierz galerię</label>
                  <select id="gallery-show" className="event-form-select" value={galleryDraft.showId} onChange={(event) => setGalleryDraft((previous) => ({ ...previous, showId:event.target.value }))} disabled={!isEdit}>
                    <option value="">Wybierz galerię z AirShow Gallery…</option>
                    {remainingGalleryOptions.map((gallery) => (
                      <option key={gallery.id} value={gallery.id}>{gallery.name} — {gallery.location} ({gallery.year})</option>
                    ))}
                  </select>
                </div>

                <div className="event-form-field" style={{ marginTop:"var(--space-4)" }}>
                  <label htmlFor="gallery-label">Opis połączenia</label>
                  <input id="gallery-label" className="input" value={galleryDraft.label} onChange={(event) => setGalleryDraft((previous) => ({ ...previous, label:event.target.value }))} placeholder="np. Zdjęcia z NATO Days 2025" disabled={!isEdit} />
                </div>

                <button type="button" className="btn btn-primary" style={{ marginTop:"var(--space-5)" }} onClick={addGalleryLink} disabled={!isEdit || busyAction === "add-gallery" || remainingGalleryOptions.length === 0}>
                  {busyAction === "add-gallery" ? <Loader2 size={15} style={{ animation:"event-form-spin 1s linear infinite" }}/> : <Link2 size={15}/>}
                  Połącz galerię
                </button>
              </div>
            </section>
          </>
        )}

        {activeTab === "seo" && (
          <>
            <section className="event-form-section">
              <h2 className="event-form-section-title"><Search size={19} color="var(--color-accent)"/> Aktualność i źródła</h2>
              <p className="event-form-section-copy">
                Źródła oraz data weryfikacji są ważne dla wiarygodności. Zawsze weryfikuj termin, program, bilety i logistykę na oficjalnej stronie organizatora.
              </p>

              <div className="event-form-grid">
                <div className="event-form-field">
                  <label htmlFor="last-verified">Ostatnia weryfikacja</label>
                  <input id="last-verified" type="datetime-local" className="input" value={form.lastVerifiedAt} onChange={(event) => updateForm("lastVerifiedAt", event.target.value)} />
                  <small>Ustaw datę za każdym razem, kiedy sprawdzasz oficjalne źródła.</small>
                </div>

                <div className="event-form-field">
                  <label htmlFor="source-url">Dodaj źródło</label>
                  <div style={{ display:"flex", gap:"var(--space-2)" }}>
                    <input id="source-url" className="input" type="url" value={sourceDraft} onChange={(event) => setSourceDraft(event.target.value)} placeholder="https://oficjalna-strona…" />
                    <button type="button" className="btn btn-subtle btn-icon" onClick={addSource} aria-label="Dodaj źródło">
                      <Plus size={16}/>
                    </button>
                  </div>
                </div>
              </div>

              {form.sourceUrls.length > 0 ? (
                <div className="event-form-list" style={{ marginTop:"var(--space-5)" }}>
                  {form.sourceUrls.map((source) => (
                    <div key={source} className="event-form-list-item">
                      <a href={source} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:"var(--space-2)", minWidth:0, color:"var(--color-accent)", fontSize:"var(--text-sm)", fontWeight:700 }}>
                        <ExternalLink size={14} style={{ flexShrink:0 }}/>
                        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{source}</span>
                      </a>
                      <button type="button" className="event-form-danger" onClick={() => removeSource(source)} aria-label="Usuń źródło">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="event-form-callout" style={{ marginTop:"var(--space-5)" }}>
                  <AlertCircle size={18} color="var(--color-gold)" style={{ flexShrink:0, marginTop:2 }}/>
                  <span>Nie dodano jeszcze źródeł. Nie publikuj pełnego przewodnika bez co najmniej jednego źródła organizatora.</span>
                </div>
              )}
            </section>

            <section className="event-form-section">
              <h2 className="event-form-section-title"><FileText size={19} color="var(--color-accent)"/> FAQ — pytania użytkowników</h2>
              <p className="event-form-section-copy">
                Dodawaj konkretne pytania, np. o bilety, parking, aparaty fotograficzne czy dojazd z Polski. Odpowiedzi muszą wynikać z aktualnych źródeł.
              </p>

              {form.faq.length > 0 && (
                <div className="event-form-list" style={{ marginBottom:"var(--space-6)" }}>
                  {form.faq.map((item, index) => (
                    <article key={`${item.question}-${index}`} className="event-form-list-item">
                      <div>
                        <h3 style={{ fontSize:"var(--text-sm)", fontWeight:800, marginBottom:"var(--space-2)" }}>{item.question}</h3>
                        <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-muted)", lineHeight:1.65 }}>{item.answer}</p>
                      </div>
                      <button type="button" className="event-form-danger" onClick={() => removeFaq(index)} aria-label="Usuń pytanie FAQ">
                        <Trash2 size={15}/>
                      </button>
                    </article>
                  ))}
                </div>
              )}

              <div className="event-form-add-box">
                <div className="event-form-field">
                  <label htmlFor="faq-question">Pytanie</label>
                  <input id="faq-question" className="input" value={faqDraft.question} onChange={(event) => setFaqDraft((previous) => ({ ...previous, question:event.target.value }))} placeholder="np. Czy wstęp na wydarzenie jest płatny?" />
                </div>

                <div className="event-form-field" style={{ marginTop:"var(--space-4)" }}>
                  <label htmlFor="faq-answer">Odpowiedź</label>
                  <textarea id="faq-answer" className="input event-form-mini-textarea" value={faqDraft.answer} onChange={(event) => setFaqDraft((previous) => ({ ...previous, answer:event.target.value }))} placeholder="Udziel krótkiej, konkretnej i aktualnej odpowiedzi." />
                </div>

                <button type="button" className="btn btn-primary" style={{ marginTop:"var(--space-5)" }} onClick={addFaq}>
                  <Plus size={15}/> Dodaj pytanie FAQ
                </button>
              </div>
            </section>

            <section className="event-form-section">
              <h2 className="event-form-section-title"><Globe2 size={19} color="var(--color-accent)"/> Publikacja i widoczność</h2>

              <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-3)" }}>
                <label className="event-form-toggle">
                  <span>
                    <span style={{ display:"block", fontSize:"var(--text-sm)", fontWeight:800, marginBottom:"var(--space-1)" }}>Opublikuj wydarzenie</span>
                    <span style={{ display:"block", fontSize:"var(--text-xs)", color:"var(--color-text-muted)", lineHeight:1.55 }}>Wydarzenie stanie się widoczne publicznie w kalendarzu i może zostać zaindeksowane przez Google.</span>
                  </span>
                  <input type="checkbox" checked={form.published} onChange={(event) => updateForm("published", event.target.checked)} aria-label="Opublikuj wydarzenie" />
                </label>

                <label className="event-form-toggle">
                  <span>
                    <span style={{ display:"block", fontSize:"var(--text-sm)", fontWeight:800, marginBottom:"var(--space-1)" }}>Wyróżnij w kalendarzu</span>
                    <span style={{ display:"block", fontSize:"var(--text-xs)", color:"var(--color-text-muted)", lineHeight:1.55 }}>Wyróżnione wydarzenie będzie mogło zostać pokazane jako priorytetowe na stronie kalendarza.</span>
                  </span>
                  <input type="checkbox" checked={form.featured} onChange={(event) => updateForm("featured", event.target.checked)} aria-label="Wyróżnij wydarzenie" />
                </label>
              </div>

              <div className="event-form-callout" style={{ marginTop:"var(--space-5)" }}>
                <AlertCircle size={18} color="var(--color-gold)" style={{ flexShrink:0, marginTop:2 }}/>
                <span>Przed publikacją sprawdź: termin, lokalizację, co najmniej jedno źródło, opis dla użytkownika, status wydarzenia oraz poprawność linków do organizatora.</span>
              </div>
            </section>
          </>
        )}

        <div className="event-form-footer">
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-muted)", lineHeight:1.5 }}>
              {isEdit
                ? "Zmiany są zapisywane wyłącznie po kliknięciu przycisku po prawej."
                : "Po pierwszym zapisie przejdziesz do pełnej edycji wydarzenia."}
            </p>
          </div>

          <div style={{ display:"flex", gap:"var(--space-3)", flexShrink:0 }}>
            <Link href="/admin/calendar" className="btn btn-ghost">Anuluj</Link>
            <button type="button" className="btn btn-primary" onClick={saveEvent} disabled={saving}>
              {saving ? <Loader2 size={16} style={{ animation:"event-form-spin 1s linear infinite" }}/> : <Check size={16}/>}
              {saving ? "Zapisywanie…" : isEdit ? "Zapisz zmiany" : "Utwórz wydarzenie"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function PlaneIcon() {
  return <CalendarDays size={19} color="var(--color-accent)" />;
}