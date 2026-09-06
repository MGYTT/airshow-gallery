import { NextRequest, NextResponse } from "next/server";

const MAILERLITE_API_URL = "https://connect.mailerlite.com/api/subscribers";
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestLog = new Map<string, { count: number; resetAt: number }>();

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function rateLimited(key: string) {
  const now = Date.now();
  const current = requestLog.get(key);

  if (!current || now > current.resetAt) {
    requestLog.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  const key = getClientKey(request);

  if (rateLimited(key)) {
    return NextResponse.json(
      { message: "Za dużo prób. Spróbuj ponownie za chwilę." },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as {
      email?: unknown;
      website?: unknown;
      consent?: unknown;
    };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const website = typeof body.website === "string" ? body.website.trim() : "";
    const consent = body.consent === true;

    if (website) {
      return NextResponse.json({ message: "Adres został przyjęty." });
    }

    if (!consent) {
      return NextResponse.json({ message: "Wymagana jest zgoda na otrzymywanie newslettera." }, { status: 400 });
    }

    if (!isValidEmail(email) || email.length > 254) {
      return NextResponse.json({ message: "Podaj prawidłowy adres e-mail." }, { status: 400 });
    }

    const apiToken = process.env.MAILERLITE_API_TOKEN;
    const groupId = process.env.MAILERLITE_GROUP_ID;

    if (!apiToken || !groupId) {
      console.error("Newsletter: brak MAILERLITE_API_TOKEN lub MAILERLITE_GROUP_ID.");
      return NextResponse.json({ message: "Newsletter nie jest jeszcze skonfigurowany." }, { status: 503 });
    }

    const response = await fetch(MAILERLITE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        groups: [groupId],
        status: "active",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MailerLite signup error:", response.status, errorText);

      if (response.status === 422) {
        return NextResponse.json({ message: "Nie udało się przetworzyć tego adresu. Sprawdź go i spróbuj ponownie." }, { status: 422 });
      }

      return NextResponse.json({ message: "Nie udało się zapisać. Spróbuj ponownie za chwilę." }, { status: 502 });
    }

    return NextResponse.json({ message: "Adres został dodany do AirShow Alert." });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ message: "Wystąpił błąd. Spróbuj ponownie za chwilę." }, { status: 500 });
  }
}
