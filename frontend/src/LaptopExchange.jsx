import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { estimateTopUp } from './laptopValuation';
import SellerIntentVideo from './SellerIntentVideo';
import './LaptopExchange.css';

const EMPTY = {
  deviceType: 'LAPTOP', brand: '', model: '', processor: '', ramGb: '8', storageGb: '256',
  storageType: 'SSD', condition: 'GOOD', batteryHealth: '',
  faults: 'None known', description: '', imageUrl: '', serialNumber: '',
  lockStatus: 'NOT_CHECKED', ownershipDeclared: false,
  price: '', allowSwap: true, location: '',
};
const conditions = { EXCELLENT: 'Excellent', GOOD: 'Good', FAIR: 'Fair', NEEDS_REPAIR: 'Needs repair' };
const money = (n) => '₦' + Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 });

export default function LaptopExchange({ user }) {
  const [view, setView] = useState(user?.storeIntent === 'SELL_TO_STORE' ? 'sell' : 'browse');
  const [items, setItems] = useState([]);
  const [mine, setMine] = useState([]);
  const [offers, setOffers] = useState([]);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [swapOnly, setSwapOnly] = useState(false);
  const [condition, setCondition] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ ...EMPTY });
  const [proofFile, setProofFile] = useState(null);
  const [proofType, setProofType] = useState('PURCHASE_RECEIPT');
  const [proofFiles, setProofFiles] = useState({});
  const [proofTypes, setProofTypes] = useState({});
  const [reportItem, setReportItem] = useState(null);
  const [reportKind, setReportKind] = useState('SUSPECTED_STOLEN');
  const [reportDetail, setReportDetail] = useState('');
  const [selected, setSelected] = useState(null);
  const [offerType, setOfferType] = useState('BUY');
  const [offeredId, setOfferedId] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [tradeInValue, setTradeInValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [repairDeduction, setRepairDeduction] = useState('0');
  const updateForm = (field, value) => setForm(previous => ({ ...previous, [field]: value }));
  const reload = () => setRefreshKey(x => x + 1);
  const activeOwned = mine.filter(x => x.status === 'ACTIVE' && x.ownershipStatus === 'REVIEWED');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [publicData, ownData, offerData] = await Promise.all([
          api.getLaptopListings({ q: search, swap: swapOnly, deviceType: deviceTypeFilter }),
          api.getMyLaptops(),
          api.getMyLaptopOffers(),
        ]);
        if (!cancelled) {
          setItems(publicData.items || []);
          setMine(ownData.items || []);
          setOffers(offerData.items || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [search, swapOnly, deviceTypeFilter, refreshKey]);

  const filtered = useMemo(
    () => items.filter(x => !condition || x.condition === condition),
    [items, condition],
  );
  const transact = async (fn, success) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      setNotice(success);
      reload();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  async function createListing(event) {
    event.preventDefault();
    const payload = {
      ...form, ramGb: Number(form.ramGb), storageGb: Number(form.storageGb),
      price: Number(form.price),
      batteryHealth: form.batteryHealth === '' ? null : Number(form.batteryHealth),
    };
    if (!proofFile || !['image/jpeg', 'image/png', 'application/pdf'].includes(proofFile.type) || proofFile.size > 2 * 1024 * 1024) {
      setError('Attach a JPEG, PNG or PDF of the purchase receipt or lawful transfer document (under 2 MB).');
      return;
    }
    if (await transact(async () => {
      const created = await api.createLaptopListing(payload);
      try {
        await api.uploadLaptopOwnershipProof(created.id, proofFile, proofType);
      } catch (error) {
        throw new Error('Listing saved privately, but proof upload failed: ' + error.message + '. Open My listings to try again.');
      }
    }, 'Ownership document received. Open My listings to record your required live seller-authorisation video before approval.')) {
      setForm({ ...EMPTY }); setProofFile(null); setProofType('PURCHASE_RECEIPT');
      setView('mine');
    }
  }
  async function submitOffer(event) {
    event.preventDefault();
    if (!selected) return;
    const payload = {
      type: offerType,
      offeredId: offerType === 'SWAP' ? offeredId : null,
      amount: Number(offerAmount),
      note: offerNote,
    };
    if (await transact(() => api.createLaptopOffer(selected.id, payload),
      'Offer submitted. No funds or ownership have moved. Arrange inspection before any exchange.')) {
      setSelected(null);
      setView('mine');
    }
  }
  async function sendSafetyReport(event) {
    event.preventDefault();
    if (!reportItem) return;
    if (await transact(() => api.reportLaptopSafety(reportItem.id, { reason: reportKind, detail: reportDetail }),
      'Safety report submitted to administrators. A suspected stolen device is hidden while investigated.')) {
      setReportItem(null); setReportDetail('');
    }
  }
  async function uploadProofForListing(id) {
    const file = proofFiles[id];
    if (!file || !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Select a JPEG, PNG or PDF document smaller than 2 MB.'); return;
    }
    if (await transact(() => api.uploadLaptopOwnershipProof(id, file, proofTypes[id] || 'PURCHASE_RECEIPT'),
      'Document submitted privately; listing hidden pending administrator review.')) {
      setProofFiles(previous => ({ ...previous, [id]: null }));
    }
  }
  const difference = estimateTopUp(targetValue, tradeInValue, repairDeduction);

  return (
    <div className="cv-laptop">
      <section className="cv-laptop-hero">
        <div>
          <div className="cv-laptop-eyebrow">CAMPUSVERSE • ONE PHYSICAL SHOP • OWNER-MANAGED PILOT</div>
          <h2>Buy from CampusVerse. <span>Sell your device to our store.</span></h2>
          <p>This first release is one personal campus store. Students buy used laptops and iPhones from CampusVerse, or offer their own device to the store for inspection and a private purchase quote. No student-to-student marketplace or independent shops are open.</p>
          <div className="cv-laptop-actions">
            <button className="cv-laptop-primary" onClick={() => setView('browse')}>Buy from CampusVerse</button>
            <button className="cv-laptop-outline" onClick={() => setView('sell')}>Sell to CampusVerse</button>
          </div>
        </div>
        <div className="cv-laptop-hero-side">
          <div className="cv-laptop-emoji" aria-hidden="true">💻</div>
          <strong>Ownership paperwork required.</strong>
          <p>Only devices actually acquired and controlled by CampusVerse may appear in this shop. Private student submissions never become peer-to-peer listings. Document reviews alone do not prove a device is theft-free.</p>
        </div>
      </section>

      <nav className="cv-laptop-tabs" aria-label="Laptop exchange sections">
        {[
          ['browse', 'Explore laptops'],
          ['sell', 'Sell or offer a swap'],
          ['mine', 'My listings & offers'],
          ['safety', 'Inspection & safety'],
        ].map(([key, label]) => (
          <button type="button" key={key} className={view === key ? 'chosen' : ''}
            onClick={() => { setView(key); setSelected(null); }}>{label}</button>
        ))}
      </nav>

      {error && <div className="cv-laptop-alert" role="alert">{error}</div>}
      {notice && <div className="cv-laptop-success" role="status">{notice}</div>}

      {view === 'browse' && (
        <section className="cv-laptop-pane">
          <div className="cv-laptop-title"><div><h3>CampusVerse store stock — laptops and iPhones</h3><p>These are devices in the CampusVerse store. Every purchase or swap is inspected and completed by the store owner, not strangers.</p></div><button className="cv-laptop-small" onClick={reload}>Refresh</button></div>
          <form className="cv-laptop-filter" onSubmit={e => { e.preventDefault(); setSearch(searchDraft.trim()); }}>
            <label className="cv-laptop-search"><span>Search brand, model or campus</span><input value={searchDraft} onChange={e => setSearchDraft(e.target.value)} placeholder="e.g. ThinkPad, HP, Nsukka" maxLength={100}/></label>
            <label><span>Device</span><select value={deviceTypeFilter} onChange={e=>setDeviceTypeFilter(e.target.value)}><option value="">All devices</option><option value="PHONE">Phones</option><option value="LAPTOP">Laptops</option></select></label>
            <label><span>Condition</span><select value={condition} onChange={e => setCondition(e.target.value)}><option value="">All conditions</option>{Object.entries(conditions).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="cv-laptop-check"><input type="checkbox" checked={swapOnly} onChange={e => setSwapOnly(e.target.checked)}/> Swaps accepted</label>
            <button type="submit" className="cv-laptop-primary">Search</button>
          </form>
          {loading ? <p className="cv-laptop-muted">Loading laptop listings…</p> : (
            <div className="cv-laptop-cards">
              {filtered.map(item => (
                <article className="cv-laptop-card" key={item.id}>
                  <div className="cv-laptop-picture">{item.imageUrl ? <img src={item.imageUrl} alt={item.brand + ' ' + item.model} loading="lazy" referrerPolicy="no-referrer" /> : <span aria-hidden="true">{item.deviceType === "PHONE" ? "📱" : "💻"}</span>}
                    <span className="cv-laptop-chip">{conditions[item.condition]}</span></div>
                  <div className="cv-laptop-card-body">
                    <div className="cv-laptop-eyebrow">{item.deviceType === 'PHONE' ? 'PHONE' : 'LAPTOP'} · {item.allowSwap ? 'SELL OR SWAP' : 'FOR SALE'} · {item.location}</div>
                    <h4>{item.brand} {item.model}</h4>
                    <strong className="cv-laptop-price">{money(item.price)}</strong>
                    <p>{item.processor} · {item.ramGb}GB RAM · {item.storageGb}GB {item.storageType}</p>
                    <p>Battery: {item.batteryHealth === null ? 'Not reported' : item.batteryHealth + '% claimed'} · Faults: {item.faults}</p>
                    {item.description && <p>{item.description}</p>}
                    <div className="cv-laptop-note"><b>📄 Ownership documents reviewed</b> · Not a stolen-device clearance or physical certification.</div>
                    <div className="cv-laptop-note">Seller: {item.seller?.name || 'CampusVerse member'} · Serial suffix: {item.serialLast4 || 'Not provided'}</div>
                    <div className="cv-laptop-note">Organisation/BIOS lock: {item.lockStatus === 'DECLARED_CLEAR' ? 'Seller reports clear; inspect yourself' : 'Not checked'}</div>
                    {item.sellerId !== user.id ? (
                      <div className="cv-laptop-action-stack cv-laptop-card-buttons"><button className="cv-laptop-primary cv-laptop-card-btn" onClick={() => {
                        setSelected(item); setReportItem(null); setOfferType('BUY'); setOfferAmount(String(item.price));
                        setOfferedId(''); setOfferNote('');
                      }}>Make an offer to CampusVerse</button>
                      <button className="cv-laptop-small" onClick={() => { setReportItem(item); setSelected(null); setReportDetail(''); }}>Report suspicious laptop</button></div>
                    ) : <span className="cv-laptop-owned">Your listing</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
          {!loading && !filtered.length && !error && <div className="cv-laptop-empty">No matching laptop listings yet. Be the first to list a real device — or broaden your search.</div>}
          {reportItem && view === 'browse' && (
            <form className="cv-laptop-offer" onSubmit={sendSafetyReport}>
              <div className="cv-laptop-title"><div><h3>Confidential safety report: {reportItem.brand} {reportItem.model}</h3><p>Report credible concerns. False or retaliatory reports may result in account action.</p></div>
                <button type="button" className="cv-laptop-small" onClick={() => setReportItem(null)}>Close</button></div>
              <div className="cv-laptop-fields">
                <label><span>Reason</span><select value={reportKind} onChange={e => setReportKind(e.target.value)}>
                  <option value="SUSPECTED_STOLEN">Suspected stolen device</option><option value="FALSE_DETAILS">Misleading specifications or ownership claims</option>
                  <option value="LOCKED_DEVICE">Company/BIOS/Apple locked</option><option value="OTHER">Other safety concern</option>
                </select></label>
                <label className="cv-laptop-wide"><span>Explain your concern (10–500 characters)</span><textarea required minLength={10} maxLength={500} value={reportDetail} onChange={e => setReportDetail(e.target.value)} placeholder="Describe the evidence or suspicious behaviour, without including sensitive personal information." /></label>
              </div>
              <button disabled={busy} className="cv-laptop-primary" type="submit">Send confidential report</button>
            </form>
          )}
          {selected && view === 'browse' && (
            <form className="cv-laptop-offer" onSubmit={submitOffer}>
              <div className="cv-laptop-title"><div><h3>Offer for {selected.brand} {selected.model}</h3><p>Offers are negotiation only. No payment is collected.</p></div><button type="button" className="cv-laptop-small" onClick={() => setSelected(null)}>Close</button></div>
              <div className="cv-laptop-fields">
                <label><span>Type of offer</span><select value={offerType} onChange={e => { setOfferType(e.target.value); setOfferAmount(e.target.value === 'BUY' ? String(selected.price) : '0'); }}>
                  <option value="BUY">Buy with cash</option>{selected.allowSwap && <option value="SWAP">Swap my laptop</option>}
                </select></label>
                {offerType === 'SWAP' && <label><span>Your laptop to exchange</span><select required value={offeredId} onChange={e => setOfferedId(e.target.value)}><option value="">Select an active listing</option>{activeOwned.map(x => <option key={x.id} value={x.id}>{x.brand} {x.model} ({money(x.price)})</option>)}</select></label>}
                <label><span>{offerType === 'SWAP' ? 'Cash top-up (₦): + you pay seller, − seller pays you' : 'Cash offer (₦)'}</span>
                  <input type="number" required step="1" min={offerType === 'BUY' ? '1000' : '-100000000'} max="100000000" value={offerAmount} onChange={e => setOfferAmount(e.target.value)}/></label>
                <label className="cv-laptop-wide"><span>Message (optional)</span><textarea maxLength={400} value={offerNote} onChange={e => setOfferNote(e.target.value)} placeholder="Ask about repairs, battery health, inspection location or accessories."/></label>
              </div>
              {offerType === 'SWAP' && !activeOwned.length && <p className="cv-laptop-alert">List your own laptop first to make a swap offer.</p>}
              <button className="cv-laptop-primary" disabled={busy || (offerType === 'SWAP' && !offeredId)} type="submit">{busy ? 'Submitting…' : 'Send offer for inspection'}</button>
            </form>
          )}
        </section>
      )}

      {view === 'sell' && (
        <section className="cv-laptop-pane">
          <div className="cv-laptop-title"><div><h3>Offer your phone or laptop to the CampusVerse store</h3><p>You are not opening a shop. Submit a private sell-to-store request with proof of ownership and a fresh seller selfie video. CampusVerse management inspects the device and can send you a private purchase quote. Only after you agree and are paid will it become our store inventory.</p></div></div>
          <form className="cv-laptop-list-form" onSubmit={createListing}>
            <div className="cv-laptop-fields">
              <label><span>Device type</span><select value={form.deviceType} onChange={e=>setForm(s=>({...s,deviceType:e.target.value,storageType:e.target.value==="PHONE"?"INTERNAL":"SSD",ramGb:e.target.value==="PHONE"?"4":"8",serialNumber:""}))}><option value="LAPTOP">Laptop</option><option value="PHONE">Phone</option></select></label>
              {[
                ['brand', 'Brand (e.g. HP, Apple or Samsung)'], ['model', 'Model'], ['processor', 'Processor and generation'],
                ['ramGb', 'RAM (GB)', 'number'], ['storageGb', 'Storage (GB)', 'number'],
              ].map(([key, label, type]) => <label key={key}><span>{label}</span><input required type={type || 'text'} min={type ? 1 : undefined} value={form[key]} maxLength={type ? undefined : 100} onChange={e => updateForm(key, e.target.value)}/></label>)}
              <label><span>Storage technology</span><select value={form.storageType} onChange={e => updateForm('storageType', e.target.value)}><option>SSD</option><option>HDD</option><option>EMMC</option><option>INTERNAL</option></select></label>
              <label><span>Overall condition</span><select value={form.condition} onChange={e => updateForm('condition', e.target.value)}>{Object.entries(conditions).map(([key,val]) => <option key={key} value={key}>{val}</option>)}</select></label>
              <label><span>Battery health % (optional, seller-reported)</span><input type="number" min="0" max="100" value={form.batteryHealth} onChange={e => updateForm('batteryHealth', e.target.value)} placeholder="From a battery report"/></label>
              <label><span>Asking price (₦)</span><input type="number" min="1000" required value={form.price} onChange={e => updateForm('price', e.target.value)}/></label>
              <label><span>Campus / meeting area (not home address)</span><input required maxLength={120} value={form.location} onChange={e => updateForm('location', e.target.value)} placeholder="e.g. UNN, Nsukka"/></label>
              <label><span>BIOS / organisational lock status</span><select value={form.lockStatus} onChange={e => updateForm('lockStatus', e.target.value)}><option value="NOT_CHECKED">Not checked</option><option value="DECLARED_CLEAR">I have checked; I believe it is clear</option></select></label>
              <label><span>{form.deviceType === "PHONE" ? "15-digit IMEI (private; never shown in full)" : "Laptop serial (private; never shown in full)"}</span><input required minLength={form.deviceType === "PHONE" ? 15 : 6} maxLength={form.deviceType === "PHONE" ? 15 : 50} value={form.serialNumber} onChange={e => updateForm('serialNumber', e.target.value)} placeholder="Read from chassis or firmware"/></label>
              <label className="cv-laptop-wide"><span>Known faults and repair history (write “None known” if appropriate)</span><textarea required maxLength={600} value={form.faults} onChange={e => updateForm('faults', e.target.value)}/></label>
              <label className="cv-laptop-wide"><span>Accessories and additional details</span><textarea maxLength={2000} value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder="Charger, webcam, ports, repair receipts, cosmetic issues…"/></label>
              <label className="cv-laptop-wide"><span>HTTPS image URL (optional)</span><input type="url" value={form.imageUrl} onChange={e => updateForm('imageUrl', e.target.value)} placeholder="https://..."/></label>
            </div>
            <div className="cv-laptop-proof-box">
              <h4>Step 1 — Private proof of ownership</h4>
              <p>Attach a clear document or photo of an original purchase receipt, a signed bill of sale, or an official employer/school release. Show the laptop serial suffix and legitimate transfer history. Redact phone numbers, home address, payment details, NIN and BVN. No proof is shown publicly.</p>
              <div className="cv-laptop-fields">
                <label><span>Document type</span><select value={proofType} onChange={e => setProofType(e.target.value)}><option value="PURCHASE_RECEIPT">Original purchase receipt</option><option value="BILL_OF_SALE">Signed bill of sale / previous owner transfer</option><option value="ORGANISATION_RELEASE">Official organisation release</option></select></label>
                <label><span>Ownership receipt or signed transfer (JPEG, PNG or PDF; 2 MB maximum)</span><input type="file" required accept="image/jpeg,image/png,application/pdf" onChange={e => setProofFile(e.target.files?.[0] || null)} /></label>
              </div>
            </div>
            <div className="cv-laptop-consent">
              <label><input type="checkbox" checked={form.allowSwap} onChange={e => updateForm('allowSwap', e.target.checked)}/> Accept swap proposals as well as cash offers</label>
              <label><input type="checkbox" required checked={form.ownershipDeclared} onChange={e => updateForm('ownershipDeclared', e.target.checked)}/> I declare I own this laptop or am authorised to sell it and have disclosed known faults. This is not third-party verification.</label>
            </div>
            <button type="submit" className="cv-laptop-primary" disabled={busy}>{busy ? 'Saving privately…' : 'Submit private listing and ownership document'}</button>
          </form>
        </section>
      )}

      {view === 'mine' && (
        <section className="cv-laptop-pane">
          <div className="cv-laptop-title"><div><h3>My sell-to-CampusVerse requests and store purchases</h3><p>Manage listings and respond to offers. Accepting is not a completed transaction.</p></div><button onClick={reload} className="cv-laptop-small">Refresh</button></div>
          <h4 className="cv-laptop-subtitle">My private device submissions</h4>
          {!mine.length && <p className="cv-laptop-muted">You have not offered a device to the CampusVerse store.</p>}
          <div className="cv-laptop-activity">
            {mine.map(item => <div className="cv-laptop-activity-row" key={item.id}>
              <div className="cv-laptop-listing-detail">
                <b>{item.brand} {item.model}</b>
                <p>{money(item.price)} · {item.status} · {item.allowSwap ? 'Swaps welcome' : 'Cash offers only'} · Serial ending {item.serialLast4 || 'unknown'}</p>
                <p className="cv-laptop-review-line">Document and seller identity review: <b>{item.ownershipStatus.replaceAll('_', ' ')}</b> — your submission is not publicly for sale.</p>
                {item.storeQuote && <div className="cv-laptop-review-line">
                  <b>CampusVerse purchase offer: {money(item.storeQuote.price)} — {item.storeQuote.status.replaceAll('_', ' ')}</b>
                  {item.storeQuote.note && <p>Owner message: {item.storeQuote.note}</p>}
                  {item.storeQuote.status === 'OFFERED' && <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:10}}>
                    <button type="button" className="cv-laptop-primary" disabled={busy}
                      onClick={()=>transact(()=>api.sellerRespondStoreQuote(item.id,'SELLER_ACCEPTED'),
                        'You agreed to the purchase price. Visit the CampusVerse store for inspection, verified payment and signed handover.')}>
                      Accept CampusVerse offer
                    </button>
                    <button type="button" className="cv-laptop-small" disabled={busy}
                      onClick={()=>transact(()=>api.sellerRespondStoreQuote(item.id,'SELLER_DECLINED'),'You declined the offer. Your device remains yours.')}>
                      Decline
                    </button>
                  </div>}
                  {item.storeQuote.status === 'SELLER_ACCEPTED' && <p>Price agreed. Device and payment still require the owner’s in-person confirmation.</p>}
                  {item.storeQuote.status === 'ACQUIRED' && <p>CampusVerse has recorded the purchase and handover. This device is no longer your active listing.</p>}
                </div>}
                {item.ownershipReviewNote && <p>Administrator note: {item.ownershipReviewNote}</p>}
                {item.ownershipEvidence && <p>Private document on file: {item.ownershipEvidence.documentType.replaceAll('_', ' ')}</p>}
                {!item.sellerVideoEvidence && <p><b>📹 Seller video still required:</b> Record a new front-camera authorisation clip before the trading desk can approve this listing.</p>}
                {!['FLAGGED','REVOKED'].includes(item.ownershipStatus) && item.status !== 'CLOSED' && <div className="cv-laptop-proof-upload">
                  <label><span>Document type</span><select value={proofTypes[item.id] || 'PURCHASE_RECEIPT'} onChange={e => setProofTypes(p => ({ ...p, [item.id]: e.target.value }))}><option value="PURCHASE_RECEIPT">Purchase receipt</option><option value="BILL_OF_SALE">Bill of sale</option><option value="ORGANISATION_RELEASE">Organisation release</option></select></label>
                  <label><span>{item.ownershipEvidence ? 'Replace private document' : 'Upload missing ownership proof'}</span><input type="file" accept="image/jpeg,image/png,application/pdf" onChange={e => setProofFiles(p => ({ ...p, [item.id]: e.target.files?.[0] || null }))}/></label>
                  <button disabled={busy || !proofFiles[item.id]} onClick={() => uploadProofForListing(item.id)} type="button" className="cv-laptop-small">Send for review</button>
                  {item.ownershipEvidence && <button disabled={busy} className="cv-laptop-small" type="button" onClick={() => {
                    if (window.confirm('Erase your private evidence? The listing will be removed from public search.')) transact(() => api.removeLaptopOwnershipProof(item.id), 'Private document erased and listing hidden.');
                  }}>Erase evidence</button>}
                </div>}
                {item.ownershipEvidence && !['FLAGGED','REVOKED'].includes(item.ownershipStatus) && item.status !== 'CLOSED' &&
                  <SellerIntentVideo listing={item} onComplete={reload}/>}
                {['FLAGGED','REVOKED'].includes(item.ownershipStatus) && <p>Contact CampusVerse support for administrator review; editing proof cannot automatically clear a theft report.</p>}
              </div>
              <label><span>Availability</span><select disabled={busy} value={item.status} onChange={e => transact(() => api.setLaptopStatus(item.id, e.target.value), 'Listing status updated.')}><option value="ACTIVE">Active</option><option value="PAUSED">Paused</option><option value="CLOSED">Closed</option></select></label>
            </div>)}
          </div>
          <h4 className="cv-laptop-subtitle">My buying and swap requests to CampusVerse</h4>
          {!offers.length && <p className="cv-laptop-muted">No offers yet. Offers appear here after buyers submit them.</p>}
          <div className="cv-laptop-activity">
            {offers.map(o => {
              const incoming = o.target.sellerId === user.id;
              return <article className="cv-laptop-activity-row" key={o.id}>
                <div><div className="cv-laptop-eyebrow">{incoming ? 'INCOMING OFFER' : 'YOUR OFFER'} · {o.status}</div>
                  <b>{o.type} · {o.target.brand} {o.target.model}</b>
                  <p>{o.type === 'BUY' ? 'Cash bid: ' : 'Signed cash top-up: '}{money(Math.abs(o.amount))}{o.type === 'SWAP' ? (o.amount >= 0 ? ' (offerer pays seller)' : ' (seller pays offerer)') : ''}</p>
                  {o.offered && <p>Swap device: {o.offered.brand} {o.offered.model}</p>}
                  {incoming && <p>Proposed by: {o.buyer.name}</p>}
                  {o.note && <p>Message: {o.note}</p>}
                  {o.status === "PENDING" && <p>Awaiting owner approval. The seller cannot accept yet.</p>}
                  {o.status === "ACCEPTED" && <p>Seller agreed. The owner must confirm inspection, payment and handover.</p>}
                </div>
                {["PENDING","ADMIN_APPROVED"].includes(o.status) && <div className="cv-laptop-action-stack">
                  {incoming && o.status === "ADMIN_APPROVED" ? <><button disabled={busy} onClick={() => transact(() => api.decideLaptopOffer(o.id, 'ACCEPTED'), 'Offer accepted for discussion and inspection only.')}>Accept to discuss</button><button disabled={busy} onClick={() => transact(() => api.decideLaptopOffer(o.id, 'DECLINED'), 'Offer declined.')}>Decline</button></> :
                    <button disabled={busy} onClick={() => transact(() => api.decideLaptopOffer(o.id, 'WITHDRAWN'), 'Offer withdrawn.')}>Withdraw</button>}
                </div>}
              </article>;
            })}
          </div>
          <p className="cv-laptop-muted">Accepted offers do not automatically lock funds, transfer ownership, or close a listing. Inspect each device and agree on a documented handover separately.</p>
        </section>
      )}

      {view === 'safety' && (
        <section className="cv-laptop-pane">
          <div className="cv-laptop-title"><div><h3>Phone and laptop safety centre</h3><p>Use these checks before any cash purchase or exchange in Nigeria.</p></div></div>
          <div className="cv-laptop-safety-grid">
            {[
              ['01', 'Confirm ownership', 'Only reviewed-document listings can be offered for trade. Still demand original receipt or legal bill of sale, confirm seller authority, compare actual chassis and firmware serial numbers and obtain a signed handover receipt. Forged receipts are possible; this is not police database clearance.'],
              ['02', 'Verify actual specifications', 'Inspect CPU generation, RAM, SSD, Windows activation, screen, keyboard, webcam, Wi-Fi, ports and charger. Do not trust screenshots alone.'],
              ['03', 'Assess battery and locks', 'Generate a Windows battery report. Check BIOS passwords, Apple Activation Lock, and company/school management. Reinstalling Windows may not remove organisation enrolment.'],
              ['04', 'Inspect in a safe location', 'Arrange a staffed public meeting, bring a trusted companion, test for 20–30 minutes and do not travel to an unfamiliar isolated location.'],
              ['05', 'Confirm payment independently', 'Never trust a transfer screenshot or SMS alone. Check your own bank account. Laptop swap offers here do not use escrow or collect money.'],
              ['06', 'Protect private information', 'Back up and erase personal data before handover; never publish NIN, BVN, full serial numbers, bank details, home address or passwords in a listing.'],
            ].map(([n,t,d]) => <article key={n}><span>{n}</span><h4>{t}</h4><p>{d}</p></article>)}
          </div>
          <div className="cv-laptop-calculator">
            <h4>Swap top-up calculator</h4>
            <p>Negotiation illustration only. These are user-entered estimates, not appraisals.</p>
            <div className="cv-laptop-fields">
              <label><span>Replacement laptop value (₦)</span><input type="number" min="0" value={targetValue} onChange={e => setTargetValue(e.target.value)}/></label>
              <label><span>Your laptop trade-in value (₦)</span><input type="number" min="0" value={tradeInValue} onChange={e => setTradeInValue(e.target.value)}/></label>
              <label><span>Repairs / deductions (₦)</span><input type="number" min="0" value={repairDeduction} onChange={e => setRepairDeduction(e.target.value)}/></label>
            </div>
            <strong>{difference >= 0 ? 'You pay: ' : 'You receive: '}{money(Math.abs(difference))}</strong>
            <p>Get both devices inspected and agree on the signed top-up before sending an offer.</p>
          </div>
        </section>
      )}
    </div>
  );
}
