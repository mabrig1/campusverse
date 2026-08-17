import { useMemo, useState } from 'react';

const services = [
  { icon: '📚', title: 'Assignment Support', price: '₦1,500', text: 'Research guidance, structure, referencing, editing and tutoring support.' },
  { icon: '📖', title: 'Book Review', price: '₦3,000', text: 'Critical reading, review structure, editing and academic presentation.' },
  { icon: '📝', title: 'Term Paper Support', price: '₦3,000', text: 'Research planning, citations, editing and presentation support.' },
  { icon: '🎓', title: 'Project Support', price: '₦50,000', text: 'Methodology, research design, data analysis, formatting and presentation support.' },
  { icon: '🖨️', title: 'B&W Printing', price: '₦30 / page', text: 'Affordable black-and-white campus printing for notes and documents.' },
  { icon: '🌈', title: 'Colour Printing', price: '₦100 / page', text: 'Sharp colour printing for presentations, forms and academic materials.' },
];

const products = [
  { icon: '📱', title: 'Campus Smartphones', price: 'From ₦85,000', tag: 'Gadgets' },
  { icon: '🔋', title: 'Power Banks', price: 'From ₦18,000', tag: 'Accessories' },
  { icon: '🔌', title: 'Fast Chargers', price: 'From ₦8,500', tag: 'Accessories' },
  { icon: '🎧', title: 'Wireless Earbuds', price: 'From ₦15,000', tag: 'Accessories' },
  { icon: '🔗', title: 'USB-C & Lightning Cables', price: 'From ₦4,500', tag: 'Accessories' },
  { icon: '🛡️', title: 'Screen Protectors', price: 'From ₦2,500', tag: 'Accessories' },
];

export default function CampusVerseStorefront({ onLogin }) {
  const [active, setActive] = useState('home');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  const filteredProducts = useMemo(() => products.filter(p => `${p.title} ${p.tag}`.toLowerCase().includes(query.toLowerCase())), [query]);

  const action = (text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 3000);
  };

  const scrollTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="storefront">
      {notice && <div className="store-toast">✓ {notice}</div>}
      <header className="store-nav">
        <button className="store-brand" onClick={() => scrollTo('home')}>
          <span className="store-logo">C</span>
          <span><b>CampusVerse</b><small>Campus commerce & services</small></span>
        </button>
        <nav>
          <button className={active === 'home' ? 'active' : ''} onClick={() => scrollTo('home')}>Home</button>
          <button onClick={() => scrollTo('services')}>Services</button>
          <button onClick={() => scrollTo('shop')}>Shop</button>
          <button onClick={() => scrollTo('partners')}>Earn While You Learn</button>
        </nav>
        <div className="store-nav-actions">
          <button className="store-login" onClick={onLogin}>Sign in</button>
          <button className="store-primary" onClick={() => action('Account creation opens after sign in.')}>Get Started</button>
        </div>
      </header>

      <main>
        <section id="home" className="store-hero">
          <div className="hero-copy">
            <span className="eyebrow">THE CAMPUS ECONOMY, IN ONE PLACE</span>
            <h1>Buy. Sell. <em>Learn.</em> Earn.</h1>
            <p>CampusVerse connects students with trusted campus services, gadgets, phone accessories and opportunities to earn through legitimate referrals.</p>
            <div className="hero-actions">
              <button className="store-primary large" onClick={() => scrollTo('shop')}>Shop campus essentials →</button>
              <button className="store-outline large" onClick={() => scrollTo('services')}>Explore services</button>
            </div>
            <div className="hero-proof"><span>✓ Student-focused</span><span>✓ Secure marketplace</span><span>✓ Campus delivery ready</span></div>
          </div>
          <div className="hero-card">
            <div className="hero-card-glow" />
            <span className="hero-mini">CAMPUSVERSE STORE</span>
            <h3>Everything students need.</h3>
            <div className="hero-stat"><b>6+</b><span>academic services</span></div>
            <div className="hero-stat"><b>24/7</b><span>online ordering</span></div>
            <div className="hero-stat"><b>20%</b><span>partner commission* </span></div>
            <small>*Qualifying referrals after official activation.</small>
          </div>
        </section>

        <section className="category-strip">
          <button onClick={() => scrollTo('services')}><span>🎓</span><b>Academic Services</b><small>Support & printing</small></button>
          <button onClick={() => scrollTo('shop')}><span>📱</span><b>Gadgets</b><small>Phones & electronics</small></button>
          <button onClick={() => scrollTo('shop')}><span>🔌</span><b>Accessories</b><small>Power, audio & cables</small></button>
          <button onClick={() => scrollTo('partners')}><span>🚀</span><b>Earn While You Learn</b><small>Become a partner</small></button>
        </section>

        <section id="services" className="store-section">
          <div className="section-heading"><div><span className="eyebrow">MABRIG ACADEMIC SERVICES</span><h2>Services built around campus life.</h2><p>Get legitimate academic support and professional document services without leaving campus.</p></div><button className="text-link" onClick={() => action('Service ordering will connect to the CampusVerse order flow.')}>How it works →</button></div>
          <div className="service-grid">{services.map(s => <article className="service-card" key={s.title}><span className="service-icon">{s.icon}</span><div><span className="service-label">CAMPUS SERVICE</span><h3>{s.title}</h3><p>{s.text}</p></div><footer><strong>{s.price}</strong><button onClick={() => action(`${s.title} selected. Sign in to continue.`)}>Request service</button></footer></article>)}</div>
        </section>

        <section id="shop" className="store-section shop-section">
          <div className="section-heading"><div><span className="eyebrow">CAMPUS SHOP</span><h2>Gadgets & phone accessories.</h2><p>Campus-ready essentials selected for students, with secure purchasing and pickup/delivery workflows.</p></div><div className="shop-search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search gadgets & accessories" /></div></div>
          <div className="product-grid">{filteredProducts.map(p => <article className="product-card" key={p.title}><div className="product-visual"><span>{p.icon}</span><i>Campus pick</i></div><div className="product-body"><small>{p.tag}</small><h3>{p.title}</h3><strong>{p.price}</strong><button onClick={() => action(`${p.title} added to your campus order.`)}>View product</button></div></article>)}</div>
        </section>

        <section id="partners" className="partner-banner">
          <div><span className="eyebrow">🚀 EARN WHILE YOU LEARN</span><h2>Turn your campus connections into income.</h2><p>Join the Mabrig Academic Partners Network. Refer students to legitimate services and campus products, grow your network and earn qualifying commissions when the programme is officially activated.</p><div className="partner-points"><span>✓ 20% qualifying referral commission</span><span>✓ Partner dashboard</span><span>✓ Referral tracking</span></div></div>
          <div className="partner-card"><span>Your potential</span><strong>20%</strong><small>commission on qualifying referred orders*</small><button className="store-primary" onClick={onLogin}>Become a partner →</button></div>
        </section>

        <section className="trust-section"><div><span className="eyebrow">CAMPUSVERSE PROMISE</span><h2>A better way to transact on campus.</h2></div><div className="trust-grid"><div><b>🔒 Secure</b><p>Built around safer transactions and protected marketplace workflows.</p></div><div><b>📍 Campus-first</b><p>Services, products and delivery designed for student hotspots.</p></div><div><b>🤝 Community</b><p>Students, vendors and service providers grow together.</p></div></div></section>
      </main>

      <footer className="store-footer"><div><b>CampusVerse</b><p>The digital campus marketplace for services, products and opportunities.</p></div><div><b>Explore</b><button onClick={() => scrollTo('services')}>Services</button><button onClick={() => scrollTo('shop')}>Shop</button><button onClick={() => scrollTo('partners')}>Partners</button></div><div><b>Account</b><button onClick={onLogin}>Sign in</button><button onClick={() => action('Partner onboarding is available after sign in.')}>Become a partner</button></div></footer>
      <div className="store-bottom">© {new Date().getFullYear()} CampusVerse · Mabrig campus commerce network</div>
    </div>
  );
}
