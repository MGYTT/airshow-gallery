import { useState, useEffect } from "react";

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

function adminHeaders() {
  return { "x-admin-secret": ADMIN_SECRET, "Content-Type": "application/json" };
}

export async function fetchShows(all = false) {
  const res = await fetch(`/api/shows${all ? "?all=true" : ""}`,
    all ? { headers: adminHeaders() } : {}
  );
  if (!res.ok) throw new Error("Błąd pobierania pokazów");
  return res.json();
}

export async function fetchPhotos(showId?: string) {
  const url = showId ? `/api/photos?showId=${showId}` : "/api/photos";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Błąd pobierania zdjęć");
  return res.json();
}

export async function createShow(data: object) {
  const res = await fetch("/api/shows", {
    method: "POST", headers: adminHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function updateShow(id: string, data: object) {
  const res = await fetch(`/api/shows/${id}`, {
    method: "PATCH", headers: adminHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function deleteShow(id: string) {
  const res = await fetch(`/api/shows/${id}`, {
    method: "DELETE", headers: adminHeaders(),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function deletePhoto(id: string) {
  const res = await fetch(`/api/photos/${id}`, {
    method: "DELETE", headers: adminHeaders(),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function uploadPhoto(formData: FormData) {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "x-admin-secret": ADMIN_SECRET },
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}