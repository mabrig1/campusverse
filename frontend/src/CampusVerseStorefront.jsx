import { useEffect, useState } from "react";
import { api } from "./api";
import "./storefront.css";

const money = number => "₦" + Number(number || 0).toLocaleString("en-NG",{maximumFractionDigits:0});

export default function CampusVerseStorefront({ onLogin }) {
  const [stock,setStock]=useState([]);
  const [loading,setLoading]=useState(true);
  const [issue,setIssue]=useState("");
  useEffect(()=>{
    let active=true;
    api.getLaptopListings().then(data=>{
      if(active){setStock(data.items||[]);setLoading(false);}
    }).catch(()=>{
      if(active){setIssue("Live inventory is temporarily unavailable.");setLoading(false);}
    });
    return ()=>{active=false;};
  },[]);
  const signIn = ()=>onLogin("laptops");
  const jump = id => document.getElementById(id)?.scrollIntoView({behavior:"smooth"});
  return <div className="storefront cv-store-pilot">
    <header className="store-nav">
      <button className="store-brand" type="button" onClick={()=>jump("home")} aria-label="CampusVerse home">
        <span className="store-logo">C</span>
        <span><b>CampusVerse</b><small>Pre-owned laptops & iPhones • One managed store</small></span>
      </button>
      <nav aria-label="Store navigation">
        <button type="button" onClick={()=>jump("home")}>Home</button>
        <button type="button" onClick={()=>jump("stock")}>Shop devices</button>
        <button type="button" onClick={()=>jump("sell")}>Sell to us</button>
        <button type="button" onClick={()=>jump("how")}>How it works</button>
      </nav>
      <div className="store-nav-actions">
        <button type="button" className="store-login" onClick={signIn}>Sign in</button>
        <button type="button" className="store-primary" onClick={signIn}>Join CampusVerse</button>
      </div>
    </header>
    <main>
      <section id="home" className="store-hero">
        <div className="hero-copy">
          <span className="eyebrow">THE CAMPUSVERSE OWNER-MANAGED FIRST RELEASE</span>
          <h1>Better used laptops & iPhones. <em>One store you can deal with.</em></h1>
          <p>Need an affordable device? Buy from CampusVerse's own inspected stock. Have a laptop or iPhone to sell? Offer it directly to our store. Every purchase, sale and swap is personally managed by the CampusVerse owner.</p>
          <div className="hero-actions">
            <button type="button" className="store-primary large" onClick={()=>jump("stock")}>Shop available devices →</button>
            <button type="button" className="store-outline large" onClick={()=>jump("sell")}>Sell your device to us</button>
          </div>
          <div className="hero-proof">
            <span>✓ One CampusVerse shop</span><span>✓ Private ownership review</span><span>✓ Supervised deals</span>
          </div>
        </div>
        <div className="hero-card cv-store-owner-card">
          <span className="hero-mini">YOUR DEVICE, OUR DIRECT RESPONSIBILITY</span>
          <h3>Not another anonymous marketplace.</h3>
          <div className="hero-stat"><b>01</b><span>One store owner handles every transaction</span></div>
          <div className="hero-stat"><b>02</b><span>Sellers submit documents and a live authorisation video</span></div>
          <div className="hero-stat"><b>03</b><span>Stock appears only after CampusVerse acquires it</span></div>
          <small>Proof review and physical inspection reduce risks but are not a guarantee against stolen or restricted devices.</small>
        </div>
      </section>

      <section className="cv-store-pillars" aria-label="Our first launch model">
        <div><b>🏬 A single physical trading desk</b><p>Students trade with CampusVerse management, not with unknown third-party shops.</p></div>
        <div><b>📄 Origin and consent checks</b><p>Private lawful ownership documents and a fresh seller-initiated selfie declaration.</p></div>
        <div><b>🔁 Direct buy, sell and swap</b><p>Private store quotes, supervised inspection, payment confirmation and handover.</p></div>
      </section>

      <section id="stock" className="store-section cv-store-stock">
        <div className="section-heading">
          <div>
            <span className="eyebrow">IN OUR STORE • REAL AVAILABLE INVENTORY ONLY</span>
            <h2>Shop pre-owned laptops & iPhones.</h2>
            <p>These are devices confirmed as CampusVerse store inventory. We do not display private student submissions as available stock.</p>
          </div>
          <button className="store-primary" type="button" onClick={signIn}>Browse & make a store offer →</button>
        </div>
        {loading ? <p role="status">Loading live CampusVerse store stock…</p> :
          issue ? <div className="cv-store-empty" role="status">{issue} Contact our store or try again.</div> :
          stock.length ? <div className="cv-store-stock-grid">{stock.slice(0,6).map(d=><article className="cv-store-stock-card" key={d.id}>
            <div className="cv-store-stock-visual">{d.imageUrl ? <img src={d.imageUrl} alt={d.brand+" "+d.model} loading="lazy" /> :
              <span aria-hidden="true">{d.deviceType==="PHONE"?"📱":"💻"}</span>}</div>
            <div className="cv-store-stock-description">
              <small>{d.deviceType==="PHONE"?"PRE-OWNED PHONE":"PRE-OWNED LAPTOP"} · IN CAMPUSVERSE STOCK</small>
              <h3>{d.brand} {d.model}</h3>
              <p>{d.condition?.replaceAll("_"," ")} · {d.storageGb}GB storage</p>
              <strong>{money(d.price)}</strong>
              <button type="button" className="store-primary" onClick={signIn}>Enquire / make an offer</button>
            </div>
          </article>)}</div> :
          <div className="cv-store-empty"><b>Our live inventory is being prepared.</b><p>We publish devices only after completing the physical purchase and internal checks. You can still register to sell a device directly to CampusVerse.</p><button className="store-primary" type="button" onClick={signIn}>Join to sell a device →</button></div>}
      </section>

      <section id="sell" className="store-laptop-teaser cv-store-sell">
        <div>
          <span className="eyebrow">SELL DIRECTLY TO CAMPUSVERSE</span>
          <h2>Have an old laptop or iPhone? <em>Offer it to our store.</em></h2>
          <p>Tell us what you own and your preferred price. Upload your ownership receipt or lawful transfer document, then record a fresh selfie video authorising the sale. We examine the device, make a private offer and purchase it only if you agree.</p>
          <div className="store-laptop-badges">
            <span>📄 Receipt / transfer proof</span><span>📹 Seller video</span>
            <span>💰 Your private quote</span><span>🤝 Managed handover</span>
          </div>
          <button type="button" className="store-primary large" onClick={signIn}>Submit a sell-to-store request →</button>
          <small>Submitting documents does not transfer ownership or promise an offer. Videos are private to the trading desk and manually reviewed.</small>
        </div>
        <div className="store-laptop-visual"><span aria-hidden="true">📱💻</span>
          <b>Your device. Our purchase offer.</b><p>No need to open a store, find a stranger or advertise your device publicly.</p>
        </div>
      </section>

      <section id="how" className="store-section cv-store-process">
        <div className="section-heading"><div>
          <span className="eyebrow">ONE SHOP, TWO SIMPLE JOURNEYS</span>
          <h2>Every deal comes through CampusVerse management.</h2>
          <p>Buying, selling and trade-in swaps are reviewed and completed by our store, not automatically between students.</p>
        </div></div>
        <div className="cv-store-process-grid">
          <article><span>FOR BUYERS</span><h3>Buy directly from our stock</h3>
            <p><b>1.</b> Register and browse devices CampusVerse already owns.</p>
            <p><b>2.</b> Submit a purchase or trade-in offer for management review.</p>
            <p><b>3.</b> Inspect the device and complete payment and handover with the store.</p>
            <button className="store-outline" onClick={signIn}>I want to buy →</button>
          </article>
          <article><span>FOR SELLERS</span><h3>Sell directly to our store</h3>
            <p><b>1.</b> Register and submit your device details, receipt and fresh selfie statement.</p>
            <p><b>2.</b> Our owner checks provenance and offers a private price.</p>
            <p><b>3.</b> Accept or decline. If you accept, we pay, inspect and receive it in person.</p>
            <button className="store-primary" onClick={signIn}>I want to sell →</button>
          </article>
        </div>
      </section>

      <section className="trust-section">
        <div><span className="eyebrow">TRUST WITH REAL LIMITATIONS</span><h2>One accountable store, with proper checks.</h2>
          <p>Document and video review help discourage fraudulent listings. A receipt or selfie alone cannot establish legal ownership or confirm that a device is not stolen; physical inspection and further checks remain important.</p>
        </div>
        <div className="trust-grid">
          <div><b>🛡️ Private evidence</b><p>Seller receipts, serial fingerprints and consent videos are kept out of public listings.</p></div>
          <div><b>📍 Supervised handover</b><p>We record agreed prices, verified payment and custody before reselling a traded device.</p></div>
          <div><b>🔒 Pilot-only trading</b><p>Students cannot open personal stores or conduct student-to-student purchases through CampusVerse yet.</p></div>
        </div>
      </section>
    </main>
    <footer className="store-footer">
      <div><b>CampusVerse</b><p>Pre-owned laptops and iPhones. One personally managed campus store.</p></div>
      <div><b>Explore</b><button onClick={()=>jump("stock")}>Buy from us</button><button onClick={()=>jump("sell")}>Sell to us</button><button onClick={()=>jump("how")}>How the store works</button></div>
      <div><b>Your account</b><button onClick={signIn}>Sign in / register</button><p>Independent store registration is closed during our pilot.</p></div>
    </footer>
    <div className="store-bottom">© {new Date().getFullYear()} CampusVerse · Managed first release · No independent sellers' stores</div>
  </div>;
}
