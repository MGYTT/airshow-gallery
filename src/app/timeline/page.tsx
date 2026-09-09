"use client";

import Link from "next/link";
import { ArrowDown, ArrowLeft, Plane, Target } from "lucide-react";

const timeline = [
  { year: "~2010", kicker: "POCZĄTEK", title: "Wszystko zaczęło się od pikników", text: "Gdy byłem mały, rodzice zabierali mnie na pikniki lotnicze w Nowym Targu. Pamiętam przede wszystkim emocje — samoloty na niebie, ogromną liczbę maszyn, hałas i ryk silników. Wtedy nie znałem jeszcze nazw samolotów ani nie wiedziałem zbyt wiele o lotnictwie. Po prostu uwielbiałem patrzeć w niebo." },
  { year: "2021", kicker: "ZAINTERESOWANIE", title: "Zacząłem patrzeć w niebo inaczej", text: "Zwykłe jeżdżenie na pokazy zaczęło przeradzać się w prawdziwą ciekawość lotnictwa. Coraz częściej sprawdzałem, jakie samoloty przelatują nade mną, kto je wyprodukował, do jakiej linii należą i skąd oraz dokąd lecą." },
  { year: "2021+", kicker: "F-16", title: "Zapalnik do pasji", text: "Szczególne miejsce zajęły dla mnie samoloty myśliwskie. Duży wpływ na moje zainteresowanie F-16 miał śp. ppłk pil. Maciej „Slab” Krakowian, pilot F-16 i lider F-16 Tiger Demo Team Poland. To właśnie on był jednym z głównych zapalników, które skierowały moją pasję mocniej w stronę myśliwców, ich możliwości i potężnych silników." },
  { year: "PÓŹNIEJ", kicker: "FOTOGRAFIA", title: "Pierwsze zdjęcia", text: "W pewnym momencie samo oglądanie samolotów przestało mi wystarczać. Chciałem je również zatrzymywać na zdjęciach. Zaczynałem starym Lumixem — bez dużego obiektywu, wielkiej matrycy i jakości współczesnego sprzętu. Najważniejsze było jednak to, że mogłem spróbować uchwycić samolot i zachować ten moment na dłużej." },
  { year: "2025", kicker: "NATO DAYS", title: "Pierwszy poważny wyjazd", text: "NATO Days w Czechach były moim pierwszym naprawdę poważnym wyjazdem fotograficznym. Byłem ogromnie podekscytowany, wiedząc, że zobaczę i będę fotografował maszyny, które wcześniej znałem głównie ze zdjęć i filmów — od Eurofightera Typhoona po B-52. Ten wyjazd pokazał mi, jak bardzo chcę rozwijać się w fotografii lotniczej." },
  { year: "2026", kicker: "MGYT SPOTTING", title: "Własna nazwa, własna droga", text: "MGYT to moja własna nazwa, a „spotting” najlepiej opisuje to, czym się zajmuję — obserwowaniem i fotografowaniem samolotów. Znam twórczość fotografów takich jak Hesja czy Gawronsky, ale nie znam ich osobiście i nigdy nie miałem z nimi kontaktu. Po prostu wiem, że istnieją i doceniam ich pracę. Nie porównuję się do nich — każdy ma swoją drogę i sposób patrzenia na lotnictwo." },
  { year: "2026", kicker: "AIRSHOW GALLERY", title: "Własne miejsce w internecie", text: "Chciałem pokazywać swoje zdjęcia nie tylko na Instagramie. Inspiracją były strony innych fotografów lotniczych, ale przede wszystkim chciałem stworzyć własne miejsce i własne archiwum. Tak powstała MGYT AirShow Gallery — galeria połączona z kalendarzem wydarzeń lotniczych i miejscem, które może rozwijać się razem z moją pasją." },
  { year: "TERAZ", kicker: "DALSZY ROZWÓJ", title: "To dopiero początek", text: "Najbardziej interesują mnie starsze konstrukcje wojskowe, samoloty myśliwskie oraz ciężkie samoloty transportowe i odrzutowe. Chcę poprawiać jakość zdjęć, rozwijać swoje umiejętności i odwiedzać coraz więcej pokazów lotniczych." },
];

export default function TimelinePage() {
  return (
    <main className="timeline-page">
      <style jsx>{`
        .timeline-page { min-height: 100vh; overflow: hidden; background: var(--color-bg); }
        .hero { max-width: 1120px; margin: 0 auto; padding: 72px 24px 56px; }
        .back { display: inline-flex; align-items: center; gap: 10px; color: var(--color-text-muted); font-size: 12px; font-weight: 700; letter-spacing: .02em; text-decoration: none; margin-bottom: 56px; padding: 7px 12px 7px 7px; border: 1px solid var(--color-border); border-radius: 999px; background: color-mix(in srgb, var(--color-bg) 88%, var(--color-text) 12%); box-shadow: 0 8px 28px rgba(0,0,0,.08); transition: color .2s ease, border-color .2s ease, background .2s ease, transform .2s ease, box-shadow .2s ease; }
        .back-icon { width: 25px; height: 25px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; color: var(--color-text); background: var(--color-border); transition: color .2s ease, background .2s ease, transform .2s ease; }
        .back:hover { color: var(--color-text); border-color: color-mix(in srgb, var(--color-accent) 42%, var(--color-border)); background: color-mix(in srgb, var(--color-bg) 82%, var(--color-accent) 18%); transform: translateY(-2px); box-shadow: 0 12px 34px rgba(0,0,0,.12); }
        .back:hover .back-icon { color: #fff; background: var(--color-accent); transform: translateX(-2px); }
        .eyebrow { display: flex; align-items: center; gap: 10px; color: var(--color-accent); font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; margin-bottom: 18px; }
        .eyebrow::before { content: ""; width: 28px; height: 1px; background: var(--color-accent); }
        h1 { margin: 0; max-width: 760px; font-family: var(--font-display); font-size: clamp(3.2rem, 8vw, 7rem); line-height: .9; letter-spacing: -.065em; font-weight: 900; }
        .intro { max-width: 600px; margin: 28px 0 0; color: var(--color-text-muted); font-size: clamp(15px, 2vw, 18px); line-height: 1.75; }
        .scroll-hint { display: flex; align-items: center; gap: 9px; margin-top: 44px; color: var(--color-text-faint); font-size: 11px; text-transform: uppercase; letter-spacing: .13em; }
        .timeline-wrap { position: relative; max-width: 1000px; margin: 0 auto; padding: 30px 24px 120px; }
        .line { position: absolute; left: 50%; top: 0; bottom: 80px; width: 1px; background: var(--color-divider); transform: translateX(-50%); }
        .line::after { content: ""; position: absolute; top: 0; left: 0; width: 2px; height: 28%; background: linear-gradient(to bottom, var(--color-accent), transparent); box-shadow: 0 0 18px var(--color-accent); animation: lineGlow 4s ease-in-out infinite; }
        .event { position: relative; display: grid; grid-template-columns: 1fr 1fr; min-height: 270px; }
        .event:nth-child(odd) .content { grid-column: 1; text-align: right; padding-right: 80px; }
        .event:nth-child(even) .content { grid-column: 2; padding-left: 80px; }
        .content { align-self: start; padding-top: 12px; animation: reveal .8s cubic-bezier(.16,1,.3,1) both; }
        .year { font-family: var(--font-display); font-size: clamp(2.1rem, 5vw, 4rem); font-weight: 900; line-height: 1; letter-spacing: -.06em; color: var(--color-text); }
        .kicker { margin-top: 10px; color: var(--color-accent); font-size: 10px; font-weight: 800; letter-spacing: .16em; }
        .title { margin: 12px 0 12px; font-family: var(--font-display); font-size: clamp(1.25rem, 2.5vw, 1.8rem); line-height: 1.05; letter-spacing: -.035em; font-weight: 800; }
        .text { margin: 0; color: var(--color-text-muted); font-size: 14px; line-height: 1.75; max-width: 430px; }
        .event:nth-child(odd) .text { margin-left: auto; }
        .marker { position: absolute; z-index: 2; top: 15px; left: 50%; width: 13px; height: 13px; border: 3px solid var(--color-bg); border-radius: 50%; background: var(--color-accent); transform: translateX(-50%); box-shadow: 0 0 0 1px var(--color-accent), 0 0 18px var(--color-accent); transition: transform .3s ease, box-shadow .3s ease; }
        .event:hover .marker { transform: translateX(-50%) scale(1.35); box-shadow: 0 0 0 1px var(--color-accent), 0 0 28px var(--color-accent); }
        .event:hover .year { color: var(--color-accent); transition: color .25s ease; }
        .final { max-width: 760px; margin: 10px auto 0; padding: 72px 24px 110px; text-align: center; border-top: 1px solid var(--color-divider); }
        .final-icon { width: 46px; height: 46px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--color-border); border-radius: 50%; color: var(--color-accent); margin-bottom: 24px; animation: float 3s ease-in-out infinite; }
        .final h2 { margin: 0; font-family: var(--font-display); font-size: clamp(2.4rem, 6vw, 5rem); line-height: .95; letter-spacing: -.06em; font-weight: 900; }
        .final p { max-width: 520px; margin: 22px auto 0; color: var(--color-text-muted); line-height: 1.7; }
        .future { display: inline-flex; align-items: center; gap: 8px; margin-top: 28px; padding: 9px 14px; border: 1px solid var(--color-border); border-radius: 999px; color: var(--color-text-muted); font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        .future svg { color: var(--color-accent); }
        @keyframes reveal { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lineGlow { 0%,100% { opacity: .45; } 50% { opacity: 1; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @media (max-width: 700px) {
          .hero { padding: 28px 18px 34px; }
          .back { gap: 8px; margin-bottom: 32px; padding: 6px 11px 6px 6px; font-size: 11px; box-shadow: none; }
          .back-icon { width: 24px; height: 24px; }
          .eyebrow { font-size: 9px; letter-spacing: .13em; margin-bottom: 14px; }
          .eyebrow::before { width: 20px; }
          h1 { font-size: clamp(3rem, 16vw, 4.5rem); line-height: .88; }
          .intro { margin-top: 20px; font-size: 14px; line-height: 1.65; }
          .scroll-hint { margin-top: 28px; font-size: 9px; letter-spacing: .11em; }
          .timeline-wrap { margin: 0; padding: 8px 18px 62px 62px; }
          .line { left: 29px; top: 0; bottom: 28px; background: linear-gradient(to bottom, var(--color-divider), transparent); }
          .line::after { width: 2px; height: 22%; box-shadow: 0 0 12px var(--color-accent); }
          .event { display: block; min-height: 0; padding: 0 0 48px; }
          .event:nth-child(odd) .content, .event:nth-child(even) .content { padding: 0; text-align: left; }
          .marker { left: 29px; top: 2px; width: 11px; height: 11px; border-width: 2px; box-shadow: 0 0 0 1px var(--color-accent), 0 0 12px var(--color-accent); }
          .event:hover .marker { transform: translateX(-50%); box-shadow: 0 0 0 1px var(--color-accent), 0 0 12px var(--color-accent); }
          .content { animation: revealMobile .65s cubic-bezier(.16,1,.3,1) both; }
          .year { font-size: 2.45rem; letter-spacing: -.055em; }
          .kicker { margin-top: 7px; font-size: 9px; letter-spacing: .14em; }
          .title { margin: 9px 0 10px; font-size: 1.35rem; line-height: 1.08; }
          .text { font-size: 13px; line-height: 1.7; max-width: none; }
          .final { margin-top: 0; padding: 52px 18px 74px; }
          .final-icon { width: 42px; height: 42px; margin-bottom: 20px; }
          .final h2 { font-size: clamp(2.35rem, 12vw, 3.5rem); }
          .final p { margin-top: 18px; font-size: 13px; line-height: 1.65; }
          .future { margin-top: 22px; padding: 8px 12px; font-size: 9px; }
        }
        @media (max-width: 380px) {
          .hero { padding-left: 16px; padding-right: 16px; }
          .timeline-wrap { padding-left: 56px; padding-right: 16px; }
          .line, .marker { left: 25px; }
          .year { font-size: 2.2rem; }
          .title { font-size: 1.22rem; }
          .text { font-size: 12.5px; }
        }
        @keyframes revealMobile { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) {
          .content, .line::after, .final-icon { animation: none; }
          .back, .back-icon, .marker, .event:hover .marker { transition: none; }
        }
      `}</style>

      <section className="hero">
        <Link href="/" className="back">
          <span className="back-icon"><ArrowLeft size={13} strokeWidth={2.5} /></span>
          <span>Wróć na stronę główną</span>
        </Link>
        <div className="eyebrow">MGYT SPOTTING · TIMELINE</div>
        <h1>Moja historia.</h1>
        <p className="intro">Od pierwszych pikników lotniczych w Nowym Targu, przez fascynację F-16, aż po własne fotograficzne archiwum. Ta historia nadal się pisze.</p>
        <div className="scroll-hint"><ArrowDown size={13} /> Przewiń, aby poznać historię</div>
      </section>

      <section className="timeline-wrap" aria-label="Oś czasu MGYT Spotting">
        <div className="line" aria-hidden="true" />
        {timeline.map((item, index) => (
          <article className="event" key={`${item.year}-${index}`}>
            <span className="marker" aria-hidden="true" />
            <div className="content">
              <div className="year">{item.year}</div>
              <div className="kicker">{item.kicker}</div>
              <h2 className="title">{item.title}</h2>
              <p className="text">{item.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="final">
        <span className="final-icon"><Target size={20} /></span>
        <h2>To dopiero początek.</h2>
        <p>Chcę dalej rozwijać swoje umiejętności, odwiedzać coraz więcej pokazów i poznawać kolejne niezwykłe maszyny.</p>
        <span className="future"><Plane size={13} /> Następny cel · RIAT</span>
      </section>
    </main>
  );
}
