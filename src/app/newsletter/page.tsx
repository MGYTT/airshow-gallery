import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, Camera, Check, ChevronDown, Mail, MapPin, Newspaper, Plane, Sparkles } from "lucide-react";
import NewsletterForm from "@/components/newsletter/NewsletterForm";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://airshow-gallery.vercel.app").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "AirShow Alert – newsletter o pokazach lotniczych",
  description: "Dołącz bezpłatnie do AirShow Alert. Otrzymuj informacje o pokazach lotniczych w Polsce i Europie, nowe galerie, ważne aktualizacje i ciekawostki.",
  alternates: { canonical: `${SITE_URL}/newsletter` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/newsletter`,
    title: "AirShow Alert – nie przegap kolejnego Air Show",
    description: "Pokazy, nowe galerie, ważne aktualizacje i lotnicze ciekawostki prosto na Twój e-mail.",
    siteName: "MGYT AirShow Gallery",
    locale: "pl_PL",
  },
};

const benefits = [
  { icon: CalendarDays, title: "Pokazy lotnicze", text: "Najciekawsze wydarzenia w Polsce i Europie — z datą, miejscem i najważniejszymi informacjami." },
  { icon: Bell, title: "Ważne aktualizacje", text: "Nowi uczestnicy, programy, zmiany i inne informacje, które naprawdę warto znać." },
  { icon: Camera, title: "Nowe galerie", text: "Wybrane zdjęcia i informacje o nowych galeriach opublikowanych na AirShow Gallery." },
  { icon: Plane, title: "Lotnicze ciekawostki", text: "Samoloty, zespoły akrobacyjne, wydarzenia i historie ze świata lotnictwa." },
  { icon: Newspaper, title: "Nowe artykuły", text: "Wybrane materiały z AirShow Journal — poradniki, relacje i tematy dla pasjonatów." },
  { icon: MapPin, title: "Praktyczne informacje", text: "Przydatne wskazówki przed wyjazdem na pokaz, również z perspektywy fotografa i spottera." },
];

const faq = [
  ["Czy AirShow Alert jest darmowy?", "Tak. Zapis do newslettera jest bezpłatny."],
  ["Jak często będę otrzymywać wiadomości?", "Zazwyczaj 1–2 razy w miesiącu. Dodatkowa wiadomość może pojawić się wtedy, gdy wydarzy się coś naprawdę ważnego."],
  ["Czy muszę być fotografem?", "Nie. AirShow Alert jest dla każdego, kto interesuje się pokazami lotniczymi, samolotami i lotnictwem."],
  ["Czy mogę się wypisać?", "Tak. Każda wiadomość będzie zawierała możliwość rezygnacji z subskrypcji."],
  ["Co dzieje się po zapisie?", "Najpierw otrzymasz wiadomość z prośbą o potwierdzenie adresu e-mail. Dopiero po potwierdzeniu zapis zostanie aktywowany."],
];

export default function NewsletterPage() {
  return (
    <>
      <style>{`
        .nl-page{padding-top:64px;overflow:hidden}
        .nl-hero{position:relative;padding:clamp(72px,10vw,132px) 0 96px;border-bottom:1px solid var(--color-divider);background:radial-gradient(circle at 80% 15%,var(--color-accent-subtle),transparent 34%)}
        .nl-hero-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:clamp(40px,7vw,96px);align-items:center}
        .nl-eyebrow{display:inline-flex;align-items:center;gap:8px;margin-bottom:18px;padding:7px 11px;border:1px solid var(--color-border);border-radius:999px;background:var(--color-surface-offset);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--color-accent)}
        .nl-title{font-family:var(--font-display);font-size:clamp(3rem,7vw,6.7rem);font-weight:900;line-height:.91;letter-spacing:-.065em;margin:0 0 26px;max-width:850px}
        .nl-title span{color:var(--color-accent)}
        .nl-lead{max-width:680px;color:var(--color-text-muted);font-size:clamp(1rem,1.7vw,1.25rem);line-height:1.75;margin:0 0 30px}
        .nl-trust{display:flex;flex-wrap:wrap;gap:10px 18px;color:var(--color-text-faint);font-size:12px;font-weight:700}
        .nl-trust span{display:inline-flex;align-items:center;gap:6px}
        .nl-card{border:1px solid var(--color-border);border-radius:24px;background:var(--color-surface);box-shadow:var(--shadow-lg);padding:clamp(24px,4vw,38px)}
        .nl-card-top{display:flex;align-items:center;gap:12px;margin-bottom:24px}
        .nl-card-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:var(--color-accent-subtle);color:var(--color-accent)}
        .nl-card-title{font-family:var(--font-display);font-weight:900;font-size:20px;letter-spacing:-.03em}
        .nl-card-sub{font-size:12px;color:var(--color-text-faint);margin-top:3px}
        .nl-form{display:flex;flex-direction:column;gap:12px}
        .nl-input-wrap{display:flex;align-items:center;gap:10px;min-height:52px;padding:0 15px;border:1px solid var(--color-border);border-radius:13px;background:var(--color-bg);color:var(--color-text-faint)}
        .nl-input-wrap:focus-within{border-color:var(--color-accent);box-shadow:0 0 0 3px var(--color-accent-subtle)}
        .nl-input-wrap input{width:100%;border:0;outline:0;background:transparent;color:var(--color-text);font:inherit;font-size:14px}
        .nl-input-wrap input::placeholder{color:var(--color-text-faint)}
        .nl-submit{width:100%;justify-content:center;min-height:52px}
        .nl-consent{font-size:10.5px;line-height:1.55;color:var(--color-text-faint);margin:2px 0 0}
        .nl-honeypot{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}
        .nl-form-success{display:flex;gap:14px;padding:16px;border:1px solid var(--color-accent);border-radius:14px;background:var(--color-accent-subtle);color:var(--color-text)}
        .nl-success-icon{display:grid;place-items:center;flex-shrink:0;width:34px;height:34px;border-radius:50%;background:var(--color-accent);color:#fff}
        .nl-form-success strong{font-size:14px}.nl-form-success p{margin:4px 0 0;color:var(--color-text-muted);font-size:12px;line-height:1.55}
        .nl-error{margin:0;color:var(--color-accent);font-size:12px}
        .nl-spin{animation:nlspin .8s linear infinite}@keyframes nlspin{to{transform:rotate(360deg)}}
        .nl-section{padding:clamp(70px,9vw,120px) 0;border-bottom:1px solid var(--color-divider)}
        .nl-section-head{max-width:700px;margin-bottom:44px}.nl-kicker{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--color-accent);margin-bottom:10px}.nl-h2{font-family:var(--font-display);font-size:clamp(2rem,4vw,3.5rem);font-weight:900;line-height:1;letter-spacing:-.05em;margin:0 0 14px}.nl-muted{color:var(--color-text-muted);line-height:1.7;margin:0}
        .nl-benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.nl-benefit{padding:24px;border:1px solid var(--color-border);border-radius:18px;background:var(--color-surface);transition:transform .2s,border-color .2s}.nl-benefit:hover{transform:translateY(-3px);border-color:var(--color-accent)}.nl-benefit-icon{display:grid;place-items:center;width:40px;height:40px;margin-bottom:18px;border-radius:12px;background:var(--color-surface-offset);color:var(--color-accent)}.nl-benefit h3{font-family:var(--font-display);font-size:18px;font-weight:800;letter-spacing:-.03em;margin:0 0 8px}.nl-benefit p{font-size:13px;line-height:1.65;color:var(--color-text-muted);margin:0}
        .nl-value{display:grid;grid-template-columns:1fr 1fr;gap:clamp(30px,7vw,100px);align-items:center}.nl-compare{display:grid;grid-template-columns:1fr auto 1fr;align-items:stretch;border:1px solid var(--color-border);border-radius:20px;overflow:hidden;background:var(--color-surface)}.nl-compare-col{padding:26px}.nl-compare-col h3{font-family:var(--font-display);font-size:15px;text-transform:uppercase;letter-spacing:.08em;margin:0 0 18px}.nl-compare-col ul{list-style:none;padding:0;margin:0;display:grid;gap:12px}.nl-compare-col li{font-size:13px;color:var(--color-text-muted)}.nl-compare-arrow{display:grid;place-items:center;padding:0 10px;color:var(--color-accent);font-weight:900}
        .nl-preview{max-width:650px;margin:0 auto;border:1px solid var(--color-border);border-radius:22px;background:var(--color-surface);overflow:hidden;box-shadow:var(--shadow-lg)}.nl-preview-top{padding:20px 22px;border-bottom:1px solid var(--color-divider);font-family:var(--font-display);font-weight:900}.nl-preview-body{padding:24px}.nl-preview-img{height:210px;border-radius:14px;background:linear-gradient(135deg,var(--color-surface-offset),var(--color-bg));display:grid;place-items:center;color:var(--color-text-faint);font-size:11px;letter-spacing:.1em;text-transform:uppercase}.nl-preview h3{font-family:var(--font-display);font-size:25px;line-height:1.05;letter-spacing:-.04em;margin:22px 0 8px}.nl-preview p{font-size:13px;line-height:1.65;color:var(--color-text-muted);margin:0 0 18px}.nl-preview-link{color:var(--color-accent);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
        .nl-about{display:grid;grid-template-columns:auto 1fr;gap:24px;max-width:850px}.nl-about-line{width:3px;border-radius:999px;background:linear-gradient(to bottom,var(--color-accent),transparent)}
        .nl-faq{max-width:850px;display:grid;gap:10px}.nl-faq details{border:1px solid var(--color-border);border-radius:14px;background:var(--color-surface);padding:0 18px}.nl-faq summary{cursor:pointer;list-style:none;padding:18px 0;font-weight:700;font-size:14px;display:flex;justify-content:space-between;gap:16px}.nl-faq summary::-webkit-details-marker{display:none}.nl-faq summary::after{content:'+';color:var(--color-accent);font-size:18px}.nl-faq details[open] summary::after{content:'−'}.nl-faq p{margin:0 0 18px;color:var(--color-text-muted);font-size:13px;line-height:1.7}
        .nl-final{text-align:center;padding:clamp(70px,10vw,130px) 0}.nl-final .nl-h2{max-width:760px;margin:0 auto 16px}.nl-final-form{max-width:520px;margin:30px auto 0}.nl-back{display:inline-flex;align-items:center;gap:7px;margin-top:24px;color:var(--color-text-faint);font-size:12px;text-decoration:none}.nl-back:hover{color:var(--color-accent)}
        @media(max-width:900px){.nl-hero-grid,.nl-value{grid-template-columns:1fr}.nl-benefits{grid-template-columns:repeat(2,1fr)}.nl-card{max-width:620px}}
        @media(max-width:560px){.nl-hero{padding-top:58px}.nl-benefits{grid-template-columns:1fr}.nl-compare{grid-template-columns:1fr}.nl-compare-arrow{padding:8px;transform:rotate(90deg)}.nl-compare-col{padding:22px}.nl-about{grid-template-columns:2px 1fr}.nl-title{font-size:clamp(2.8rem,15vw,4.5rem)}}
      `}</style>

      <main className="nl-page">
        <section className="nl-hero">
          <div className="container nl-hero-grid">
            <div>
              <div className="nl-eyebrow"><Mail size={13}/> AirShow Alert</div>
              <h1 className="nl-title">Nie przegap<br/><span>kolejnego Air Show.</span></h1>
              <p className="nl-lead">Pokazy lotnicze, ważne aktualizacje, nowe galerie i lotnicze ciekawostki — zebrane w jednym miejscu i dostarczone prosto na Twój e-mail.</p>
              <div className="nl-trust"><span><Check size={14}/> Bezpłatnie</span><span><Check size={14}/> 1–2 wiadomości miesięcznie</span><span><Check size={14}/> Bez spamu</span></div>
            </div>
            <div className="nl-card">
              <div className="nl-card-top"><div className="nl-card-icon"><Sparkles size={19}/></div><div><div className="nl-card-title">Dołącz do AirShow Alert</div><div className="nl-card-sub">Zapis zajmuje kilka sekund.</div></div></div>
              <NewsletterForm />
            </div>
          </div>
        </section>

        <section className="nl-section"><div className="container"><div className="nl-section-head"><div className="nl-kicker">Co otrzymasz?</div><h2 className="nl-h2">Tylko rzeczy, które warto przeczytać.</h2><p className="nl-muted">Nie chcemy być kolejnym newsletterem, który ląduje w koszu. AirShow Alert ma pomagać Ci być na bieżąco ze światem pokazów lotniczych.</p></div><div className="nl-benefits">{benefits.map(({icon:Icon,title,text})=><article className="nl-benefit" key={title}><div className="nl-benefit-icon"><Icon size={19}/></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

        <section className="nl-section"><div className="container nl-value"><div><div className="nl-kicker">Po co się zapisywać?</div><h2 className="nl-h2">Zamiast codziennie szukać informacji — dostajesz je w jednym miejscu.</h2><p className="nl-muted">Nie musisz pamiętać terminów, sprawdzać wielu stron organizatorów ani zaglądać codziennie do galerii. Wybieramy informacje, które mogą być dla Ciebie przydatne.</p></div><div className="nl-compare"><div className="nl-compare-col"><h3>Bez alertu</h3><ul><li>🔎 Szukasz wydarzeń</li><li>📅 Pamiętasz daty</li><li>🔔 Sprawdzasz aktualizacje</li><li>📸 Szukasz nowych galerii</li></ul></div><div className="nl-compare-arrow">→</div><div className="nl-compare-col"><h3>AirShow Alert</h3><ul><li>✈️ Najważniejsze pokazy</li><li>📅 Przydatne daty</li><li>🔔 Ważne zmiany</li><li>📸 Nowe zdjęcia</li></ul></div></div></div></section>

        <section className="nl-section"><div className="container"><div className="nl-section-head" style={{marginInline:"auto",textAlign:"center"}}><div className="nl-kicker">Zobacz wcześniej</div><h2 className="nl-h2">Tak może wyglądać Twoja wiadomość.</h2><p className="nl-muted">Dużo fotografii, krótkie informacje i linki prowadzące prosto do AirShow Gallery.</p></div><div className="nl-preview"><div className="nl-preview-top">✈️ AIRSHOW ALERT #04</div><div className="nl-preview-body"><div className="nl-preview-img">miejsce na zdjęcie z galerii</div><h3>5 pokazów, które warto mieć w kalendarzu</h3><p>🇵🇱 Polska · 🇨🇿 Czechy · 🇩🇪 Niemcy<br/><br/>📸 Zdjęcie miesiąca · 🔔 Ważna aktualizacja · 🛩️ Lotnicza ciekawostka</p><span className="nl-preview-link">Zobacz wydarzenie →</span></div></div></div></section>

        <section className="nl-section"><div className="container"><div className="nl-about"><div className="nl-about-line"/><div><div className="nl-kicker">Tworzone z pasji</div><h2 className="nl-h2">Nie musisz być profesjonalnym fotografem.</h2><p className="nl-muted">AirShow Gallery to niezależny projekt tworzony z pasji do lotnictwa, pokazów i fotografii. AirShow Alert powstał po to, aby łatwiej było znaleźć wydarzenia i informacje, które sami chcielibyśmy mieć przed wyjazdem na air show.</p></div></div></div></section>

        <section className="nl-section"><div className="container"><div className="nl-section-head"><div className="nl-kicker">FAQ</div><h2 className="nl-h2">Najczęstsze pytania</h2></div><div className="nl-faq">{faq.map(([question,answer])=><details key={question}><summary>{question}<ChevronDown size={16}/></summary><p>{answer}</p></details>)}</div></div></section>

        <section className="nl-final"><div className="container"><div className="nl-kicker">Dołącz bezpłatnie</div><h2 className="nl-h2">Bądź bliżej kolejnego Air Show.</h2><p className="nl-muted">Zapisz się do AirShow Alert i nie przegap tego, co dzieje się na niebie.</p><div className="nl-final-form"><NewsletterForm /></div><Link className="nl-back" href="/">← Wróć do AirShow Gallery <ArrowRight size={13}/></Link></div></section>
      </main>
    </>
  );
}
