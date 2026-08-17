import { useMemo, useState } from 'react';

const SERVICES = [
  { id: 'assignment-support', icon: '📚', name: 'Assignment Support', price: 1500, description: 'Research guidance, formatting, references and tutoring support.' },
  { id: 'book-review', icon: '📖', name: 'Book Review', price: 3000, description: 'Structured book review guidance, editing and academic presentation.' },
  { id: 'term-paper', icon: '📝', name: 'Term Paper Support', price: 3000, description: 'Research planning, editing, citations and presentation support.' },
  { id: 'project-support', icon: '🎓', name: 'Project Support', price: 50000, description: 'Project research, methodology, analysis, formatting and presentation support.' },
  { id: 'bw-printing', icon: '🖨️', name: 'B&W Printing', price: 30, unit: '/ page', description: 'Fast black-and-white campus printing.' },
  { id: 'colour-printing', icon: '🌈', name: 'Colour Printing', price: 100, unit: '/ page', description: 'High-quality colour document printing.' },
];

const PRODUCTS = [
  { id: 'charger', icon: '🔌', name: 'Fast Chargers', price: 8500, category: 'Phone Accessories' },
  { id: 'powerbank', icon: '🔋', name: 'Power Banks', price: 18000, category: 'Phone Accessories' },
  { id: 'earbuds', icon: '🎧', name: 'Wireless Earbuds', price: 15000, category: 'Phone Accessories' },
  { id: 'cable', icon: '🔗', name: 'USB-C / Lightning Cables', price: 4500, category: 'Phone Accessories' },
  { id: 'screen', icon: '📱', name: 'Screen Protectors', price: 2500, category: 'Phone Accessories' },
  { id: 'phone', icon: '📲', name: 'Campus Smartphones', price: 85000, category: 'Gadgets' },
];

const money = (value) => `₦${Number(value).toLocaleString()}`;

export default function EarnWhileYouLearn({ user, showToast }) {
  const [view, setView] = useState('home');
  const [category, setCategory] = useState('all');
  const [phone, setPhone] = useState(user?.phone || '');
  const [joined, setJoined] = useState(() => localStorage.getItem('mabrig_partner_joined') === '1');
  const [refCode, setRefCode] = useState(() => localStorage.getItem('mabrig_partner_code') || '');
  const [copied, setCopied] = useState(false);

  const referralLink = useMemo(() => {
    if (!refCode) return '';
    return `${window.location.origin}/?partner=${encodeURIComponent(refCode)}`;
  }, [refCode]);

  const filteredProducts = category === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === category);

  const join = () => {
    if (!phone.trim()) {
      showToast?.('Enter your phone number to join the partner network.');
      return;
    }
    const code = `MK-${phone.replace(/\D/g, '').slice(-6) || Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    localStorage.setItem('mabrig_partner_joined', '1');
    localStorage.setItem('mabrig_partner_code', code);
    setRefCode(code);
    setJoined(true);
    showToast?.('Partner profile created. Referral tracking is ready for activation.');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      showToast?.('Copy the referral link from the field.');
    }
  };

  const share = async () => {
    const text = 'Join Mabrig Academic Partners and earn while you learn on campus.';
    if (navigator.share) {
      await navigator.share({ title: 'Mabrig Academic Partners', text, url: referralLink });
    } else {
      copyLink();
    }
  };

  return (
    <div className="ewyl-wrap">
      <section className="ewyl-hero glass-panel">
        <div>
          <span className="ewyl-kicker">🚀 EARN WHILE YOU LEARN</span>
          <h2>Mabrig Academic Partners</h2>
          <p>Turn your campus connections into income by connecting students with legitimate academic support, printing, gadgets and phone accessories.</p>
          <div className="ewyl-actions">
            <button className="btn btn-accent" onClick={() => setView('partner')}>{joined ? 'Open Partner Dashboard' : 'Become a Campus Partner'}</button>
            <button className="btn btn-secondary" onClick={() => setView('shop')}>Shop Gadgets & Accessories</button>
          </div>
        </div>
        <div className="ewyl-commission-card">
          <span>Partner Commission</span>
          <strong>20%</strong>
          <small>on qualifying referred orders after official activation</small>
        </div>
      </section>

      <div className="ewyl-stats">
        <div className="glass-panel"><strong>{money(1500)}</strong><span>Assignment Support</span></div>
        <div className="glass-panel"><strong>{money(3000)}</strong><span>Book Review</span></div>
        <div className="glass-panel"><strong>{money(50000)}</strong><span>Project Support</span></div>
        <div className="glass-panel"><strong>{money(30)}</strong><span>B&W / page</span></div>
      </div>

      {view === 'home' && (
        <>
          <section className="ewyl-section">
            <div className="ewyl-section-head"><div><span className="ewyl-kicker">CAMPUS SERVICES</span><h3>Services students already need</h3></div><button className="action-btn" onClick={() => setView('services')}>View all →</button></div>
            <div className="ewyl-grid">
              {SERVICES.map(s => <article className="glass-panel ewy-card" key={s.id}><span className="ewy-icon">{s.icon}</span><h4>{s.name}</h4><p>{s.description}</p><strong>{money(s.price)}{s.unit || ''}</strong><button className="btn" onClick={() => showToast?.(`${s.name} order flow can be connected to Mabrig Academic Services.`)}>Request Service</button></article>)}
            </div>
          </section>

          <section className="ewyl-section">
            <div className="ewyl-section-head"><div><span className="ewyl-kicker">CAMPUS COMMERCE</span><h3>Gadgets & phone accessories</h3></div><button className="action-btn" onClick={() => setView('shop')}>Open shop →</button></div>
            <div className="ewyl-product-grid">{PRODUCTS.slice(0, 4).map(p => <Product key={p.id} product={p} onBuy={() => showToast?.(`${p.name} added to campus order.`)} />)}</div>
          </section>
        </>
      )}

      {view === 'services' && <section className="ewyl-section"><div className="ewyl-section-head"><div><span className="ewyl-kicker">MABRIG ACADEMIC SERVICES</span><h3>Choose a service</h3></div><button className="action-btn" onClick={() => setView('home')}>← Back</button></div><div className="ewyl-grid">{SERVICES.map(s => <article className="glass-panel ewy-card" key={s.id}><span className="ewy-icon">{s.icon}</span><h4>{s.name}</h4><p>{s.description}</p><strong>{money(s.price)}{s.unit || ''}</strong><button className="btn btn-accent" onClick={() => showToast?.(`Start ${s.name} request.`)}>Request Service</button></article>)}</div></section>}

      {view === 'shop' && <section className="ewyl-section"><div className="ewyl-section-head"><div><span className="ewyl-kicker">CAMPUS SHOP</span><h3>Gadgets & phone accessories</h3></div><button className="action-btn" onClick={() => setView('home')}>← Back</button></div><div className="ewyl-filter"><button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>All</button><button className={category === 'Gadgets' ? 'active' : ''} onClick={() => setCategory('Gadgets')}>Gadgets</button><button className={category === 'Phone Accessories' ? 'active' : ''} onClick={() => setCategory('Phone Accessories')}>Phone Accessories</button></div><div className="ewyl-product-grid">{filteredProducts.map(p => <Product key={p.id} product={p} onBuy={() => showToast?.(`${p.name} added to campus order.`)} />)}</div></section>}

      {view === 'partner' && <section className="ewyl-section"><div className="ewyl-section-head"><div><span className="ewyl-kicker">PARTNER NETWORK</span><h3>Your earning dashboard</h3></div><button className="action-btn" onClick={() => setView('home')}>← Back</button></div>
        {!joined ? <div className="glass-panel ewy-onboard"><h3>Join the Mabrig Academic Partners Network</h3><p>Refer students to qualifying services and campus products. The standard partner commission is 20% once the official tracking and commission system is activated.</p><div className="ewyl-form"><input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" /><button className="btn btn-accent" onClick={join}>Create Partner Profile</button></div></div> : <div className="ewy-dashboard"><div className="glass-panel ewy-balance"><span>Potential Commission</span><strong>{money(0)}</strong><small>Referral payouts appear here after qualifying orders are verified.</small></div><div className="glass-panel ewy-ref"><span>Your Partner Code</span><strong>{refCode}</strong><input className="form-input" readOnly value={referralLink} /><div className="ewyl-actions"><button className="btn" onClick={copyLink}>{copied ? 'Copied ✓' : 'Copy Link'}</button><button className="btn btn-accent" onClick={share}>Share</button></div></div><div className="glass-panel ewy-mission"><h3>🎯 Your First Mission</h3><ul><li>Identify course mates and class groups who need legitimate support.</li><li>Reach hostel contacts and WhatsApp communities.</li><li>Share campus gadgets and accessories with students who need them.</li><li>Do not collect commissions independently; official tracking will determine qualifying referrals.</li></ul></div></div>}
      </section>}
    </div>
  );
}

function Product({ product, onBuy }) {
  return <article className="glass-panel ewy-product"><div className="ewy-product-icon">{product.icon}</div><span>{product.category}</span><h4>{product.name}</h4><strong>{money(product.price)}</strong><button className="btn btn-accent" onClick={onBuy}>Order on Campus</button></article>;
}
