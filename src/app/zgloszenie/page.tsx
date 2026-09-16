import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bug, CalendarPlus, ShieldCheck } from "lucide-react";
import SubmissionForm from "./SubmissionForm";

export const metadata: Metadata = {
  title: "Zgłoś informację",
  description: "Zaproponuj wydarzenie do kalendarza AirShow Gallery lub zgłoś nieaktualną informację. Bez rejestracji.",
  alternates: { canonical: "/zgloszenie" },
  robots: { index: true, follow: true },
};

export default function SubmissionPage() {
  return (
    <div className="submission-page">
      <style>{`
        .submission-page{min-height:70vh;padding:clamp(72px,10vw,120px) 0 var(--space-16);background:var(--color-bg)}
        .submission-shell{width:min(100% - 32px,900px);margin:0 auto}
        .submission-back{display:inline-flex;align-items:center;gap:8px;color:var(--color-text-faint);font-size:var(--text-sm);font-weight:700;text-decoration:none;margin-bottom:var(--space-8);transition:color .18s ease,transform .18s ease}.submission-back:hover{color:var(--color-accent);transform:translateX(-3px)}
        .submission-hero{text-align:center;max-width:720px;margin:0 auto var(--space-10)}.submission-hero .eyebrow{display:inline-flex;align-items:center;gap:7px;padding:7px 11px;border:1px solid var(--color-border);border-radius:999px;background:var(--color-surface);color:var(--color-accent);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
        .submission-hero h1{font-family:var(--font-display);font-size:clamp(2.2rem,6vw,4.2rem);line-height:.98;letter-spacing:-.055em;font-weight:950;margin:16px 0 14px}.submission-hero p{margin:0 auto;color:var(--color-text-muted);font-size:var(--text-md);line-height:1.7;max-width:640px}
        .principles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:var(--space-8)}.principle{padding:15px;border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface);text-align:left}.principle svg{color:var(--color-accent);margin-bottom:9px}.principle strong{display:block;font-size:var(--text-sm);margin-bottom:3px}.principle span{display:block;color:var(--color-text-faint);font-size:11px;line-height:1.45}
        .submission-form{max-width:760px;margin:0 auto}.type-switch{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.type-switch button{display:flex;align-items:center;gap:12px;padding:16px;text-align:left;border:1px solid var(--color-border);border-radius:var(--radius-xl);background:var(--color-surface);color:var(--color-text-muted);cursor:pointer;transition:border-color .18s ease,background .18s ease,transform .18s ease,box-shadow .18s ease}.type-switch button:hover{border-color:var(--color-border-strong);transform:translateY(-1px)}.type-switch button.selected{border-color:color-mix(in srgb,var(--color-accent) 55%,var(--color-border));background:var(--color-accent-subtle);color:var(--color-text);box-shadow:var(--shadow-sm)}.type-switch svg{flex-shrink:0;color:var(--color-accent)}.type-switch strong{display:block;font-size:var(--text-sm)}.type-switch small{display:block;color:var(--color-text-faint);font-size:11px;margin-top:3px}
        .form-card,.submission-success{padding:clamp(20px,4vw,32px);border:1px solid var(--color-border);border-radius:var(--radius-2xl);background:var(--color-surface);box-shadow:var(--shadow-sm)}.card-heading{display:flex;gap:13px;align-items:flex-start;margin-bottom:26px}.card-icon,.success-icon{width:42px;height:42px;display:grid;place-items:center;flex-shrink:0;border-radius:12px;background:var(--color-accent-subtle);color:var(--color-accent)}.card-heading h2{font-family:var(--font-display);font-size:var(--text-xl);letter-spacing:-.03em;font-weight:900;margin:0 0 5px}.card-heading p{font-size:var(--text-sm);color:var(--color-text-faint);line-height:1.5;margin:0}
        .form-card label{display:block;font-size:12px;font-weight:800;color:var(--color-text-muted);margin-bottom:16px}.form-card label>span{color:var(--color-accent)}.form-card input,.form-card textarea{display:block;width:100%;margin-top:7px;padding:12px 13px;border:1px solid var(--color-border-strong);border-radius:var(--radius-md);background:var(--color-bg);color:var(--color-text);font:inherit;font-size:14px;outline:none;transition:border-color .18s ease,box-shadow .18s ease}.form-card textarea{resize:vertical;min-height:130px;line-height:1.55}.form-card input:focus,.form-card textarea:focus{border-color:var(--color-accent);box-shadow:0 0 0 3px var(--color-accent-subtle)}
        .field-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.optional{display:flex;gap:10px;padding:13px 14px;margin:6px 0 16px;border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface-offset);color:var(--color-text-muted)}.optional svg{flex-shrink:0;color:var(--color-accent);margin-top:2px}.optional strong{font-size:12px}.optional p{font-size:11px;color:var(--color-text-faint);margin:3px 0 0;line-height:1.5}
        .form-error{display:flex;align-items:center;gap:8px;padding:11px 12px;margin:4px 0 16px;border:1px solid rgba(220,38,38,.28);border-radius:var(--radius-md);background:rgba(220,38,38,.08);color:#dc2626;font-size:12px;font-weight:700}.form-error svg{flex-shrink:0}.form-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-top:16px;border-top:1px solid var(--color-divider)}.form-footer p{display:flex;align-items:center;gap:7px;color:var(--color-text-faint);font-size:11px;margin:0;line-height:1.45}.form-footer p svg{color:var(--color-accent);flex-shrink:0}.submit-btn,.btn-primary,.btn-secondary{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 16px;border-radius:var(--radius-md);font-size:12px;font-weight:800;text-decoration:none;cursor:pointer}.submit-btn,.btn-primary{border:1px solid var(--color-accent);background:var(--color-accent);color:#fff}.submit-btn:hover,.btn-primary:hover{filter:brightness(.96)}.submit-btn:disabled{opacity:.6;cursor:wait}.btn-secondary{border:1px solid var(--color-border-strong);background:var(--color-surface);color:var(--color-text-muted)}
        .submission-success{text-align:center;max-width:680px;margin:40px auto}.success-icon{margin:0 auto 16px}.submission-success .eyebrow{font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent)}.submission-success h2{font-family:var(--font-display);font-size:clamp(1.8rem,5vw,2.8rem);letter-spacing:-.04em;margin:10px 0}.submission-success>p{color:var(--color-text-muted);line-height:1.65;max-width:540px;margin:0 auto}.success-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:24px}.honeypot{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}
        @media(max-width:700px){.principles{grid-template-columns:1fr}.type-switch{grid-template-columns:1fr}.field-grid{grid-template-columns:1fr}.form-footer{align-items:stretch;flex-direction:column}.submit-btn{width:100%}}@media(prefers-reduced-motion:reduce){.submission-page *{scroll-behavior:auto!important;transition:none!important}}
      `}</style>
      <div className="submission-shell">
        <Link href="/" className="submission-back"><ArrowLeft size={15}/> Wróć do strony głównej</Link>
        <div className="submission-hero">
          <span className="eyebrow"><ShieldCheck size={13}/> Wspólnie aktualizujemy informacje</span>
          <h1>Zgłoś informację</h1>
          <p>Widzisz brakujące wydarzenie albo nieaktualną informację? Przekaż ją nam. Nie potrzebujesz konta — każde zgłoszenie trafia najpierw do ręcznej weryfikacji.</p>
        </div>
        <div className="principles">
          <div className="principle"><CalendarPlus size={17}/><strong>Brakujący pokaz</strong><span>Zaproponuj wydarzenie do kalendarza.</span></div>
          <div className="principle"><Bug size={17}/><strong>Nieaktualna informacja</strong><span>Wskaż błąd i, jeśli możesz, dodaj źródło.</span></div>
          <div className="principle"><ShieldCheck size={17}/><strong>Pełna kontrola</strong><span>Nic nie trafia na stronę bez akceptacji administratora.</span></div>
        </div>
        <SubmissionForm />
      </div>
    </div>
  );
}
