"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar, MapPin, CheckCircle2, Clock, Globe,
  ChevronRight, ArrowLeft, Plane, AlertCircle,
} from "lucide-react";

// ── Dane ─────────────────────────────────────────────────────

type EventStatus = "done" | "soon" | "upcoming";
type EventTab    = "polska" | "zagranica";

interface AirEvent {
  name:     string;
  location: string;
  date:     string;
  dateSort: string; // YYYY-MM-DD dla sortowania
  status:   EventStatus;
  tab:      EventTab;
  note?:    string;
}

const EVENTS: AirEvent[] = [
  // ── Polska — Odbyte ──
  { name: "Pokazy Lotnicze Air SKY",        location: "Piastów",              date: "25 kwietnia 2026",     dateSort: "2026-04-25", status: "done",     tab: "polska" },
  { name: "Aerosploty",                     location: "Bielsko-Biała",        date: "2 maja 2026",          dateSort: "2026-05-02", status: "done",     tab: "polska" },
  { name: "Świdnik Air Festival",           location: "Świdnik",              date: "13 czerwca 2026",      dateSort: "2026-06-13", status: "done",     tab: "polska" },
  { name: "ANTIDOTUM Airshow Leszno",       location: "Leszno",               date: "19–20 czerwca 2026",   dateSort: "2026-06-19", status: "done",     tab: "polska" },

  // ── Polska — Nadchodzące ──
  { name: "Odlotowe Suwałki Air Show",      location: "Suwałki",              date: "27–28 czerwca 2026",   dateSort: "2026-06-27", status: "soon",     tab: "polska" },
  { name: "Fly Fest",                       location: "Piotrków Trybunalski", date: "4–5 lipca 2026",       dateSort: "2026-07-04", status: "upcoming", tab: "polska" },
  { name: "Nowotarski Piknik Lotniczy",     location: "Nowy Targ",            date: "4–5 lipca 2026",       dateSort: "2026-07-04", status: "upcoming", tab: "polska" },
  { name: "Rodzinny Piknik Lotniczy",       location: "Gryźliny",             date: "4–5 lipca 2026",       dateSort: "2026-07-04", status: "upcoming", tab: "polska" },
  { name: "24. Szybowcowe Mistrzostwa Europy FAI", location: "Polska",        date: "11–25 lipca 2026",     dateSort: "2026-07-11", status: "upcoming", tab: "polska" },
  { name: "Aeropiknik w Paczkowie",         location: "Paczków",              date: "23–25 lipca 2026",     dateSort: "2026-07-23", status: "upcoming", tab: "polska" },
  { name: "Air Show Rudniki",               location: "Rudniki",              date: "31 lipca – 1 sierpnia 2026", dateSort: "2026-07-31", status: "upcoming", tab: "polska" },
  { name: "Mazury AirShow",                 location: "Kętrzyn-Wilamowo",     date: "1–2 sierpnia 2026",    dateSort: "2026-08-01", status: "upcoming", tab: "polska" },
  { name: "Płocki Piknik Lotniczy",         location: "Płock",                date: "7–8 sierpnia 2026",    dateSort: "2026-08-07", status: "upcoming", tab: "polska" },
  { name: "Leszczyńska Noc Balonowa",       location: "Leszno",               date: "28–30 sierpnia 2026",  dateSort: "2026-08-28", status: "upcoming", tab: "polska" },

  // ── Zagranica ──
  { name: "NATO Days 2026",                 location: "Ostrawa, Czechy",      date: "19–20 września 2026",  dateSort: "2026-09-19", status: "upcoming", tab: "zagranica", note: "Blisko Polski" },
  { name: "International Sanicole Airshow", location: "Hechtel-Eksel, Belgia", date: "12–13 września 2026", dateSort: "2026-09-12", status: "upcoming", tab: "zagranica", note: "Warte uwagi" },
];

// ── Helpers ───────────────────────────────────────────────────

const STATUS_CONFIG = {
  done:     { label: "Odbyte",      color: "var(--color-text-faint)",   bg: "var(--color-surface-offset)", icon: <CheckCircle2 size={11}/> },
  soon:     { label: "Już wkrótce", color: "var(--color-accent)",       bg: "var(--color-accent-subtle)",  icon: <AlertCircle size={11}/> },
  upcoming: { label: "Nadchodzące", color: "var(--color-gold)",         bg: "var(--color-gold-subtle)",    icon: <Clock size={11}/> },
};

function getNextEvent(tab: EventTab) {
  const now = new Date();
  return EVENTS
    .filter(e => e.tab === tab && e.status !== "done")
    .sort((a, b) => a.dateSort.localeCompare(b.dateSort))
    .find(e => new Date(e.dateSort) >= now);
}

// ── Karta eventu ─────────────────────────────────────────────

function EventCard({ event, isNext }: { event: AirEvent; isNext?: boolean }) {
  const cfg = STATUS_CONFIG[event.status];

  return (
    <div style={{
      display:        "grid",
      gridTemplateColumns: "auto 1fr auto",
      gap:            "var(--space-4)",
      alignItems:     "start",
      padding:        "var(--space-5)",
      borderRadius:   "var(--radius-xl)",
      background:     isNext ? "var(--color-accent-subtle)" : "var(--color-surface)",
      border:         `1px solid ${isNext ? "var(--color-accent)" : "var(--color-border)"}`,
      opacity:        event.status === "done" ? 0.55 : 1,
      transition:     "transform .2s ease, box-shadow .2s ease, opacity .2s",
      position:       "relative",
      overflow:       "hidden",
    }}
      onMouseEnter={e => {
        if (event.status === "done") return;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "";
      }}
    >
      {/* Ikona miesiąca / checkmark */}
      <div style={{
        width:          44,
        height:         44,
        borderRadius:   "var(--radius-lg)",
        background:     event.status === "done" ? "var(--color-surface-offset)" : isNext ? "var(--color-accent)" : "var(--color-surface-offset)",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
        gap:            1,
      }}>
        {event.status === "done" ? (
          <CheckCircle2 size={18} style={{ color: "var(--color-text-faint)" }}/>
        ) : (
          <Plane size={18} style={{ color: isNext ? "#fff" : "var(--color-accent)" }}/>
        )}
      </div>

      {/* Treść */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-1)" }}>
          <h3 style={{
            fontFamily:   "var(--font-display)",
            fontWeight:   800,
            fontSize:     "var(--text-base)",
            letterSpacing: "-0.02em",
            color:        event.status === "done" ? "var(--color-text-muted)" : "var(--color-text)",
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
          }}>
            {event.name}
          </h3>
          {isNext && (
            <span style={{
              fontSize:       9,
              fontWeight:     800,
              textTransform:  "uppercase",
              letterSpacing:  ".1em",
              color:          "#fff",
              background:     "var(--color-accent)",
              padding:        "2px 7px",
              borderRadius:   99,
              flexShrink:     0,
            }}>
              Następny
            </span>
          )}
          {event.note && (
            <span style={{
              fontSize:       9,
              fontWeight:     700,
              textTransform:  "uppercase",
              letterSpacing:  ".08em",
              color:          "var(--color-gold)",
              background:     "var(--color-gold-subtle)",
              padding:        "2px 7px",
              borderRadius:   99,
              flexShrink:     0,
              border:         "1px solid color-mix(in srgb, var(--color-gold) 30%, transparent)",
            }}>
              {event.note}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
            <Calendar size={11}/> {event.date}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
            <MapPin size={11}/> {event.location}
          </span>
        </div>
      </div>

      {/* Status badge */}
      <div style={{
        display:        "inline-flex",
        alignItems:     "center",
        gap:            4,
        padding:        "3px 10px",
        borderRadius:   99,
        fontSize:       9,
        fontWeight:     700,
        textTransform:  "uppercase",
        letterSpacing:  ".08em",
        color:          cfg.color,
        background:     cfg.bg,
        flexShrink:     0,
        whiteSpace:     "nowrap",
        border:         `1px solid color-mix(in srgb, ${cfg.color} 20%, transparent)`,
      }}>
        {cfg.icon} {cfg.label}
      </div>
    </div>
  );
}

// ── PAGE ─────────────────────────────────────────────────────

export default function KalendarzClient() {
  const [tab, setTab] = useState<EventTab>("polska");

  const events  = EVENTS.filter(e => e.tab === tab).sort((a, b) => a.dateSort.localeCompare(b.dateSort));
  const nextEvt = getNextEvent(tab);

  const doneCount     = events.filter(e => e.status === "done").length;
  const upcomingCount = events.filter(e => e.status !== "done").length;

  return (
    <>
      <style>{`
        @keyframes kl-fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .kl-tab{padding:var(--space-2) var(--space-5);border-radius:calc(var(--radius-lg) - 2px);font-size:var(--text-sm);font-weight:700;cursor:pointer;border:none;background:none;color:var(--color-text-muted);transition:background .15s,color .15s;display:inline-flex;align-items:center;gap:var(--space-2);white-space:nowrap}
        .kl-tab:hover{color:var(--color-text)}
        .kl-tab.on{background:var(--color-bg);color:var(--color-text);box-shadow:var(--shadow-sm)}
        .kl-tab.on svg{color:var(--color-accent)}
        .kl-list{display:flex;flex-direction:column;gap:var(--space-3);animation:kl-fade-up .3s cubic-bezier(.16,1,.3,1) both}
        .kl-sep{display:flex;align-items:center;gap:var(--space-4);margin:var(--space-6) 0 var(--space-4)}
        .kl-sep-line{flex:1;height:1px;background:var(--color-divider)}
        .kl-sep-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--color-text-faint);white-space:nowrap}
      `}</style>

      <div style={{ paddingTop: 80, minHeight: "100dvh", paddingBottom: "var(--space-24)" }}>

        {/* ── Hero ── */}
        <div style={{
          background:    "var(--color-surface)",
          borderBottom:  "1px solid var(--color-divider)",
          padding:       "clamp(var(--space-12),6vw,var(--space-20)) 0 0",
          position:      "relative",
          overflow:      "hidden",
        }}>
          {/* Deco */}
          <div aria-hidden style={{
            position:    "absolute", right: "-2%", bottom: "-15%",
            fontFamily:  "var(--font-display)", fontWeight: 900,
            fontSize:    "clamp(8rem,22vw,20rem)", lineHeight: 1,
            color:       "var(--color-text)", opacity: .025,
            userSelect:  "none", pointerEvents: "none", letterSpacing: "-0.06em",
          }}>2026</div>

          <div className="container--narrow" style={{ position: "relative", zIndex: 1 }}>
            <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:"var(--space-2)", fontSize:"var(--text-xs)", fontWeight:700, color:"var(--color-text-faint)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:"var(--space-6)", transition:"color .15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-faint)")}
            >
              <ArrowLeft size={12}/> Strona główna
            </Link>

            <div style={{ marginBottom: "var(--space-3)" }}>
              <span className="badge"><Calendar size={11}/> Sezon 2026</span>
            </div>

            <h1 style={{
              fontFamily:   "var(--font-display)",
              fontWeight:   900,
              fontSize:     "var(--text-2xl)",
              letterSpacing: "-0.04em",
              lineHeight:   1.05,
              marginBottom: "var(--space-5)",
            }}>
              Kalendarz pokazów<br/>
              <span style={{ color: "var(--color-accent)" }}>lotniczych 2026</span>
            </h1>

            <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)", maxWidth: "56ch", lineHeight: 1.7, marginBottom: "var(--space-8)" }}>
              Wszystkie pokazy lotnicze w Polsce oraz wybrane imprezy zagraniczne warte uwagi — w jednym miejscu.
            </p>

            {/* Statystyki */}
            <div style={{ display: "flex", gap: "var(--space-8)", flexWrap: "wrap", paddingBottom: "var(--space-8)", borderBottom: "1px solid var(--color-divider)" }}>
              {[
                { value: EVENTS.filter(e => e.tab === "polska").length,    label: "Pokazów w Polsce" },
                { value: EVENTS.filter(e => e.status === "done").length,   label: "Już odbyło się" },
                { value: EVENTS.filter(e => e.status !== "done").length,   label: "Jeszcze przed nami" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"var(--text-xl)", letterSpacing:"-0.04em", lineHeight:1, fontVariantNumeric:"tabular-nums" }}>{value}</p>
                  <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", fontWeight:600, textTransform:"uppercase", letterSpacing:".07em", marginTop: 3 }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Zakładki */}
            <div style={{
              display:       "flex",
              gap:           3,
              padding:       3,
              background:    "var(--color-surface-2)",
              borderRadius:  "var(--radius-xl)",
              width:         "fit-content",
              marginTop:     "var(--space-6)",
              marginBottom:  "-1px",
            }}>
              <button className={`kl-tab ${tab === "polska" ? "on" : ""}`} onClick={() => setTab("polska")}>
                <Plane size={13}/> Polska
                <span style={{ fontSize:10, fontWeight:800, color: tab === "polska" ? "var(--color-accent)" : "var(--color-text-faint)", background:"var(--color-surface-offset)", padding:"1px 7px", borderRadius:99, marginLeft:2 }}>
                  {EVENTS.filter(e => e.tab === "polska").length}
                </span>
              </button>
              <button className={`kl-tab ${tab === "zagranica" ? "on" : ""}`} onClick={() => setTab("zagranica")}>
                <Globe size={13}/> Zagranica
                <span style={{ fontSize:10, fontWeight:800, color: tab === "zagranica" ? "var(--color-accent)" : "var(--color-text-faint)", background:"var(--color-surface-offset)", padding:"1px 7px", borderRadius:99, marginLeft:2 }}>
                  {EVENTS.filter(e => e.tab === "zagranica").length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Lista ── */}
        <div className="container--narrow" style={{ paddingTop: "var(--space-8)" }}>

          {/* Wyróżniony — następny event */}
          {nextEvt && (
            <div style={{ marginBottom: "var(--space-6)" }}>
              <p style={{ fontSize:"var(--text-xs)", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color:"var(--color-text-faint)", marginBottom:"var(--space-3)" }}>
                Następne wydarzenie
              </p>
              <EventCard event={nextEvt} isNext/>
            </div>
          )}

          <div className="kl-list">

            {/* Odbyte */}
            {doneCount > 0 && (
              <>
                <div className="kl-sep">
                  <div className="kl-sep-line"/>
                  <span className="kl-sep-label">
                    <CheckCircle2 size={10} style={{ display:"inline", verticalAlign:"middle", marginRight:4 }}/>
                    Odbyte — {doneCount}
                  </span>
                  <div className="kl-sep-line"/>
                </div>
                {events.filter(e => e.status === "done").map(e => (
                  <EventCard key={e.name + e.dateSort} event={e}/>
                ))}
              </>
            )}

            {/* Nadchodzące */}
            {upcomingCount > 0 && (
              <>
                <div className="kl-sep">
                  <div className="kl-sep-line"/>
                  <span className="kl-sep-label" style={{ color:"var(--color-gold)" }}>
                    <Clock size={10} style={{ display:"inline", verticalAlign:"middle", marginRight:4 }}/>
                    Nadchodzące — {upcomingCount}
                  </span>
                  <div className="kl-sep-line"/>
                </div>
                {events
                  .filter(e => e.status !== "done")
                  .filter(e => !nextEvt || e.name !== nextEvt.name || e.dateSort !== nextEvt.dateSort)
                  .map(e => (
                    <EventCard key={e.name + e.dateSort} event={e}/>
                  ))
                }
              </>
            )}

          </div>

          {/* CTA — Twoje zdjęcia */}
          <div style={{
            marginTop:    "var(--space-12)",
            padding:      "var(--space-8)",
            borderRadius: "var(--radius-2xl)",
            background:   "var(--color-accent-subtle)",
            border:       "1px solid var(--color-accent)",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "space-between",
            flexWrap:     "wrap",
            gap:          "var(--space-5)",
          }}>
            <div>
              <p style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"var(--text-lg)", letterSpacing:"-0.02em", marginBottom:"var(--space-1)" }}>
                Byłeś na jednym z tych pokazów?
              </p>
              <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)", lineHeight:1.6 }}>
                Zobacz zdjęcia z poprzednich edycji w galerii.
              </p>
            </div>
            <Link href="/gallery" style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:          "var(--space-2)",
              padding:      "var(--space-3) var(--space-6)",
              borderRadius: "var(--radius-md)",
              background:   "var(--color-accent)",
              color:        "#fff",
              fontWeight:   700,
              fontSize:     "var(--text-sm)",
              textDecoration: "none",
              whiteSpace:   "nowrap",
              transition:   "background .18s, transform .15s",
              flexShrink:   0,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-accent-hover)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-accent)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
            >
              Przeglądaj galerię <ChevronRight size={15}/>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}