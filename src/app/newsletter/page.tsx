import type { Metadata } from "next";
import { ArrowRight, Bell, CalendarDays, Camera, Check, ChevronDown, Mail, MapPin, Newspaper, Plane, ShieldCheck } from "lucide-react";
import NewsletterForm from "@/components/newsletter/NewsletterForm";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://airshow-gallery.vercel.app").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "AirShow Alert – informacje o pokazach lotniczych | AirShow Gallery",
  description: "Bezpłatny AirShow Alert: najciekawsze pokazy, ważne aktualizacje, nowe galerie i lotnicze ciekawostki prosto na Twój e-mail.",
  alternates: { canonical: `${SITE_URL}/newsletter` },
  openGraph: {
    type: "website", url: `${SITE_URL}/newsletter`,
    title: "AirShow Alert – nie przegap kolejnego Air Show",
    description: "Pokazy, aktualizacje i nowe galerie. Bez spamu, bez zbędnych wiadomości.",
    siteName: "AirShow Gallery", locale: "pl_PL",
  },
};

const benefits = [
  { icon: CalendarDays, title: "Nadchodzące pokazy", text: "Wybrane wydarzenia w Polsce i Europie, które warto mieć w kalendarzu." },
  { icon: Bell, title: "Ważne aktualizacje", text: "Programy, uczestnicy i zmiany, gdy pojawia się coś naprawdę istotnego." },
  { icon: Camera, title: "Nowe galerie", text: "Wybrane zdjęcia i informacje o nowych materiałach na AirShow Gallery." },
  { icon: Plane, title: "Lotnicze ciekawostki", text: "Samoloty, zespoły i historie dla każdego, kto lubi lotnictwo." },
  { icon: Newspaper, title: "Nowe artykuły", text: "Najciekawsze materiały z AirShow Journal — bez konieczności ich szukania." },
  { icon: MapPin, title: "Przydatne informacje", text: "Wskazówki przed wyjazdem na pokaz, również z perspektywy spottera." },
];

const faq = [
  ["Co będę otrzymywać?", "Informacje o wybranych pokazach, ważne aktualizacje, nowe galerie, artykuły i ciekawostki lotnicze. Nie wysyłamy wiadomości tylko po to, żeby coś wysłać."],
  ["Jak często wysyłacie newsletter?", "Zwykle 1–2 razy w miesiącu. Dodatkowy e-mail może pojawić się przy ważnej aktualizacji wydarzenia."],
  ["Czy AirShow Alert jest bezpłatny?", "Tak. Zapis jest bezpłatny i nie wymaga podawania imienia, nazwiska ani numeru telefonu."],
  ["Czy muszę być fotografem?", "Nie. Newsletter jest dla pasjonatów lotnictwa, osób odwiedzających air show, spotterów i fotografów — także początkujących."],
  ["Co dzieje się po zapisaniu?", "Otrzymasz wiadomość z prośbą o potwierdzenie adresu. Dopiero po potwierdzeniu aktywujemy subskrypcję."],
  ["Czy mogę zrezygnować?", "Tak. W każdej wiadomości znajdziesz prosty link do wypisania się."],
];

export default function NewsletterPage() {
  return (
    <main className="nl-page">
      <style>{`
        .nl-page{padding-top:64px;background:var(--color-bg);overflow:hidden}.nl-container{width:min(1120px,calc(100% - 40px));margin:0 auto}
        .nl-hero{padding:clamp(72px,10vw,128px) 0 88px;border-bottom:1px solid var(--color-divider);background:radial-gradient(circle at 82% 20%,var(--color-accent-subtle),transparent 30%)}
        .nl-hero-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(340px,.72fr);gap:clamp(40px,7vw,96px);align-items:center}.nl-kicker{margin-bottom:14px;color:var(--color-accent);font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.nl-title{max-width:780px;margin:0 0 22px;font-family:var(--font-display);font-size:clamp(3.2rem,7vw,6.8rem);font-weight:900;line-height:.9;letter-spacing:-.065em}.nl-title span{color:var(--color-accent)}.nl-lead{max-width:680px;margin:0 0 28px;color:var(--color-text-muted);font-size:clamp(1rem,1.5vw,1.18rem);line-height:1.75}.nl-points{display:flex;flex-wrap:wrap;gap:8px 18px;color:var(--color-text-faint);font-size:12px;font-weight:700}.nl-points span{display:flex;align-items:center;gap:6px}
        .nl-form-card{padding:30px;border:1px solid var(--color-border);border-radius:20px;background:var(--color-surface);box-shadow:var(--shadow-lg)}.nl-form-title{margin:0 0 5px;font-family:var(--font-display);font-size:22px;font-weight:900;letter-spacing:-.035em}.nl-form-sub{margin:0 0 22px;color:var(--color-text-faint);font-size:12px}.nl-form{display:flex;flex-direction:column;gap:12px}.nl-input-wrap{display:flex;align-items:center;gap:10px;min-height:52px;padding:0 15px;border:1px solid var(--color-border);border-radius:12px;background:var(--color-bg);color:var(--color-text-faint)}.nl-input-wrap:focus-within{border-color:var(--color-accent);box-shadow:0 0 0 3px var(--color-accent-subtle)}.nl-input-wrap input{width:100%;border:0;outline:0;background:transparent;color:var(--color-text);font:inherit;font-size:14px}.nl-input-wrap input::placeholder{color:var(--color-text-faint)}.nl-submit{width:100%;min-height:50px;justify-content:center}.nl-consent{margin:0;color:var(--color-text-faint);font-size:10.5px;line-height:1.55}.nl-honeypot{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}.nl-form-success{display:flex;gap:12px;padding:15px;border:1px solid var(--color-accent);border-radius:13px;background:var(--color-accent-subtle)}.nl-success-icon{display:grid;place-items:center;flex:0 0 32px;height:32px;border-radius:50%;background:var(--color-accent);color:#fff}.nl-form-success strong{font-size:13px}.nl-form-success p{margin:3px 0 0;color:var(--color-text-muted);font-size:12px;line-height:1.5}.nl-error{margin:0;color:var(--color-accent);font-size:12px}.nl-spin{animation:nlspin .8s linear infinite}@keyframes nlspin{to{transform:rotate(360deg)}}
        .nl-section{padding:clamp(72px,9vw,112px) 0;border-bottom:1px solid var(--color-divider)}.nl-head{max-width:680px;margin-bottom:42px}.nl-h2{margin:0 0 13px;font-family:var(--font-display);font-size:clamp(2.1rem,4vw,3.7rem);font-weight:900;line-height:.98;letter-spacing:-.055em}.nl-muted{margin:0;color:var(--color-text-muted);line-height:1.7}
        .nl-benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.nl-benefit{padding:25px;border:1px solid var(--color-border);border-radius:17px;background:var(--color-surface);transition:transform .2s,border-color .2s}.nl-benefit:hover{transform:translateY(-2px);border-color:var(--color-accent)}.nl-icon{display:grid;place-items:center;width:38px;height:38px;margin-bottom:17px;border-radius:11px;background:var(--color-surface-offset);color:var(--color-accent)}.nl-benefit h3{margin:0 0 7px;font-family:var(--font-display);font-size:17px;font-weight:800;letter-spacing:-.025em}.nl-benefit p{margin:0;color:var(--color-text-muted);font-size:13px;line-height:1.62}
        .nl-editorial{display:grid;grid-template-columns:.8fr 1.2fr;gap:clamp(35px,8vw,100px);align-items:start}.nl-editorial-note{padding-left:22px;border-left:3px solid var(--color-accent)}.nl-editorial-note p{margin:0;color:var(--color-text-muted);font-size:14px;line-height:1.8}.nl-preview{border:1px solid var(--color-border);border-radius:18px;overflow:hidden;background:var(--color-surface);box-shadow:var(--shadow-lg)}.nl-preview-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--color-divider);font-size:11px;font-weight:800;letter-spacing:.08em}.nl-preview-tag{color:var(--color-accent)}.nl-preview-body{padding:20px}.nl-preview-photo{height:210px;border-radius:12px;background:linear-gradient(135deg,var(--color-surface-offset),var(--color-bg));display:grid;place-items:center;color:var(--color-text-faint);font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.nl-preview h3{margin:18px 0 7px;font-family:var(--font-display);font-size:24px;line-height:1.05;letter-spacing:-.04em}.nl-preview p{margin:0;color:var(--color-text-muted);font-size:12px;line-height:1.65}.nl-preview-cta{display:inline-flex;align-items:center;gap:6px;margin-top:16px;color:var(--color-accent);font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
        .nl-faq-wrap{max-width:850px}.nl-faq{display:grid;gap:8px}.nl-faq details{border:1px solid var(--color-border);border-radius:12px;background:var(--color-surface);overflow:hidden}.nl-faq summary{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:19px 20px;cursor:pointer;list-style:none;font-size:14px;font-weight:700}.nl-faq summary::-webkit-details-marker{display:none}.nl-faq summary svg{flex-shrink:0;color:var(--color-text-faint);transition:transform .2s}.nl-faq details[open] summary svg{transform:rotate(180deg);color:var(--color-accent)}.nl-faq p{max-width:760px;margin:0;padding:0 20px 20px;color:var(--color-text-muted);font-size:13px;line-height:1.7}
        .nl-final{padding:clamp(80px,11vw,135px) 0;text-align:center;background:radial-gradient(circle at 50% 0,var(--color-accent-subtle),transparent 34%)}.nl-final .nl-head{margin:0 auto 28px}.nl-final-form{max-width:520px;margin:0 auto}.nl-final-note{display:flex;justify-content:center;align-items:center;gap:7px;margin-top:16px;color:var(--color-text-faint);font-size:11px}.nl-back{display:inline-flex;align-items:center;gap:6px;margin-top:28px;color:var(--color-text-faint);font-size:11px;text-decoration:none}.nl-back:hover{color:var(--color-accent)}
        @media(max-width:900px){.nl-hero-grid,.nl-editorial{grid-template-columns:1fr}.nl-form-card{max-width:620px}.nl-benefits{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.nl-container{width:min(100% - 28px,1120px)}.nl-hero{padding-top:55px}.nl-benefits{grid-template-columns:1fr}.nl-form-card{padding:22px}.nl-title{font-size:clamp(3rem,15vw,4.4rem)}.nl-preview-photo{height:170px}.nl-faq summary{padding:17px 16px}.nl-faq p{padding:0 16px 17px}}
      `}</style>

      <section className="nl-hero">
        <div className="nl-container nl-hero-grid">
          <div>
            <div className="nl-kicker">AirShow Alert</div>
            <h1 className="nl-title">Nie przegap<br/><span>kolejnego Air Show.</span></h1>
            <p className="nl-lead">Najciekawsze pokazy, ważne aktualizacje, nowe galerie i rzeczy, które naprawdę warto wiedzieć o świecie lotnictwa. Prosto na Twój e-mail.</p>
            <div className="nl-points"><span><Check size={14}/> Bezpłatnie</span><span><Check size={14}/> 1–2 razy w miesiącu</span><span><Check size={14}/> Bez spamu</span></div>
          </div>
          <div className="nl-form-card">
            <h2 className="nl-form-title">Dołącz do AirShow Alert</h2>
            <p className="nl-form-sub">Zapis zajmuje kilka sekund.</p>
            <NewsletterForm />
          </div>
        </div>
      </section>

      <section className="nl-section"><div className="nl-container"><div className="nl-head"><div className="nl-kicker">Co otrzymasz?</div><h2 className="nl-h2">Mniej szukania. Więcej lotnictwa.</h2><p className="nl-muted">AirShow Alert ma być użyteczny. Wysyłamy informacje, które pomagają zaplanować wyjazd, odkryć nowe zdjęcia albo po prostu być bliżej świata air show.</p></div><div className="nl-benefits">{benefits.map(({icon:Icon,title,text})=><article className="nl-benefit" key={title}><div className="nl-icon"><Icon size={18}/></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

      <section className="nl-section"><div className="nl-container nl-editorial"><div><div className="nl-kicker">Jak to wygląda?</div><h2 className="nl-h2">Krótko, konkretnie, z dużą ilością fotografii.</h2><div className="nl-editorial-note"><p>Nie chcemy tworzyć kolejnego maila, którego po kilku tygodniach zaczniesz ignorować. AirShow Alert będzie spokojnym, selektywnym dodatkiem do AirShow Gallery — z najważniejszymi rzeczami na pierwszym miejscu.</p></div></div><div className="nl-preview"><div className="nl-preview-head"><span>AIRSHOW ALERT</span><span className="nl-preview-tag">WYDANIE #04</span></div><div className="nl-preview-body"><div className="nl-preview-photo">miejsce na zdjęcie z air show</div><h3>5 pokazów, które warto mieć w kalendarzu</h3><p>🇵🇱 Polska · 🇨🇿 Czechy · 🇩🇪 Niemcy<br/><br/>📸 Zdjęcie miesiąca &nbsp; · &nbsp; 🔔 Ważna aktualizacja &nbsp; · &nbsp; 🛩️ Ciekawostka</p><span className="nl-preview-cta">Zobacz na AirShow Gallery <ArrowRight size={13}/></span></div></div></div></section>

      <section className="nl-section"><div className="nl-container"><div className="nl-head"><div className="nl-kicker">Dla kogo?</div><h2 className="nl-h2">Dla ludzi, którzy po prostu lubią lotnictwo.</h2><p className="nl-muted">Nie musisz być profesjonalnym fotografem ani ekspertem. Wystarczy, że air show, samoloty albo fotografia lotnicza Cię interesują.</p></div><div className="nl-editorial-note" style={{maxWidth:760}}><p>AirShow Gallery to niezależny projekt tworzony z pasji. AirShow Alert jest jego naturalnym przedłużeniem — sposobem, żeby nie zgubić się wśród wszystkich wydarzeń i informacji pojawiających się w sezonie.</p></div></div></section>

      <section className="nl-section"><div className="nl-container nl-faq-wrap"><div className="nl-head"><div className="nl-kicker">FAQ</div><h2 className="nl-h2">Masz pytanie?</h2><p className="nl-muted">Najważniejsze informacje przed zapisaniem się.</p></div><div className="nl-faq">{faq.map(([question,answer])=><details key={question}><summary><span>{question}</span><ChevronDown size={17}/></summary><p>{answer}</p></details>)}</div></div></section>

      <section className="nl-final"><div className="nl-container"><div className="nl-head"><div className="nl-kicker">Dołącz bezpłatnie</div><h2 className="nl-h2">Bądź na bieżąco z tym, co dzieje się na niebie.</h2><p className="nl-muted">Jeden adres e-mail. Najważniejsze informacje. Bez zbędnego hałasu.</p></div><div className="nl-final-form"><NewsletterForm /></div><div className="nl-final-note"><ShieldCheck size={14}/> Twój adres nie będzie używany do wysyłania spamu.</div><a className="nl-back" href="/">Wróć do AirShow Gallery</a></div></section>
    </main>
  );
}
