"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!consent) {
      setStatus("error");
      setMessage("Zaznacz zgodę, aby dołączyć do newslettera.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website, consent: true }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Nie udało się zapisać. Spróbuj ponownie.");
      }

      setStatus("success");
      setMessage(data.message || "Sprawdź swoją skrzynkę i potwierdź zapis.");
      setEmail("");
      setConsent(false);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Wystąpił błąd. Spróbuj ponownie.");
    }
  }

  if (status === "success") {
    return (
      <div className="nl-form-success" role="status" aria-live="polite">
        <div className="nl-success-icon" aria-hidden="true"><Check size={18} strokeWidth={2.5} /></div>
        <div className="nl-success-copy">
          <strong>Sprawdź skrzynkę ✈️</strong>
          <p>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="nl-form" noValidate>
      <style>{`
        .nl-form{display:flex;flex-direction:column;gap:14px}
        .nl-email-field{display:block}
        .nl-field-label{display:block;margin:0 0 8px;color:var(--color-text);font-size:12px;font-weight:800;letter-spacing:.01em}
        .nl-input-wrap{position:relative;display:flex;align-items:center;min-height:58px;padding:0 16px;border:1px solid var(--color-border);border-radius:13px;background:var(--color-bg);transition:border-color .18s ease,box-shadow .18s ease,background .18s ease}
        .nl-input-wrap:hover{border-color:var(--color-text-faint)}
        .nl-input-wrap:focus-within{border-color:var(--color-accent);background:var(--color-surface);box-shadow:0 0 0 4px var(--color-accent-subtle)}
        .nl-input-wrap input{width:100%;min-width:0;padding:0;border:0;outline:0;background:transparent;color:var(--color-text);font-family:var(--font-body);font-size:16px;line-height:1.4;font-weight:500;letter-spacing:-.01em}
        .nl-input-wrap input::placeholder{color:var(--color-text-faint);opacity:.9}
        .nl-input-wrap:focus-within input::placeholder{opacity:.55}
        .nl-email-mark{display:grid;place-items:center;flex:0 0 28px;width:28px;height:28px;margin-left:12px;border-radius:8px;background:var(--color-surface-offset);color:var(--color-text-faint);font-size:12px;font-weight:900;order:2}
        .nl-consent-check{display:grid;grid-template-columns:18px 1fr;gap:10px;align-items:start;cursor:pointer}
        .nl-consent-check input{appearance:none;width:18px;height:18px;margin:1px 0 0;border:1px solid var(--color-border-strong,var(--color-border));border-radius:5px;background:var(--color-bg);display:grid;place-items:center;cursor:pointer;transition:background .18s,border-color .18s}
        .nl-consent-check input:checked{background:var(--color-accent);border-color:var(--color-accent)}
        .nl-consent-check input:checked::after{content:'✓';color:#fff;font-size:12px;font-weight:900;line-height:1}
        .nl-consent-check input:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px}
        .nl-consent-check span{color:var(--color-text-muted);font-size:11.5px;line-height:1.55}
        .nl-submit{width:100%;min-height:54px;justify-content:space-between;padding-inline:18px;border-radius:12px}
        .nl-submit > svg:last-child{transition:transform .18s ease}.nl-submit:hover > svg:last-child{transform:translateX(3px)}
        .nl-consent{margin:0;color:var(--color-text-faint);font-size:10.5px;line-height:1.55}
        .nl-honeypot{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}
        .nl-form-success{display:flex;gap:13px;align-items:flex-start;padding:18px;border:1px solid color-mix(in srgb,var(--color-accent) 55%,var(--color-border));border-radius:14px;background:var(--color-accent-subtle)}
        .nl-success-icon{display:grid;place-items:center;flex:0 0 34px;width:34px;height:34px;border-radius:50%;background:var(--color-accent);color:#fff}
        .nl-success-copy strong{display:block;color:var(--color-text);font-size:13px;font-weight:800}.nl-success-copy p{margin:4px 0 0;color:var(--color-text-muted);font-size:12px;line-height:1.55}
        .nl-error{margin:-2px 0 0;color:var(--color-accent);font-size:11.5px;line-height:1.5;font-weight:700}
        .nl-spin{animation:nlspin .8s linear infinite}@keyframes nlspin{to{transform:rotate(360deg)}}
        @media(max-width:560px){.nl-input-wrap{min-height:54px;padding:0 14px}.nl-input-wrap input{font-size:15px}.nl-submit{min-height:52px}}
      `}</style>

      <div className="nl-email-field">
        <label htmlFor="newsletter-email" className="nl-field-label">Adres e-mail</label>
        <div className="nl-input-wrap">
          <input
            id="newsletter-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="np. lotnik@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={status === "loading"}
            aria-invalid={status === "error"}
          />
          <span className="nl-email-mark" aria-hidden="true">@</span>
        </div>
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

      <label className="nl-consent-check">
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          disabled={status === "loading"}
        />
        <span>
          Chcę otrzymywać newsletter AirShow Alert na podany adres e-mail. Mogę wypisać się w każdej chwili.
        </span>
      </label>

      <button type="submit" className="btn btn-primary nl-submit" disabled={status === "loading"}>
        <span>{status === "loading" ? "Zapisywanie…" : "Dołącz do AirShow Alert"}</span>
        {status === "loading" ? <Loader2 size={17} className="nl-spin" /> : <ArrowRight size={17} />}
      </button>

      {status === "error" && (
        <p className="nl-error" role="alert">{message}</p>
      )}

      <p className="nl-consent">
        Zapis jest bezpłatny. Po zapisie otrzymasz wiadomość z prośbą o potwierdzenie adresu e-mail.
      </p>
    </form>
  );
}
