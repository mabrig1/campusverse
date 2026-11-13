import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import PersonalStoreDesk from "./PersonalStoreDesk";

const card = { background: "#fff", border: "1px solid #dce9e3", borderRadius: 16, padding: 18, marginBottom: 14 };
const btn = { background: "#047857", color: "white", border: 0, borderRadius: 9, padding: "10px 14px", fontWeight: 750, cursor: "pointer" };
const field = { width: "100%", padding: 10, borderRadius: 9, border: "1px solid #cbd5e1" };
const label = x => String(x || "").replaceAll("_"," ");

export default function DeviceTradingAdmin() {
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [offers, setOffers] = useState([]);
  const [selection, setSelection] = useState(null);
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");
  const [serialMatched, setSerialMatched] = useState(false);
  const [physicalIdentifier, setPhysicalIdentifier] = useState("");
  const [identifierResult, setIdentifierResult] = useState("");
  const [provenanceChecked, setProvenanceChecked] = useState(false);
  const [sellerIntentConfirmed, setSellerIntentConfirmed] = useState(false);
  const [sellerVideoUrl, setSellerVideoUrl] = useState("");
  const [sellerVideoId, setSellerVideoId] = useState("");
  const [inspection, setInspection] = useState(false);
  const [payment, setPayment] = useState(false);
  const [handover, setHandover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [a,b,c] = await Promise.all([api.adminGetOwnershipQueue(), api.adminGetLaptopReports(), api.adminGetDeviceOffers()]);
    setListings(a.items || []); setReports(b.items || []); setOffers(c.items || []);
  }, []);
  useEffect(() => { load().catch(e => setError(e.message)); }, [load]);
  const run = async (fn, success) => {
    setBusy(true); setError(""); setMessage("");
    try { await fn(); setMessage(success); await load(); return true; }
    catch(e) { setError(e.message); return false; }
    finally { setBusy(false); }
  };
  const start = (kind,id,status) => {
    setSelection({ kind,id }); setChoice(status); setNote("");
    setSerialMatched(false); setProvenanceChecked(false); setSellerIntentConfirmed(false); setPhysicalIdentifier(""); setIdentifierResult("");
    setInspection(false); setPayment(false); setHandover(false);
  };
  const matchPhysicalDevice = async row => {
    setBusy(true); setError(""); setIdentifierResult("");
    try {
      const data = await api.adminMatchDeviceIdentifier(row.id,physicalIdentifier.trim());
      setIdentifierResult(data.message);
      setSerialMatched(Boolean(data.match));
      if (data.match) await load();
    } catch(e) { setError(e.message); setSerialMatched(false); }
    finally { setBusy(false); }
  };
  const download = async row => {
    setBusy(true); setError("");
    try {
      const blob = await api.adminDownloadLaptopEvidence(row.id);
      const ext = row.ownershipEvidence?.mimeType === "application/pdf" ? "pdf" : row.ownershipEvidence?.mimeType === "image/png" ? "png" : "jpg";
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = "private-ownership-" + row.id + "." + ext;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch(e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const openSellerVideo = async row => {
    setBusy(true); setError("");
    try {
      const bytes = await api.adminDownloadSellerIntentVideo(row.id);
      if (sellerVideoUrl) URL.revokeObjectURL(sellerVideoUrl);
      const mime = row.sellerVideoEvidence?.mimeType || "video/webm";
      const video = new Blob([bytes], { type: mime });
      setSellerVideoUrl(URL.createObjectURL(video));
      setSellerVideoId(row.id);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const submit = async e => {
    e.preventDefault();
    if (!selection) return;
    const { kind, id } = selection;
    const data = kind === "listing"
      ? { decision: choice, note, serialMatched, provenanceChecked, sellerIntentConfirmed }
      : { action: choice, note, inspectionConfirmed: inspection, paymentConfirmed: payment, handoverConfirmed: handover };
    const ok = await run(() => kind === "listing"
      ? api.adminReviewLaptopOwnership(id,data) : api.adminDecideDeviceOffer(id,data),
      "Decision saved by owner with an audit record.");
    if (ok) setSelection(null);
  };
  const currentOffers = offers.filter(x => !["COMPLETED","REJECTED_BY_ADMIN","DECLINED","WITHDRAWN"].includes(x.status));
  return <section>
    <PersonalStoreDesk />
    <div style={card}>
      <h2>Phone & Laptop Trading Desk</h2>
      <p style={{fontSize:13,color:"#475569",lineHeight:1.65}}>This desk is restricted to the configured marketplace owner. Review private ownership evidence, approve or reject deals, inspect both devices and confirm real payment and handover. A checked document is not evidence that a device is theft-free.</p>
      <button style={btn} onClick={()=>load().catch(e=>setError(e.message))} disabled={busy}>Refresh owner queue</button>
    </div>
    {error && <div role="alert" style={{...card,color:"#9f1239"}}>{error}</div>}
    {message && <div role="status" style={{...card,color:"#065f46"}}>{message}</div>}
    <h3>Ownership documents awaiting attention: {listings.length}</h3>
    {listings.map(row => <article key={row.id} style={card}>
      <strong>{row.deviceType === "PHONE" ? "📱" : "💻"} {row.brand} {row.model}</strong>
      <p style={{fontSize:13,color:"#475569",margin:"8px 0"}}>{label(row.ownershipStatus)} · {row.seller?.name} ({row.seller?.email}) · Identifier ending {row.serialLast4 || "—"}</p>
      <p style={{fontSize:12,color:"#64748b"}}>{row.ownershipEvidence ? "Private " + label(row.ownershipEvidence.documentType) + " available" : "No ownership document"}</p>
      <p style={{fontSize:12,color:row.sellerVideoEvidence?"#047857":"#9f1239"}}>
        {row.sellerVideoEvidence ? "Private seller-initiated selfie video received. Challenge: " + row.sellerVideoEvidence.challenge :
        "Missing live seller-authorisation selfie video — cannot approve."}
      </p>
      {row.ownershipEvidence && <button disabled={busy} style={{...btn,marginRight:8}} onClick={()=>download(row)}>Download private proof</button>}
      {row.sellerVideoEvidence && <button disabled={busy} style={{...btn,marginRight:8}} onClick={()=>openSellerVideo(row)}>Privately review selfie video</button>}
      {sellerVideoId === row.id && sellerVideoUrl && <div style={{margin:"12px 0"}}>
        <video controls playsInline src={sellerVideoUrl} style={{maxWidth:360,width:"100%",borderRadius:9}} />
        <p style={{fontSize:12,color:"#475569"}}>Check that the seller is visible, speaks the displayed one-time challenge and voluntarily authorises this device's sale or swap. Do not use automated face recognition.</p>
        <button type="button" style={{...btn,background:"#64748b"}} onClick={()=>{URL.revokeObjectURL(sellerVideoUrl);setSellerVideoUrl("");setSellerVideoId("");}}>Close private video</button>
      </div>}
      <div style={{fontSize:12,color:row.identifierMatchedAt?"#047857":"#b45309",margin:"8px 0"}}>Physical identifier check: {row.identifierMatchedAt ? "MATCHED by owner" : "Not yet matched"}</div>
      <button style={{...btn,background:"#334155"}} onClick={()=>start("listing",row.id,"REVIEWED")}>Record review</button>
    </article>)}
    {!listings.length && <div style={card}>No ownership documents awaiting a decision.</div>}
    <h3>Owner-managed offers: {currentOffers.length}</h3>
    {currentOffers.map(row => <article key={row.id} style={card}>
      <strong>{row.type} · {row.target.deviceType === "PHONE" ? "📱" : "💻"} {row.target.brand} {row.target.model}</strong>
      <p style={{fontSize:13,color:"#475569",margin:"8px 0"}}>{label(row.status)} · Buyer: {row.buyer?.name} ({row.buyer?.email}) · Seller: {row.target.seller?.name}</p>
      <p style={{fontSize:13,color:"#475569"}}>{row.type === "BUY" ? "Cash bid" : "Swap top-up"}: ₦{Number(row.amount).toLocaleString()}{row.offered && " · Trade-in: " + row.offered.brand + " " + row.offered.model}</p>
      {row.note && <p style={{fontSize:12,color:"#64748b"}}>Buyer note: {row.note}</p>}
      <button style={btn} onClick={()=>start("offer",row.id,row.status==="ACCEPTED"?"COMPLETED":"ACCEPTED")}>Review transaction</button>
    </article>)}
    {!currentOffers.length && <div style={card}>No active requests.</div>}
    <h3>Device safety reports: {reports.length}</h3>
    {reports.map(row => <article key={row.id} style={card}>
      <strong>{label(row.reason)} · {row.listing.brand} {row.listing.model}</strong>
      <p style={{fontSize:13,margin:"9px 0",color:"#475569"}}>{row.detail}</p>
      <button disabled={busy} style={btn} onClick={()=>run(()=>api.adminResolveLaptopReport(row.id),"Report handled. Flagged listings remain hidden until a separate review.")}>Mark report handled</button>
    </article>)}
    {!reports.length && <div style={card}>No active safety reports.</div>}
    {selection && <form style={{...card,border:"2px solid #047857"}} onSubmit={submit}>
      <h3>Record {selection.kind === "listing" ? "ownership review" : "transaction decision"}</h3>
      <label style={{display:"block",marginBottom:12}}>Decision
        <select value={choice} style={field} onChange={e=>setChoice(e.target.value)}>
          {(selection.kind === "listing" ? ["REVIEWED","NEEDS_MORE_INFO","REJECTED","REVOKED"]
            : ["ACCEPTED","ADMIN_APPROVED","REJECTED_BY_ADMIN","DISPUTED","COMPLETED"]).map(x=><option key={x} value={x}>{label(x)}</option>)}
        </select>
      </label>
      <label style={{display:"block",marginBottom:12}}>Required explanation (12–600 characters)
        <textarea style={{...field,minHeight:90}} minLength={12} maxLength={600} required value={note} onChange={e=>setNote(e.target.value)} />
      </label>
      {selection.kind === "listing" && choice === "REVIEWED" && <div style={{display:"grid",gap:10,marginBottom:14}}>
        <label>Enter the serial or IMEI read directly from the physical device (never saved)
          <input style={field} value={physicalIdentifier} type="text" autoComplete="off" onChange={e=>{setPhysicalIdentifier(e.target.value);setSerialMatched(false);setIdentifierResult("");}} placeholder="Compare the chassis / device Settings with the submitted listing" />
        </label>
        <button type="button" style={btn} disabled={busy || !physicalIdentifier} onClick={()=>matchPhysicalDevice({id:selection.id})}>Verify device identifier privately</button>
        {identifierResult && <p style={{fontSize:12,color:serialMatched?"#047857":"#991b1b"}}>{identifierResult}</p>}
        <label><input type="checkbox" checked={serialMatched} onChange={e=>setSerialMatched(e.target.checked)}/> I compared serial/IMEI evidence with device identification.</label>
        <label><input type="checkbox" checked={provenanceChecked} onChange={e=>setProvenanceChecked(e.target.checked)}/> I checked lawful transfer history and supporting receipt.</label>
        <label><input type="checkbox" checked={sellerIntentConfirmed} onChange={e=>setSellerIntentConfirmed(e.target.checked)}/>
          I personally reviewed the fresh selfie video and heard the correct one-time challenge and voluntary sale/swap authorisation. This is not automated liveness or identity verification.
        </label>
      </div>}
      {selection.kind === "offer" && choice === "COMPLETED" && <div style={{display:"grid",gap:10,marginBottom:14}}>
        <label><input type="checkbox" checked={inspection} onChange={e=>setInspection(e.target.checked)}/> Device inspection completed.</label>
        <label><input type="checkbox" checked={payment} onChange={e=>setPayment(e.target.checked)}/> Payment independently confirmed.</label>
        <label><input type="checkbox" checked={handover} onChange={e=>setHandover(e.target.checked)}/> Physical handover and receipt confirmed.</label>
      </div>}
      <button type="submit" disabled={busy || (selection.kind==="listing"&&choice==="REVIEWED"&&(!serialMatched||!provenanceChecked||!sellerIntentConfirmed)) || (selection.kind==="offer"&&choice==="COMPLETED"&&(!inspection||!payment||!handover))} style={btn}>Save owner decision</button>
      <button type="button" style={{...btn,background:"#64748b",marginLeft:10}} onClick={()=>setSelection(null)}>Cancel</button>
    </form>}
  </section>;
}
