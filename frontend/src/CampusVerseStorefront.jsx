import { useMemo, useState } from 'react';

const services = [
  { icon: '📚', title: 'Assignment Support', price: '₦1,500', text: 'Get help understanding your task, structuring your work, researching sources, referencing and polishing your final submission.', badge: 'Popular' },
  { icon: '📖', title: 'Book Review', price: '₦3,000', text: 'Clear review structure, critical-reading guidance, editing and academic presentation support.', badge: 'Student pick' },
  { icon: '📝', title: 'Term Paper Support', price: '₦3,000', text: 'Move from topic to a stronger paper with research planning, citations, editing and formatting guidance.', badge: 'Popular' },
  { icon: '🎓', title: 'Project Support', price: '₦50,000', text: 'Research design, methodology guidance, data-analysis support, formatting and presentation preparation.', badge: 'Final-year' },
  { icon: '🖨️', title: 'B&W Printing', price: '₦30 / page', text: 'Affordable black-and-white printing for notes, assignments, forms, handouts and academic documents.', badge: 'Everyday' },
  { icon: '🌈', title: 'Colour Printing', price: '₦100 / page', text: 'Professional colour printing for presentations, project materials, forms and important documents.', badge: 'Campus essential' },
];

const products = [
  { icon: '📱', title: 'Smartphones', price: 'Shop from available stock', tag: 'Gadgets', text: 'Phones selected for everyday student life.' },
  { icon: '🔋', title: 'Power Banks', price: 'Shop from available stock', tag: 'Power', text: 'Keep your devices powered between classes.' },
  { icon: '🔌', title: 'Fast Chargers', price: 'Shop from available stock', tag: 'Power', text: 'Reliable charging essentials for campus.' },
  { icon: '🎧', title: 'Wireless Earbuds', price: 'Shop from available stock', tag: 'Audio', text: 'Music, calls and study sessions on the move.' },
  { icon: '🔗', title: 'USB-C & Lightning Cables', price: 'Shop from available stock', tag: 'Accessories', text: 'Replacement and everyday charging cables.' },
  { icon: '🛡️', title: 'Screen Protectors', price: 'Shop from available stock', tag: 'Protection', text: 'Simple protection for your phone screen.' },
];

const benefits = [
  ['🎯', 'One campus destination', 'Services, gadgets, accessories and earning opportunities in one place.'],
  ['⚡', 'Built for student speed', 'Find what you need quickly instead of searching through scattered contacts.'],
  ['🤝', 'A campus network', 'Students, partners and vendors can participate in a growing local marketplace.'],
  ['🔒', 'Safer transactions', 'CampusVerse is designed around clearer ordering, verification and transaction workflows.'],
];

export default function CampusVerseStorefront({ onLogin }) {
  const [active, setActive] = useState('home');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  const filteredProducts = useMemo(() => products.filter(p => `${p.title} ${p.tag} ${p.text}`.toLowerCase().includes(query.toLowerCase())), [query]);

  const action = (text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 3200);
  };

  const scrollTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="storefront">
      {notice && <div className="store-toast">✓ {notice}</div>}

      <header className="store-nav">
        <button className="store-brand" onClick={() => scrollTo('home')} aria-label="CampusVerse home">
          <span className="store-logo">C</span>
          <span><b>CampusVerse</b><small>Campus commerce & services</small></span>
        </button>
        <nav aria-label="Primary navigation">
          <button className={active === 'home' ? 'active' : ''} onClick={() => scrollTo('home')}>Home</button>
          <button className={active === 'services' ? 'active' : ''} onClick={() => scrollTo('services')}>Services</button>
          <button className={active === 'shop' ? 'active' : ''} onClick={() => scrollTo('shop')}>Shop</button>
          <button className={active === 'partners' ? 'active' : ''} onClick={() => scrollTo('partners')}>Earn While You Learn</button>
        </nav>
        <div className="store-nav-actions">
          <button className="store-login" onClick={onLogin}>Sign in</button>
          <button className="store-primary" onClick={() => scrollTo('services')}>Get started</button>
        </div>
      </header>

      <main>
        <section id="home" className="store-hero">
          <div className="hero-copy">
            <span className="eyebrow">YOUR CAMPUS. YOUR MARKETPLACE. YOUR OPPORTUNITY.</span>
            <h1>Need it on campus? <em>Start here.</em></h1>
            <p>From academic support and printing to phones, accessories and student earning opportunities, CampusVerse brings the campus economy into one simple place.</p>
            <div className="hero-actions">
              <button className="store-primary large" onClick={() => scrollTo('services')}>Get academic support →</button>
              <button className="store-outline large" onClick={() => scrollTo('shop')}>Shop gadgets & accessories</button>
            </div>
            <div className="hero-proof"><span>✓ Clear pricing</span><span>✓ Student-focused</span><span>✓ Campus-first marketplace</span></div>
          </div>
          <div className="hero-card">
            <span className="hero-mini">CAMPUSVERSE • ONE PLACE</span>
            <h3>Stop searching. Start getting things done.</h3>
            <div className="hero-stat"><b>6+</b><span>academic & document services</span></div>
            <div className="hero-stat"><b>Gadgets</b><span>phones, power, audio & accessories</span></div>
            <div className="hero-stat"><b>20%</b><span>qualifying partner commission*</span></div>
            <small>*Referral commissions become payable only after official programme activation and qualifying-order verification.</small>
          </div>
        </section>

        <section className="category-strip" aria-label="CampusVerse categories">
          <button onClick={() => scrollTo('services')}><span>🎓</span><b>Academic Services</b><small>Support, research & printing</small></button>
          <button onClick={() => scrollTo('shop')}><span>📱</span><b>Gadgets</b><small>Phones & everyday electronics</small></button>
          <button onClick={() => scrollTo('shop')}><span>🔌</span><b>Accessories</b><small>Power, audio & cables</small></button>
          <button onClick={() => scrollTo('partners')}><span>🚀</span><b>Earn While You Learn</b><small>Refer. Serve. Grow.</small></button>
        </section>

        <section className="why-strip">
          <div className="why-heading"><span className="eyebrow">WHY CAMPUSVERSE?</span><h2>Built around real student needs.</h2></div>
          <div className="benefit-grid">{benefits.map(([icon, title, text]) => <article key={title}><span>{icon}</span><div><b>{title}</b><p>{text}</p></div></article>)}</div>
        </section>

        <section id="services" className="store-section">
          <div className="section-heading">
            <div><span className="eyebrow">MABRIG ACADEMIC SERVICES</span><h2>Get the support you need to move forward.</h2><p>Choose a service, see the price upfront, then request help. Our academic support is designed to help students understand, improve and present their own work.</p></div>
            <button className="text-link" onClick={() => action('Choose a service below, then sign in to continue.')}>How it works →</button>
          </div>
          <div className="service-grid">
            {services.map(s => <article className="service-card" key={s.title}>
              <div><div className="service-top"><span className="service-icon">{s.icon}</span><span className="service-badge">{s.badge}</span></div><span className="service-label">MABRIG ACADEMIC SERVICES</span><h3>{s.title}</h3><p>{s.text}</p></div>
              <footer><strong>{s.price}</strong><button onClick={() => action(`${s.title} selected — sign in to request it.`)}>Request service</button></footer>
            </article>)}
          </div>
          <div className="service-note"><b>Need something else?</b><span>Ask about research guidance, editing, formatting, data-analysis support and other legitimate campus services.</span><button onClick={onLogin}>Talk to CampusVerse →</button></div>
        </section>

        <section id="shop" className="store-section shop-section">
          <div className="section-heading shop-heading">
            <div><span className="eyebrow">CAMPUS SHOP</span><h2>Essentials that keep campus life moving.</h2><p>Find smartphones, power accessories, audio gear and everyday phone essentials. Inventory and final prices are confirmed when an order is placed.</p></div>
            <div className="shop-search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search phones, chargers, earbuds..." aria-label="Search products" /></div>
          </div>
          <div className="product-grid">
            {filteredProducts.map(p => <article className="product-card" key={p.title}><div className="product-visual"><span>{p.icon}</span><i>Campus essential</i></div><div className="product-body"><small>{p.tag}</small><h3>{p.title}</h3><p>{p.text}</p><strong>{p.price}</strong><button onClick={() => action(`${p.title} selected — sign in to continue.`)}>View & order</button></div></article>)}
          </div>
          {!filteredProducts.length && <div className="empty-search">No matching item yet. Try “charger”, “phone”, “power” or “earbuds”.</div>}
        </section>

        <section className="how-section">
          <div><span className="eyebrow">SIMPLE BY DESIGN</span><h2>From need to solution in three steps.</h2></div>
          <div className="steps"><article><b>01</b><h3>Choose</h3><p>Pick a service or campus product that fits your need.</p></article><article><b>02</b><h3>Request</h3><p>Sign in and provide the details needed to process your request.</p></article><article><b>03</b><h3>Get it done</h3><p>Follow your order, service request or delivery through the CampusVerse workflow.</p></article></div>
        </section>

        <section id="partners" className="partner-banner">
          <div><span className="eyebrow">🚀 EARN WHILE YOU LEARN</span><h2>Your network can become an opportunity.</h2><p>Know students who need printing, academic support, gadgets or accessories? Join the Mabrig Academic Partners Network and help connect real campus needs with real services.</p><div className="partner-points"><span>✓ 20% qualifying referral commission*</span><span>✓ Referral tracking</span><span>✓ Partner growth opportunities</span></div><small className="partner-disclaimer">*Do not collect referral commissions independently. Tracking and payout begin only after the official referral programme is activated.</small></div>
          <div className="partner-card"><span>QUALIFYING REFERRAL</span><strong>20%</strong><small>potential commission on eligible orders*</small><button className="store-primary" onClick={onLogin}>Join the network →</button></div>
        </section>

        <section className="trust-section"><div><span className="eyebrow">THE CAMPUSVERSE PROMISE</span><h2>A marketplace designed for campus life.</h2><p>Less friction. Clearer choices. More useful connections.</p></div><div className="trust-grid"><div><b>🔒 Safer</b><p>Clearer ordering and transaction workflows help reduce avoidable marketplace risk.</p></div><div><b>📍 Campus-first</b><p>Services and products are designed around student locations and everyday campus needs.</p></div><div><b>🤝 Connected</b><p>Students, vendors and partners can participate in one growing campus network.</p></div></div></section>
      </main>

      <footer className="store-footer"><div><b>CampusVerse</b><p>The digital campus marketplace for academic services, products and student opportunities.</p></div><div><b>Explore</b><button onClick={() => scrollTo('services')}>Services</button><button onClick={() => scrollTo('shop')}>Shop</button><button onClick={() => scrollTo('partners')}>Earn While You Learn</button></div><div><b>Account</b><button onClick={onLogin}>Sign in</button><button onClick={onLogin}>Become a partner</button></div></footer>
      <div className="store-bottom">© {new Date().getFullYear()} CampusVerse · Mabrig campus commerce network</div>
    </div>
  );
}
