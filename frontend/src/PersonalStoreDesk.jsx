import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

const panel={padding:18,background:"#ffffff",border:"1px solid #dbe7e2",borderRadius:14,margin:"12px 0"};
const button={background:"#047857",color:"#fff",border:0,borderRadius:8,padding:"9px 13px",cursor:"pointer",fontWeight:700};
const field={width:"100%",border:"1px solid #cbd5e1",borderRadius:8,padding:10,margin:"5px 0 10px"};
const money=n=>"₦"+Number(n||0).toLocaleString("en-NG");
const human=x=>String(x||"").replaceAll("_"," ");
export default function PersonalStoreDesk() {
  const [intakes,setIntakes]=useState([]);
  const [stock,setStock]=useState([]);
  const [editing,setEditing]=useState(null);
  const [price,setPrice]=useState("");
  const [resalePrice,setResalePrice]=useState("");
  const [note,setNote]=useState("");
  const [inspection,setInspection]=useState(false);
  const [payment,setPayment]=useState(false);
  const [handover,setHandover]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");

  const load=useCallback(async()=>{
    const [intakeData,stockData]=await Promise.all([api.adminGetStoreIntakes(),api.adminGetStoreInventory()]);
    setIntakes(intakeData.items||[]);setStock(stockData.items||[]);
  },[]);
  useEffect(()=>{load().catch(e=>setError(e.message));},[load]);
  const action=async(fn,msg)=>{
    setBusy(true);setError("");setNotice("");
    try{await fn();await load();setNotice(msg);setEditing(null);}
    catch(e){setError(e.message);} finally{setBusy(false);}
  };
  const begin=(kind,row)=>{
    setEditing({kind,id:row.id});setNote("");setInspection(false);setPayment(false);setHandover(false);
    setPrice(String(row.storeQuote?.price||row.price||""));
    setResalePrice(String(row.price||""));
  };
  async function submit(e) {
    e.preventDefault();
    if(!editing)return;
    const value=Number(price),resale=Number(resalePrice);
    if(editing.kind==="quote") return action(
      ()=>api.adminOfferStorePurchase(editing.id,{price:value,note}),
      "A private quote has been sent to this seller. Await their acceptance.");
    if(editing.kind==="acquire") return action(
      ()=>api.adminAcquireIntoStore(editing.id,{resalePrice:resale,note,
        inspectionConfirmed:inspection,paymentConfirmed:payment,sellerHandoverConfirmed:handover}),
      "Seller paid, device received and transferred into YOUR store inventory.");
    if(editing.kind==="activate") return action(
      ()=>api.adminActivateOwnStock(editing.id,{note,
        physicalStockConfirmed:inspection,provenanceChecked:handover}),
      "Your verified, physically held device is now stock in the CampusVerse store.");
    if(editing.kind==="reprice") return action(
      ()=>api.adminSetStorePrice(editing.id,value),"Store price updated.");
  }
  return <section style={panel}>
    <h2 style={{margin:0}}>🏬 My CampusVerse Store — Private Trading Desk</h2>
    <p style={{color:"#475569",lineHeight:1.6}}>During this pilot, CampusVerse is <b>one physical shop managed entirely by you</b>. Students cannot open stores or sell to one another here. Sellers submit a device for you to assess and purchase. Only devices you have acquired or already own are displayed to buyers. Every quote, payment and handover requires your decision.</p>
    <button type="button" style={button} disabled={busy} onClick={()=>load().catch(e=>setError(e.message))}>Refresh store activity</button>
    {error&&<p role="alert" style={{color:"#991b1b"}}>{error}</p>}
    {notice&&<p role="status" style={{color:"#047857"}}>{notice}</p>}
    <h3>Students offering devices to your store ({intakes.filter(x=>x.sellerId!==x.storeQuote?.ownerId).length})</h3>
    {!intakes.length&&<p>No intake submissions yet.</p>}
    {intakes.map(row=><article style={{...panel,background:"#f8fafc"}} key={row.id}>
      <b>{row.deviceType==="PHONE"?"📱":"💻"} {row.brand} {row.model}</b>
      <p style={{color:"#475569",fontSize:13}}>{row.seller.name} ({row.seller.email}) · Student's proposed price {money(row.price)} · {row.status} · Ownership: {human(row.ownershipStatus)}</p>
      <p style={{fontSize:13,color:"#475569"}}>Documents: {row.ownershipEvidence?"Uploaded":"Missing"} · Selfie video: {row.sellerVideoEvidence?"Submitted":"Missing"} · Serial match: {row.identifierMatchedAt?"Recorded":"Not checked"}</p>
      {row.storeQuote&&<p style={{fontSize:13}}>Your offer: <b>{money(row.storeQuote.price)} — {human(row.storeQuote.status)}</b></p>}
      {row.ownershipStatus!=="REVIEWED"&&<p style={{color:"#92400e",fontSize:12}}>First review the receipt, face-to-camera seller statement and device identifier in Ownership Review below. You cannot offer to purchase until that is done.</p>}
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {row.ownershipStatus==="REVIEWED"&&!row.storeQuote?.status?.includes("ACQUIRED")&&row.storeQuote?.status!=="SELLER_ACCEPTED"&&row.sellerId!==row.storeQuote?.ownerId&&
          <button style={button} disabled={busy} onClick={()=>begin("quote",row)}>Offer a private purchase price</button>}
        {row.storeQuote?.status==="SELLER_ACCEPTED"&&
          <button style={button} disabled={busy} onClick={()=>begin("acquire",row)}>Record purchase and receive device</button>}
        {row.ownershipStatus==="REVIEWED"&&row.sellerId===row.storeQuote?.ownerId&&
          <button style={button} disabled={busy} onClick={()=>begin("activate",row)}>Activate my personally owned stock</button>}
      </div>
    </article>)}
    <h3>My store inventory ({stock.length})</h3>
    {!stock.length&&<p>No devices have been purchased or activated as personal stock yet.</p>}
    {stock.map(item=><article style={{...panel,background:"#f8fafc"}} key={item.id}>
      <b>{item.deviceType==="PHONE"?"📱":"💻"} {item.brand} {item.model}</b>
      <p style={{fontSize:13,color:"#475569"}}>{money(item.price)} · {item.status} · Acquired: {item.storeAcquiredAt?new Date(item.storeAcquiredAt).toLocaleDateString():"pending"}</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
        <button style={button} type="button" disabled={busy||item.status==="CLOSED"} onClick={()=>begin("reprice",item)}>Update my price</button>
        {item.status!=="CLOSED"&&<button type="button" style={{...button,background:"#334155"}} disabled={busy} onClick={()=>action(
          ()=>api.adminSetStoreStatus(item.id,item.status==="ACTIVE"?"PAUSED":"ACTIVE"),
          "Your store stock visibility has been updated."
        )}>{item.status==="ACTIVE"?"Pause sales":"Publish this device"}</button>}
      </div>
    </article>)}
    {editing&&<form style={{...panel,border:"2px solid #047857"}} onSubmit={submit}>
      <h3>{editing.kind==="quote"?"Send student a private cash offer":
        editing.kind==="acquire"?"Confirm store purchase and physical handover":
        editing.kind==="activate"?"Activate your already-owned physical stock":"Change your shop asking price"}</h3>
      {["quote","reprice"].includes(editing.kind)&&<label>Price in ₦
        <input type="number" style={field} min="1000" max="100000000" required value={price} onChange={e=>setPrice(e.target.value)}/>
      </label>}
      {editing.kind==="acquire"&&<label>Resale price in ₦
        <input type="number" style={field} min="1000" max="100000000" required value={resalePrice} onChange={e=>setResalePrice(e.target.value)}/>
      </label>}
      {editing.kind!=="reprice"&&<label>Owner's private audit note (required)
        <textarea required minLength={15} maxLength={1000} style={field} value={note} onChange={e=>setNote(e.target.value)}
          placeholder="Evidence examined; seller's agreement; physical inspection details; payment and signed receipt notes."/>
      </label>}
      {editing.kind==="acquire"&&<div style={{display:"grid",gap:10,margin:"10px 0"}}>
        <label><input type="checkbox" checked={inspection} onChange={e=>setInspection(e.target.checked)}/> I personally inspected the actual device and its locks/serial.</label>
        <label><input type="checkbox" checked={payment} onChange={e=>setPayment(e.target.checked)}/> I independently confirmed the seller has been paid (not from a screenshot).</label>
        <label><input type="checkbox" checked={handover} onChange={e=>setHandover(e.target.checked)}/> The seller agreed to this price and delivered the device into my custody.</label>
      </div>}
      {editing.kind==="activate"&&<div style={{display:"grid",gap:10,margin:"10px 0"}}>
        <label><input type="checkbox" checked={inspection} onChange={e=>setInspection(e.target.checked)}/> This device is physically in my own store.</label>
        <label><input type="checkbox" checked={handover} onChange={e=>setHandover(e.target.checked)}/> I inspected the original ownership provenance.</label>
      </div>}
      <div style={{display:"flex",gap:10,marginTop:12}}>
        <button style={button} disabled={busy} type="submit">Save owner decision</button>
        <button style={{...button,background:"#64748b"}} type="button" onClick={()=>setEditing(null)}>Cancel</button>
      </div>
    </form>}
  </section>;
}
