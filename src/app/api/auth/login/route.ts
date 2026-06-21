import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();

  // PIN sprawdzany TYLKO po stronie serwera — nigdy nie trafia do klienta
  const correctPin = process.env.ADMIN_PIN;

  if (!correctPin) {
    return NextResponse.json(
      { error: "ADMIN_PIN nie jest ustawiony w zmiennych środowiskowych" },
      { status: 500 }
    );
  }

  if (pin !== correctPin) {
    return NextResponse.json({ error: "Nieprawidłowy PIN" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  // httpOnly cookie — niedostępne z JS, bezpieczne
  res.cookies.set("admin_session", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 godzin
    path: "/",
  });

  return res;
}