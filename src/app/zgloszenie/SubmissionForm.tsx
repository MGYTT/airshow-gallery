"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarPlus, CheckCircle2, Info, Send, ShieldCheck, Bug, X } from "lucide-react";

type SubmissionType = "event_proposal" | "correction";

export default function SubmissionForm() {
  const [type, setType] = useState<SubmissionType>("event_proposal");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", message: "", pageUrl: "", sourceUrl: "", contactEmail: "",
    eventName: "", country: "", city: "", startDate: "", endDate: "",
    officialUrl: "", website: "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSending(true);

    const eventMessage = [
      form.country && "Kraj: " + form.country,
      form.city && "Miasto: " + form.city,
      form.startDate && "Data rozpoczęcia: " + form.startDate,
      form.endDate && "Data zakończenia: " + form.endDate,
      form.officialUrl && "Oficjalna strona: " + form.officialUrl,
      form.message,
    ].filter(Boolean).join("\n");

    const payload = {
      type,
      title: type === "event_proposal" ? form.eventName : form.title,
      message: type === "event_proposal" ? eventMessage : form.message,
      pageUrl: form.pageUrl,
      sourceUrl: form.sourceUrl || (type === "event_proposal" ? form.officialUrl : ""),
      contactEmail: form.contactEmail,
      website: form.website,
    };

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Nie udało się wysłać zgłoszenia.");
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nie udało się wysłać zgłoszenia.");
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setSubmitted(false);
    setError("");
    setForm({
      title: "", message: "", pageUrl: "", sourceUrl: "", contactEmail: "",
      eventName: "", country: "", city: "", startDate: "", endDate: "",
      officialUrl: "", website: "",
    });
  }

  if (submitted) {
    return (
      <div className="submission-success">
        <div className="success-icon"><CheckCircle2 size={30} /></div>
        <span className="eyebrow">Zgłoszenie wysłane</span>
        <h2>Dziękujemy za pomoc.</h2>
        <p>Zgłoszenie trafiło do weryfikacji. Nic nie zostanie opublikowane automatycznie — każdą zmianę sprawdzamy przed dodaniem jej do AirShow Gallery.</p>
        <div className="success-actions">
          <button type="button" className="btn-primary" onClick={reset}>Wyślij kolejne zgłoszenie <ArrowRight size={16} /></button>
          <Link href="/kalendarz" className="btn-secondary">Wróć do kalendarza</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="submission-form" onSubmit={submit}>
      <div className="type-switch" role="tablist" aria-label="Rodzaj zgłoszenia">
        <button type="button" role="tab" aria-selected={type === "event_proposal"} className={type === "event_proposal" ? "selected" : ""} onClick={() => { setType("event_proposal"); setError(""); }}>
          <CalendarPlus size={18} />
          <span><strong>Zaproponuj wydarzenie</strong><small>Brakuje pokazu w kalendarzu</small></span>
        </button>
        <button type="button" role="tab" aria-selected={type === "correction"} className={type === "correction" ? "selected" : ""} onClick={() => { setType("correction"); setError(""); }}>
          <Bug size={18} />
          <span><strong>Zgłoś poprawkę</strong><small>Znalazłeś błąd lub nieaktualną informację</small></span>
        </button>
      </div>

      <div className="form-card">
        <div className="card-heading">
          <div className="card-icon">{type === "event_proposal" ? <CalendarPlus size={18} /> : <Bug size={18} />}</div>
          <div>
            <h2>{type === "event_proposal" ? "Nowe wydarzenie" : "Co wymaga poprawy?"}</h2>
            <p>{type === "event_proposal" ? "Podaj najważniejsze informacje. Resztę możemy uzupełnić podczas weryfikacji." : "Im dokładniej opiszesz problem, tym łatwiej będzie go sprawdzić."}</p>
          </div>
        </div>

        {type === "event_proposal" ? (
          <>
            <label>Nazwa wydarzenia <span>*</span><input required value={form.eventName} onChange={(e) => update("eventName", e.target.value)} placeholder="np. NATO Days 2027" maxLength={180} /></label>
            <div className="field-grid">
              <label>Kraj<input value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="np. Czechy" maxLength={100} /></label>
              <label>Miasto<input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="np. Ostrava" maxLength={120} /></label>
            </div>
            <div className="field-grid">
              <label>Data rozpoczęcia<input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} /></label>
              <label>Data zakończenia<input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} /></label>
            </div>
            <label>Oficjalna strona wydarzenia<input type="url" value={form.officialUrl} onChange={(e) => update("officialUrl", e.target.value)} placeholder="https://..." /></label>
            <label>Co wiesz o wydarzeniu? <span>*</span><textarea required value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Np. wydarzenie odbędzie się w dniach..., organizator potwierdził..." minLength={10} maxLength={5000} rows={6} /></label>
          </>
        ) : (
          <>
            <label>Czego dotyczy poprawka? <span>*</span><input required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="np. Nieprawidłowa godzina programu" maxLength={180} /></label>
            <label>Strona, której dotyczy zgłoszenie<input type="url" value={form.pageUrl} onChange={(e) => update("pageUrl", e.target.value)} placeholder="https://airshow-gallery.vercel.app/..." /></label>
            <label>Opis problemu <span>*</span><textarea required value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Opisz, co jest nieprawidłowe i jaka informacja powinna być zamiast tego..." minLength={10} maxLength={5000} rows={7} /></label>
            <label>Źródło / potwierdzenie<input type="url" value={form.sourceUrl} onChange={(e) => update("sourceUrl", e.target.value)} placeholder="https://oficjalna-strona-wydarzenia..." /></label>
          </>
        )}

        {type === "event_proposal" && (
          <label>Źródło informacji<input type="url" value={form.sourceUrl} onChange={(e) => update("sourceUrl", e.target.value)} placeholder="https://..." /></label>
        )}

        <div className="optional">
          <Info size={15} />
          <div><strong>Kontakt jest opcjonalny</strong><p>Jeśli chcesz, możesz podać e-mail. Nie jest potrzebne konto ani rejestracja.</p></div>
        </div>

        <label>E-mail (opcjonalnie)<input type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} placeholder="twoj@email.pl" autoComplete="email" /></label>
        <input className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={(e) => update("website", e.target.value)} />

        {error && <div className="form-error" role="alert"><X size={16} />{error}</div>}

        <div className="form-footer">
          <p><ShieldCheck size={15} /> Zgłoszenia są ręcznie weryfikowane przez administratora.</p>
          <button type="submit" className="submit-btn" disabled={sending}>{sending ? "Wysyłanie…" : "Wyślij zgłoszenie"} <Send size={16} /></button>
        </div>
      </div>
    </form>
  );
}
