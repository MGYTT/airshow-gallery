"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, Loader2, Mail } from "lucide-react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Nie udało się zapisać. Spróbuj ponownie.");
      }

      setStatus("success");
      setMessage(data.message || "Sprawdź swoją skrzynkę i potwierdź zapis.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Wystąpił błąd. Spróbuj ponownie.");
    }
  }

  if (status === "success") {
    return (
      <div className="nl-form-success" role="status" aria-live="polite">
        <div className="nl-success-icon" aria-hidden="true"><Check size={20} /></div>
        <div>
          <strong>Jeszcze jeden krok ✈️</strong>
          <p>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="nl-form" noValidate>
      <label htmlFor="newsletter-email" className="sr-only">Adres e-mail</label>
      <div className="nl-input-wrap">
        <Mail size={17} aria-hidden="true" />
        <input
          id="newsletter-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Twój adres e-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={status === "loading"}
          aria-invalid={status === "error"}
        />
      </div>

      <input
        type="text"
        name="website"
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="nl-honeypot"
      />

      <button type="submit" className="btn btn-primary nl-submit" disabled={status === "loading"}>
        {status === "loading" ? <Loader2 size={16} className="nl-spin" /> : <Mail size={16} />}
        {status === "loading" ? "Zapisywanie…" : "Dołączam do AirShow Alert"}
        {status !== "loading" && <ArrowRight size={15} />}
      </button>

      {status === "error" && (
        <p className="nl-error" role="alert">{message}</p>
      )}

      <p className="nl-consent">
        Zapis jest bezpłatny. Po wysłaniu formularza otrzymasz wiadomość z prośbą o potwierdzenie adresu e-mail. Możesz wypisać się w każdej chwili.
      </p>
    </form>
  );
}
