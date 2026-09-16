"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowUpRight, Bug, CalendarPlus, Check, Clock3, ExternalLink, FileCheck2, Filter, Loader2, RefreshCw, Search, ShieldCheck, X } from "lucide-react";

type Status = "pending" | "reviewing" | "accepted" | "rejected";
type Submission = {
  id: string; type: "event_proposal" | "correction"; status: Status;
  pageUrl: string; title: string; message: string; sourceUrl: string;
  contactEmail: string | null; adminNote: string | null;
  createdAt: string; reviewedAt: string | null;
  event?: { id: string; name: string; slug: string } | null;
  show?: { id: string; name: string } | null;
};

const labels: Record<Status,string> = { pending:"Oczekuje", reviewing:"W trakcie", accepted:"Zaakceptowane", rejected:"Odrzucone" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }).format(new Date(value));
}

export default function AdminSubmissionsPage() {
  const [items,setItems]=useState<Submission[]>([]);
  const [loading,setLoading]=useState(true);
  const [status,setStatus]=useState<Status|"all">("pending");
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState<Submission|null>(null);
  const [note,setNote]=useState("");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try {
      const response=await fetch("/api/submissions?status="+(status==="all"?"":status));
      const data=await response.json().catch(()=>null);
      if(response.status===401){window.location.href="/admin/login?redirect=/admin/submissions";return;}
      if(!response.ok) throw new Error(data?.error ?? "Nie udało się pobrać zgłoszeń.");
      setItems(data as Submission[]);
    } catch(e){setError(e instanceof Error?e.message:"Nie udało się pobrać zgłoszeń.");}
    finally{setLoading(false);}
  },[status]);

  useEffect(()=>{load()},[load]);

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return items.filter(item=>!q || item.title.toLowerCase().includes(q) || item.message.toLowerCase().includes(q) || (item.event?.name??"").toLowerCase().includes(q) || (item.show?.name??"").toLowerCase().includes(q));
  },[items,search]);

  async function changeStatus(next: Status) {
    if(!selected)return;
    setSaving(true);setError("");
    try {
      const response=await fetch("/api/submissions/"+selected.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:next,adminNote:note})});
      const data=await response.json().catch(()=>null);
      if(!response.ok)throw new Error(data?.error??"Nie udało się zapisać zgłoszenia.");
      setItems(current=>current.map(item=>item.id===selected.id?{...item,...data}:item));
      setSelected(null);setNote("");
    }catch(e){setError(e instanceof Error?e.message:"Nie udało się zapisać zgłoszenia.");}
    finally{setSaving(false);}
  }

  const pendingCount=items.filter(i=>i.status==="pending").length;
  const reviewingCount=items.filter(i=>i.status==="reviewing").length;

  return <div className="sub-admin">
    <style>{`
      .sub-admin{max-width:1180px;margin:0 auto}.sub-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:24px}.sub-head h1{font-family:var(--font-display);font-size:var(--text-2xl);font-weight:950;letter-spacing:-.04em;margin:8px 0 5px}.sub-head p{color:var(--color-text-muted);font-size:var(--text-sm);margin:0}.sub-kicker{display:inline-flex;align-items:center;gap:6px;color:var(--color-accent);font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
      .sub-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}.sub-stat{padding:15px;border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface)}.sub-stat b{display:block;font-family:var(--font-display);font-size:24px;letter-spacing:-.03em}.sub-stat span{font-size:11px;color:var(--color-text-faint)}
      .sub-toolbar{display:flex;gap:9px;align-items:center;margin-bottom:14px;flex-wrap:wrap}.sub-search{position:relative;flex:1;min-width:220px}.sub-search input{width:100%;height:40px;padding:0 12px 0 36px;border:1px solid var(--color-border-strong);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);outline:none}.sub-search svg{position:absolute;left:12px;top:12px;color:var(--color-text-faint)}.sub-select{height:40px;padding:0 34px 0 12px;border:1px solid var(--color-border-strong);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text)}
      .sub-list{display:flex;flex-direction:column;gap:9px}.sub-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;padding:17px;border:1px solid var(--color-border);border-radius:var(--radius-xl);background:var(--color-surface);transition:border-color .18s ease,box-shadow .18s ease}.sub-row:hover{border-color:var(--color-border-strong);box-shadow:var(--shadow-sm)}.sub-row h2{font-size:var(--text-sm);font-weight:850;margin:8px 0 5px}.sub-row p{font-size:12px;color:var(--color-text-muted);line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.sub-meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:9px;color:var(--color-text-faint);font-size:10px}.sub-actions{display:flex;align-items:center;gap:7px}.sub-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:0 11px;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text-muted);font-size:11px;font-weight:800;cursor:pointer;text-decoration:none}.sub-btn:hover{background:var(--color-surface-offset);color:var(--color-text)}.sub-btn.green{color:#16803c;border-color:rgba(22,128,60,.25);background:rgba(22,128,60,.06)}.sub-btn.red{color:#c62828;border-color:rgba(198,40,40,.2);background:rgba(198,40,40,.05)}
      .sub-type{display:inline-flex;align-items:center;gap:6px;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--color-accent)}.sub-status{display:inline-flex;align-items:center;gap:5px;padding:4px 7px;border-radius:999px;background:var(--color-surface-offset);font-size:9px;font-weight:900;color:var(--color-text-faint);text-transform:uppercase;letter-spacing:.06em}.sub-status.pending{color:var(--color-gold);background:var(--color-gold-subtle)}
      .sub-empty{text-align:center;padding:50px 20px;border:1px dashed var(--color-border-strong);border-radius:var(--radius-xl);color:var(--color-text-faint)}.sub-empty svg{margin:0 auto 10px}.sub-empty b{display:block;color:var(--color-text);margin-bottom:5px}.sub-error{display:flex;gap:8px;align-items:center;padding:11px 13px;margin-bottom:14px;border:1px solid rgba(220,38,38,.25);border-radius:var(--radius-md);color:#dc2626;background:rgba(220,38,38,.07);font-size:12px}
      .sub-modal-bg{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.62);backdrop-filter:blur(5px);display:grid;place-items:center;padding:16px}.sub-modal{width:min(100%,720px);max-height:min(90dvh,820px);overflow:auto;border:1px solid var(--color-border);border-radius:var(--radius-2xl);background:var(--color-surface);box-shadow:var(--shadow-xl);padding:24px}.sub-modal-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.sub-modal h2{font-family:var(--font-display);font-size:var(--text-xl);font-weight:900;letter-spacing:-.03em;margin:8px 0}.sub-close{width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--color-border);border-radius:9px;background:transparent;color:var(--color-text-muted);cursor:pointer}.sub-detail{margin:18px 0;padding:15px;border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface-offset)}.sub-detail p{white-space:pre-wrap;line-height:1.65;font-size:13px;color:var(--color-text-muted);margin:0}.sub-detail-label{font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--color-text-faint);margin-bottom:8px}.sub-link{display:inline-flex;align-items:center;gap:6px;color:var(--color-accent);font-size:12px;font-weight:700;word-break:break-all}.sub-note{width:100%;min-height:80px;padding:10px;border:1px solid var(--color-border-strong);border-radius:var(--radius-md);background:var(--color-bg);color:var(--color-text);font:inherit;font-size:12px;resize:vertical}.sub-modal-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:18px;padding-top:16px;border-top:1px solid var(--color-divider)}
      @media(max-width:700px){.sub-head{flex-direction:column}.sub-stats{grid-template-columns:1fr 1fr}.sub-row{grid-template-columns:1fr}.sub-actions{justify-content:flex-start}.sub-modal{padding:18px}.sub-modal-actions{flex-direction:column}.sub-modal-actions .sub-btn{width:100%}}
    `}</style>

    <div className="sub-head"><div><span className="sub-kicker"><ShieldCheck size={13}/> Moderacja informacji</span><h1>Zgłoszenia</h1><p>Weryfikuj propozycje wydarzeń i poprawki. Nic nie publikuje się automatycznie.</p></div><button className="sub-btn" onClick={load}><RefreshCw size={14}/> Odśwież</button></div>
    <div className="sub-stats"><div className="sub-stat"><b>{pendingCount}</b><span>Oczekujące na weryfikację</span></div><div className="sub-stat"><b>{reviewingCount}</b><span>W trakcie</span></div><div className="sub-stat"><b>{items.length}</b><span>W bieżącym widoku</span></div></div>
    {error&&<div className="sub-error"><AlertCircle size={15}/>{error}</div>}
    <div className="sub-toolbar"><div className="sub-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Szukaj zgłoszeń…" /></div><select className="sub-select" value={status} onChange={e=>setStatus(e.target.value as Status|"all")}><option value="pending">Oczekujące</option><option value="reviewing">W trakcie</option><option value="accepted">Zaakceptowane</option><option value="rejected">Odrzucone</option><option value="all">Wszystkie</option></select></div>

    {loading ? <div className="sub-empty"><Loader2 size={25}/><b>Ładowanie zgłoszeń…</b></div> : filtered.length ? <div className="sub-list">{filtered.map(item=><article key={item.id} className="sub-row"><div>
      <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}><span className="sub-type">{item.type==="event_proposal"?<CalendarPlus size={12}/>:<Bug size={12}/>} {item.type==="event_proposal"?"Propozycja wydarzenia":"Poprawka"}</span><span className={"sub-status "+item.status}>{labels[item.status]}</span></div>
      <h2>{item.title || "Bez tytułu"}</h2><p>{item.message}</p>
      <div className="sub-meta"><span><Clock3 size={11} style={{verticalAlign:"-2px"}}/> {formatDate(item.createdAt)}</span>{item.event&&<span>📅 {item.event.name}</span>}{item.contactEmail&&<span>✉ {item.contactEmail}</span>}</div>
    </div><div className="sub-actions"><button className="sub-btn" onClick={()=>{setSelected(item);setNote(item.adminNote??"")}}>Otwórz <ArrowUpRight size={13}/></button>{item.status==="pending"&&<><button className="sub-btn green" onClick={()=>{setSelected(item);setNote(item.adminNote??"") ;setTimeout(()=>changeStatus("accepted"),0)}}><Check size={13}/> Akceptuj</button><button className="sub-btn red" onClick={()=>{setSelected(item);setNote(item.adminNote??"");setTimeout(()=>changeStatus("rejected"),0)}}><X size={13}/> Odrzuć</button></>}</div>
    </article>)}</div> : <div className="sub-empty"><FileCheck2 size={28}/><b>Brak zgłoszeń w tym widoku</b><span>Możesz zmienić filtr albo poczekać na nowe zgłoszenia.</span></div>}

    {selected&&<div className="sub-modal-bg" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section className="sub-modal" role="dialog" aria-modal="true" aria-labelledby="submission-title">
      <div className="sub-modal-head"><div><span className="sub-type">{selected.type==="event_proposal"?<CalendarPlus size={12}/>:<Bug size={12}/>} {selected.type==="event_proposal"?"Propozycja wydarzenia":"Poprawka"}</span><h2 id="submission-title">{selected.title||"Bez tytułu"}</h2></div><button className="sub-close" onClick={()=>setSelected(null)} aria-label="Zamknij"><X size={16}/></button></div>
      {selected.event&&<div className="sub-detail"><div className="sub-detail-label">Powiązane wydarzenie</div><Link href={"/airshow/"+selected.event.slug} target="_blank" className="sub-link">{selected.event.name}<ExternalLink size={12}/></Link></div>}
      {selected.pageUrl&&<div className="sub-detail"><div className="sub-detail-label">Strona</div><a className="sub-link" href={selected.pageUrl} target="_blank" rel="noopener noreferrer">{selected.pageUrl}<ExternalLink size={12}/></a></div>}
      <div className="sub-detail"><div className="sub-detail-label">Treść zgłoszenia</div><p>{selected.message}</p></div>
      {selected.sourceUrl&&<div className="sub-detail"><div className="sub-detail-label">Źródło</div><a className="sub-link" href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">{selected.sourceUrl}<ExternalLink size={12}/></a></div>}
      {selected.contactEmail&&<div className="sub-detail"><div className="sub-detail-label">Kontakt</div><p>{selected.contactEmail}</p></div>}
      <label style={{display:"block",fontSize:11,fontWeight:800,color:"var(--color-text-muted)"}}>Notatka administratora<textarea className="sub-note" value={note} onChange={e=>setNote(e.target.value)} placeholder="Np. sprawdzone na oficjalnej stronie…" /></label>
      <div className="sub-modal-actions">{selected.status!=="accepted"&&<button className="sub-btn green" disabled={saving} onClick={()=>changeStatus("accepted")}><Check size={14}/> Zaakceptuj</button>}{selected.status!=="rejected"&&<button className="sub-btn red" disabled={saving} onClick={()=>changeStatus("rejected")}><X size={14}/> Odrzuć</button>}{selected.status!=="reviewing"&&selected.status==="pending"&&<button className="sub-btn" disabled={saving} onClick={()=>changeStatus("reviewing")}><Filter size={14}/> Oznacz jako w trakcie</button>}{selected.status!=="pending"&&<button className="sub-btn" disabled={saving} onClick={()=>changeStatus("pending")}>Przywróć do oczekujących</button>}</div>
    </section></div>}
  </div>;
}
