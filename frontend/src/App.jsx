import { useState, useEffect } from 'react';
import { api, setAuthToken } from './api';
import AuthScreen from './AuthScreen';
import WalletTab from './WalletTab';
import MarketplaceBrowse from './marketplace/MarketplaceBrowse';

// SVG Icons
const Icons = {
  Home: () => (
    <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Marketplace: () => (
    <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Services: () => (
    <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  Directory: () => (
    <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/>
    </svg>
  ),
  Trust: () => (
    <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Escrow: () => (
    <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Wallet: () => (
    <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-emerald)' }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
};

export default function App() {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('cv_token');
    if (stored) setAuthToken(stored);
    return stored;
  });
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // DB States
  const [services, setServices] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [activeEscrow, setActiveEscrow] = useState(null);

  // Custom interactive variables
  const [searchQuery, setSearchQuery] = useState('');
  const [bvnInput, setBvnInput] = useState('');
  const [ninInput, setNinInput] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');

  // New Feed Post form (local-only social feed — not backed by the API yet)
  const [feedPosts, setFeedPosts] = useState([
    {
      id: 1,
      author: 'Chidi Amadi',
      details: 'UNN Faculty of Engineering • 2 hours ago',
      tag: 'Hostel Hub (Franco)',
      content: 'Who has a spare mattress they can sell or rent out? Franco hostel blocks are freezing cold at night.',
      likes: 12,
      liked: false
    },
    {
      id: 2,
      author: 'Aisha Yusuf',
      details: 'UNN Medical Sciences • 5 hours ago',
      tag: 'Department Forums',
      content: 'CampusVerse Escrow saved my money today at Odim Gate. The seller tried to hand me a locked phone, but because my funds were in escrow, I disputed it easily and got refunded. Recommended!',
      likes: 44,
      liked: false
    },
    {
      id: 3,
      author: 'CampusVerse Security Team',
      details: 'System Notification • Yesterday',
      tag: 'Security Alert',
      content: 'Advanced NIN & BVN verification is now active. Complete your verification to earn the "Trusted Trader" badge and increase your daily transaction limits up to 1,000,000 NGN.',
      likes: 108,
      liked: true
    }
  ]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTag, setNewPostTag] = useState('General Discussion');

  // Simulated Device Fingerprint (anti-fraud telemetry demo, unrelated to real user identity)
  const [deviceFingerprint] = useState({
    fingerprint: 'CV-F3B900D8A201',
    ip: '102.89.44.11',
    browser: 'Mozilla/Chrome Windows NT 10.0',
    riskScore: 12,
    riskLevel: 'Low (Safe)'
  });

  const showToast = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchBackendData = async () => {
    setLoading(true);
    try {
      const [srvRes, dirRes] = await Promise.all([api.getServices(), api.getDirectory()]);
      setServices(srvRes);
      setDirectory(dirRes);
    } catch (err) {
      showToast(`Couldn't reach the CampusVerse backend: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticated = (newToken, newUser) => {
    localStorage.setItem('cv_token', newToken);
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('cv_token');
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setCurrentTab('dashboard');
  };

  // Load backend content once authenticated
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setUser(await api.me());
      } catch {
        handleLogout();
        return;
      }
      fetchBackendData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token || !user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  // Student ID Verify
  const verifyStudentID = async () => {
    if (!studentIdInput.trim()) {
      showToast('Please enter your UNN Registration Number');
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyStudentId(studentIdInput);
      setUser(res.user);
      showToast(res.message);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Selfie Biometric Match
  const verifySelfieBiometrics = async () => {
    setLoading(true);
    try {
      const res = await api.verifySelfie();
      setUser(res.user);
      showToast(`Selfie verification: ${res.message} (${res.matchConfidence}% Match)`);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  // NIN Sim
  const verifyNIN = async () => {
    if (ninInput.length !== 11) {
      showToast('NIN must be exactly 11 digits');
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyNin(ninInput);
      setUser(res.user);
      showToast(`NIN matching successful: ${res.data.fullName}`);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  // BVN Sim
  const verifyBVN = async () => {
    if (bvnInput.length !== 11) {
      showToast('BVN must be exactly 11 digits');
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyBvn(bvnInput);
      setUser(res.user);
      showToast(`BVN matching successful: Verified with ${res.data.bankVerified}`);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Escrow (locks real wallet funds server-side)
  const startEscrowBuy = async (product) => {
    setLoading(true);
    try {
      const tx = await api.startEscrow(product.id);
      setActiveEscrow(tx);
      setCurrentTab('escrow');
      showToast(`Escrow transaction created! Funds locked: ₦${product.price.toLocaleString()}`);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Perform Escrow Actions
  const runEscrowAction = async (action) => {
    if (!activeEscrow) return;
    setLoading(true);
    try {
      const tx = await api.escrowAction(activeEscrow.id, action);
      setActiveEscrow(tx);
      if (action === 'inspect') showToast('Hub Inspection Complete: Verified Passed!');
      if (action === 'approve') showToast('Funds released to the seller successfully!');
      if (action === 'dispute') showToast('Dispute opened. A CampusVerse support officer is assigned.');
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Feed Likes
  const handleLike = (id) => {
    setFeedPosts(posts => posts.map(p => {
      if (p.id === id) {
        return { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked };
      }
      return p;
    }));
  };

  // Submit Feed Post
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    const newPost = {
      id: feedPosts.length + 1,
      author: user.name,
      details: `${user.regNo || 'CampusVerse'} • Just now`,
      tag: newPostTag,
      content: newPostContent,
      likes: 0,
      liked: false
    };
    setFeedPosts([newPost, ...feedPosts]);
    setNewPostContent('');
    showToast('Post shared to campus news feed!');
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--accent-purple)',
          color: 'var(--text-primary)',
          padding: '16px 24px',
          borderRadius: 'var(--border-radius-md)',
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }}></div>
          <span>{message}</span>
        </div>
      )}

      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="brand-container">
          <div className="brand-logo">C</div>
          <div>
            <div className="brand-name">CampusVerse</div>
            <div className="brand-tagline">UNN SECURE HUB</div>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#" className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentTab('dashboard')}>
            <Icons.Home /> <span>News Feed</span>
          </a>
          <a href="#" className={`nav-item ${currentTab === 'marketplace' ? 'active' : ''}`} onClick={() => setCurrentTab('marketplace')}>
            <Icons.Marketplace /> <span>Marketplace</span>
          </a>
          <a href="#" className={`nav-item ${currentTab === 'services' ? 'active' : ''}`} onClick={() => setCurrentTab('services')}>
            <Icons.Services /> <span>Services & Jobs</span>
          </a>
          <a href="#" className={`nav-item ${currentTab === 'directory' ? 'active' : ''}`} onClick={() => setCurrentTab('directory')}>
            <Icons.Directory /> <span>Local Directory</span>
          </a>
          <a href="#" className={`nav-item ${currentTab === 'wallet' ? 'active' : ''}`} onClick={() => setCurrentTab('wallet')}>
            <Icons.Wallet /> <span>Wallet</span>
          </a>
          <a href="#" className={`nav-item ${currentTab === 'trust' ? 'active' : ''}`} onClick={() => setCurrentTab('trust')}>
            <Icons.Trust /> <span>Trust & KYC</span>
          </a>
          <a href="#" className={`nav-item ${currentTab === 'escrow' ? 'active' : ''}`} onClick={() => setCurrentTab('escrow')}>
            <Icons.Escrow /> <span>Escrow Engine</span>
          </a>
        </nav>

        <div className="sidebar-user">
          <img className="user-avatar" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" alt="User avatar" />
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-trust-badge">🛡️ {user.trustScore}% Trust Score</span>
          </div>
          <button
            className="action-btn"
            style={{ marginLeft: 'auto', fontSize: '11px' }}
            onClick={handleLogout}
            title="Log out"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <main className="main-content">
        <header className="top-bar">
          <div className="page-title-container">
            <h1 className="page-title">
              {currentTab === 'dashboard' && 'UNN Campus Hub'}
              {currentTab === 'marketplace' && 'UNN Student Marketplace'}
              {currentTab === 'services' && 'Student Service Economy'}
              {currentTab === 'directory' && 'Nsukka Business Directory'}
              {currentTab === 'wallet' && 'CampusVerse Wallet'}
              {currentTab === 'trust' && 'Campus Biometric & Identity Trust'}
              {currentTab === 'escrow' && 'Escrow Payment Terminal'}
            </h1>
            <span className="page-subtitle">
              {currentTab === 'dashboard' && 'Social forums, news, and student interactions'}
              {currentTab === 'marketplace' && 'Secure buying and selling within Nsukka'}
              {currentTab === 'services' && 'Hire student talent or view professional portfolios'}
              {currentTab === 'directory' && 'Find verified restaurants, printing hubs, and shuttles'}
              {currentTab === 'wallet' && 'Top up, send money, and track every transaction'}
              {currentTab === 'trust' && 'Dynamic safety score calculation and fraud telemetry'}
              {currentTab === 'escrow' && 'Milestone escrow contract protection'}
            </span>
          </div>

          <div className="search-container">
            <Icons.Search />
            <input
              type="text"
              className="search-input"
              placeholder="Search products, services, hostels, forums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
            <div className="trust-score-circle" style={{ animation: 'spin 1.5s linear infinite', width: '50px', height: '50px', borderSize: '3px' }}></div>
          </div>
        )}

        {/* Tab contents */}

        {/* News Feed Tab */}
        {currentTab === 'dashboard' && (
          <div className="dashboard-grid">
            <div className="feed-container">
              {/* Write Post Box */}
              <form onSubmit={handleCreatePost} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600' }}>Post to Student Forum</h3>
                <textarea
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Share what is happening on campus or look for items..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  maxLength={300}
                ></textarea>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    value={newPostTag}
                    onChange={(e) => setNewPostTag(e.target.value)}
                  >
                    <option value="General Discussion">General Discussion</option>
                    <option value="Hostel Hub (Franco)">Hostel Hub (Franco)</option>
                    <option value="Hostel Hub (Bello)">Hostel Hub (Bello)</option>
                    <option value="Department Forums">Department Forums</option>
                    <option value="Academics & Exams">Academics & Exams</option>
                  </select>
                  <button className="btn" type="submit">
                    <Icons.Plus /> Post
                  </button>
                </div>
              </form>

              {/* Feed posts list */}
              {feedPosts.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()) || p.tag.toLowerCase().includes(searchQuery.toLowerCase())).map(post => (
                <article key={post.id} className="glass-panel post-card">
                  <div className="post-header">
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {post.author[0]}
                    </div>
                    <div className="post-meta">
                      <span className="post-author">{post.author}</span>
                      <span className="post-details">{post.details}</span>
                    </div>
                    <span className="post-tag" style={{ marginLeft: 'auto' }}>{post.tag}</span>
                  </div>
                  <p className="post-content">{post.content}</p>
                  <div className="post-actions">
                    <button className="action-btn" onClick={() => handleLike(post.id)} style={{ color: post.liked ? 'var(--accent-purple)' : '' }}>
                      ❤️ {post.likes} Likes
                    </button>
                    <button className="action-btn">💬 Comment</button>
                    <button className="action-btn">📤 Share</button>
                  </div>
                </article>
              ))}
            </div>

            {/* Sidebar Widgets */}
            <div className="widgets-container">
              {/* User Trust Telemetry Panel */}
              <div className="glass-panel widget">
                <div className="widget-title">
                  <span>Your Trust Profile</span>
                  <Icons.ShieldCheck />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div className="trust-score-circle" style={{ width: '70px', height: '70px', fontSize: '18px', '--score-percent': `${user.trustScore}%` }}>
                    {user.trustScore}%
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600' }}>{user.trustLevel}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status: Active Account</span>
                  </div>
                </div>
                <button className="btn btn-secondary" style={{ width: '100%', fontSize: '13px' }} onClick={() => setCurrentTab('trust')}>
                  Verify Identity To Level Up
                </button>
              </div>

              {/* Campus Events widget */}
              <div className="glass-panel widget">
                <div className="widget-title">
                  <span>UNN Campus Trends</span>
                </div>
                <div className="widget-list">
                  <div className="widget-item">
                    <div style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--accent-blue)', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>
                      04
                    </div>
                    <div className="widget-item-info">
                      <span className="widget-item-title">Engineering Week Exhibition</span>
                      <span className="widget-item-desc">FRC Parking Lot • June 4, 10 AM</span>
                    </div>
                  </div>
                  <div className="widget-item">
                    <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>
                      07
                    </div>
                    <div className="widget-item-info">
                      <span className="widget-item-title">Nsukka Coding BootCamp v2</span>
                      <span className="widget-item-desc">ICT Access Center • June 7, 2 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Marketplace Tab */}
        {currentTab === 'marketplace' && (
          <MarketplaceBrowse user={user} showToast={showToast} onBuyEscrow={startEscrowBuy} />
        )}

        {/* Services & Professional Network Tab */}
        {currentTab === 'services' && (
          <div>
            <div className="items-grid">
              {services.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.provider.name.toLowerCase().includes(searchQuery.toLowerCase())).map(srv => (
                <div key={srv.id} className="glass-panel item-card">
                  <div className="item-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className="item-category">STUDENT SKILLS</span>
                      <span style={{ fontSize: '13px', color: 'var(--accent-amber)' }}>★ {srv.rating}</span>
                    </div>

                    <h3 className="item-title" style={{ height: 'auto', marginBottom: '8px' }}>{srv.title}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                      {srv.description}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                      {srv.provider.skills.map((sk, index) => (
                        <span key={index} className="post-tag" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)', fontSize: '10px' }}>
                          {sk}
                        </span>
                      ))}
                    </div>

                    <div className="item-footer" style={{ marginTop: 'auto', paddingTop: '12px' }}>
                      <div className="seller-brief">
                        <img className="seller-avatar" src={srv.provider.avatarUrl} alt="avatar" />
                        <div>
                          <div>{srv.provider.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{srv.provider.department}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From</div>
                        <div style={{ fontWeight: '700', fontSize: '16px' }}>₦{srv.price.toLocaleString()}</div>
                      </div>
                    </div>

                    <button className="btn btn-accent" style={{ marginTop: '16px', width: '100%' }} onClick={() => showToast(`Opening chat with freelancer: ${srv.provider.name}`)}>
                      Hire Student Freelancer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Professional Student Network Showcase */}
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '40px 0 20px 0' }}>🎓 UNN Student Portfolios & Startup Directory</h2>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  🚀
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Student Founders & Builders Network</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Find co-founders, team members, or pitch your startup idea directly on the CampusVerse student exchange network.</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600' }}>Chidi Okafor (UNN Computer Science, Yr 3)</h4>
                    <span className="post-tag">Tech Lead</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Building "NsuShare" - a peer-to-peer textbook and lecture materials rental system. Looking for a marketing and finance co-founder in UNN.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '11px', color: 'var(--accent-blue)' }}>
                    <span>💻 React & Python</span>
                    <span>⭐ 98% Trust Score</span>
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600' }}>Amara Nwosu (UNN Business Admin, Yr 4)</h4>
                    <span className="post-tag">Strategist</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Running "Nsukka Eats" - local food logistics and meal delivery. Managing 12 campus riders. Open to partner with developers.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '11px', color: 'var(--accent-blue)' }}>
                    <span>📈 Operations & Finance</span>
                    <span>⭐ 92% Trust Score</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nsukka Local Business Directory Tab */}
        {currentTab === 'directory' && (
          <div className="dashboard-grid">
            <div className="feed-container">
              {directory.map(biz => (
                <div key={biz.id} className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <img src={biz.logoUrl} alt={biz.name} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border-glass)' }} />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="item-category" style={{ fontSize: '10px' }}>{biz.category}</span>
                      <span style={{ fontSize: '12px', color: 'var(--accent-amber)' }}>★ {biz.rating} ({biz.reviewsCount} reviews)</span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '4px 0' }}>{biz.name}</h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>📍 {biz.location}</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{biz.description}</p>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => showToast(`Directions to: ${biz.name}`)}>
                        Get Directions
                      </button>
                      <button className="btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => showToast(`Initiating ordering/booking flow`)}>
                        Contact Business
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="widgets-container">
              <div className="glass-panel widget">
                <div className="widget-title">
                  <span>Interactive Map (Mock)</span>
                </div>
                <div style={{
                  height: '240px',
                  borderRadius: '12px',
                  background: 'radial-gradient(circle, var(--bg-secondary) 30%, var(--bg-primary) 100%)',
                  border: '1px solid var(--border-glass)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Visual simulated nodes */}
                  <div style={{ position: 'absolute', top: '40px', left: '80px', color: 'var(--accent-purple)' }}>
                    <Icons.MapPin />
                    <span style={{ fontSize: '9px', background: '#000', padding: '2px 4px', borderRadius: '4px', display: 'block' }}>Odim Gate</span>
                  </div>
                  <div style={{ position: 'absolute', top: '150px', left: '160px', color: 'var(--accent-blue)' }}>
                    <Icons.MapPin />
                    <span style={{ fontSize: '9px', background: '#000', padding: '2px 4px', borderRadius: '4px', display: 'block' }}>Franco Hostel</span>
                  </div>
                  <div style={{ position: 'absolute', top: '90px', left: '200px', color: 'var(--accent-emerald)' }}>
                    <Icons.MapPin />
                    <span style={{ fontSize: '9px', background: '#000', padding: '2px 4px', borderRadius: '4px', display: 'block' }}>Sub Dome</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Interactive Nsukka Map Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {currentTab === 'wallet' && <WalletTab showToast={showToast} />}

        {/* Identity & Trust Portal */}
        {currentTab === 'trust' && (
          <div>
            <div className="glass-panel trust-score-header-card">
              <div className="trust-circle-container">
                <div className="trust-score-circle" style={{ '--score-percent': `${user.trustScore}%` }}>
                  {user.trustScore}%
                </div>
                <span className="user-trust-badge">🛡️ {user.trustLevel}</span>
              </div>
              <div className="trust-score-details">
                <h3 className="trust-tier">Safety Verification Telemetry</h3>
                <p className="trust-desc">
                  CampusVerse utilizes advanced identity resolution, device behavior heuristics, and biometric matching to compute a live trust vector for students. Higher score guarantees access to zero escrow transaction fees and high-volume limits.
                </p>
                <div className="telemetry-row">
                  <div className="glass-panel telemetry-card">
                    <span className="telemetry-value">{user.disputeCount}</span>
                    <span className="telemetry-label">Disputes Raised</span>
                  </div>
                  <div className="glass-panel telemetry-card">
                    <span className="telemetry-value">{user.tradesCount}</span>
                    <span className="telemetry-label">Completed Trades</span>
                  </div>
                  <div className="glass-panel telemetry-card">
                    <span className="telemetry-value">{deviceFingerprint.riskLevel}</span>
                    <span className="telemetry-label">Device Risk</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="kyc-verification-grid">
              {/* Mandatory Checklist */}
              <div className="glass-panel kyc-card">
                <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Mandatory Verification</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                  <div className="kyc-status-row">
                    <div>
                      <strong>Phone Verification</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.phone || 'No phone on file'}</div>
                    </div>
                    <span className={`status-badge ${user.phoneVerified ? 'verified' : ''}`}>{user.phoneVerified ? 'Verified' : 'Unverified'}</span>
                  </div>

                  <div className="kyc-status-row">
                    <div>
                      <strong>Email Verification</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                    <span className={`status-badge ${user.emailVerified ? 'verified' : ''}`}>{user.emailVerified ? 'Verified' : 'Unverified'}</span>
                  </div>

                  <div className="kyc-status-row">
                    <div>
                      <strong>Student Records (UNN Portal)</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>UNN Registrar validation database query</div>
                    </div>
                    {user.studentIdVerified ? (
                      <span className="status-badge verified">Verified</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 2023/149819"
                          style={{ padding: '6px', fontSize: '12px', width: '120px' }}
                          value={studentIdInput}
                          onChange={(e) => setStudentIdInput(e.target.value)}
                        />
                        <button className="btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={verifyStudentID}>Link</button>
                      </div>
                    )}
                  </div>

                  <div className="kyc-status-row">
                    <div>
                      <strong>Selfie Biometric Matching</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Upload live photo to match student records</div>
                    </div>
                    {user.selfieVerified ? (
                      <span className="status-badge verified">Verified</span>
                    ) : (
                      <button className="btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={verifySelfieBiometrics}>
                        Verify Selfie
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced Nigerian Identity */}
              <div className="glass-panel kyc-card">
                <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Advanced KYC (Nigeria Specific)</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                  <div className="kyc-status-row">
                    <div>
                      <strong>NIN Verification (NIMC Lookup)</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>National Identification Number profile match</div>
                    </div>
                    {user.ninVerified ? (
                      <span className="status-badge verified">Verified</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="11-digit NIN"
                          style={{ padding: '6px', fontSize: '12px', width: '120px' }}
                          value={ninInput}
                          onChange={(e) => setNinInput(e.target.value)}
                        />
                        <button className="btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={verifyNIN}>Submit</button>
                      </div>
                    )}
                  </div>

                  <div className="kyc-status-row">
                    <div>
                      <strong>BVN Matching (Bank Record)</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bank Verification Number registry alignment</div>
                    </div>
                    {user.bvnVerified ? (
                      <span className="status-badge verified">Verified</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="11-digit BVN"
                          style={{ padding: '6px', fontSize: '12px', width: '120px' }}
                          value={bvnInput}
                          onChange={(e) => setBvnInput(e.target.value)}
                        />
                        <button className="btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={verifyBVN}>Submit</button>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    💡 <strong>Device Telemetry:</strong> CampusVerse reads hardware parameters (Fingerprint: <code>{deviceFingerprint.fingerprint}</code>) to automatically block multiple fake student profiles and device farming schemes.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Escrow Simulator Tab */}
        {currentTab === 'escrow' && (
          <div>
            {!activeEscrow ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>No Active Escrow Transaction</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '20px' }}>
                  To inspect and run the escrow lifecycle, purchase any high-value device from the Marketplace tab.
                </p>
                <button className="btn" onClick={() => setCurrentTab('marketplace')}>Go to Marketplace</button>
              </div>
            ) : (
              <div>
                {/* Stepper display */}
                <div className="glass-panel" style={{ padding: '24px 20px', marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Contract State: {activeEscrow.id} ({activeEscrow.productName})</h3>

                  <div className="escrow-stepper">
                    <div className={`escrow-step ${activeEscrow.status === 'funds_locked' || activeEscrow.status === 'inspected' || activeEscrow.status === 'funds_released' ? 'active' : ''} ${activeEscrow.status === 'inspected' || activeEscrow.status === 'funds_released' ? 'completed' : ''}`}>
                      1
                      <span className="step-label">Funds Locked</span>
                    </div>
                    <div className={`escrow-step ${activeEscrow.status === 'inspected' || activeEscrow.status === 'funds_released' ? 'active' : ''} ${activeEscrow.status === 'funds_released' ? 'completed' : ''}`}>
                      2
                      <span className="step-label">Hub Inspection</span>
                    </div>
                    <div className={`escrow-step ${activeEscrow.status === 'funds_released' ? 'completed' : ''}`}>
                      3
                      <span className="step-label">Buyer Released</span>
                    </div>
                  </div>
                </div>

                {/* Details layout */}
                <div className="escrow-details-grid">
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Campus Escrow Details</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', fontSize: '14px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>BUYER</span>
                        <div style={{ fontWeight: '600', marginTop: '4px' }}>{activeEscrow.buyerName}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>SELLER</span>
                        <div style={{ fontWeight: '600', marginTop: '4px' }}>{activeEscrow.sellerName}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>ESCROW DEPOSIT</span>
                        <div style={{ fontWeight: '700', fontSize: '18px', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                          ₦{activeEscrow.price.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>CONTRACT STATUS</span>
                        <div style={{ fontWeight: '600', marginTop: '4px', textTransform: 'uppercase', color: 'var(--accent-purple)', fontSize: '12px' }}>
                          {activeEscrow.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Escrow Workflow</h4>

                      {activeEscrow.status === 'funds_locked' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Funds have been securely locked in the CampusVerse wallet ledger. The seller has been notified to deliver the device to the **CampusVerse Inspection Hub (Sub-Dome Center)**.
                          </p>
                          <button className="btn btn-accent" onClick={() => runEscrowAction('inspect')}>
                            Run Hub Inspection Report & Score
                          </button>
                        </div>
                      )}

                      {activeEscrow.status === 'inspected' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            The device passed the diagnostic test with a score of **{activeEscrow.inspectionScore}/100**. The buyer should test the item now and approve it.
                          </p>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn" style={{ flexGrow: 2 }} onClick={() => runEscrowAction('approve')}>
                              Accept & Release Funds to Seller
                            </button>
                            <button className="btn btn-secondary" style={{ color: 'red', borderColor: 'rgba(255,0,0,0.2)' }} onClick={() => runEscrowAction('dispute')}>
                              Raise Dispute
                            </button>
                          </div>
                        </div>
                      )}

                      {activeEscrow.status === 'funds_released' && (
                        <div>
                          <p style={{ fontSize: '13px', color: 'var(--accent-emerald)', fontWeight: '500' }}>
                            ✓ Funds successfully disbursed to the seller's wallet. This contract is closed.
                          </p>
                          <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => setActiveEscrow(null)}>
                            Clear
                          </button>
                        </div>
                      )}

                      {activeEscrow.status === 'disputed' && (
                        <div>
                          <p style={{ fontSize: '13px', color: 'var(--accent-amber)', fontWeight: '500' }}>
                            ⚠ Transaction is in Dispute status. Support is reviewing logs & serial history.
                          </p>
                          <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => setActiveEscrow(null)}>
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Anti-Fraud telemetry details */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Anti-Fraud Telemetry Shield</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Device Signature:</span>
                        <code>{deviceFingerprint.fingerprint}</code>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>User Location:</span>
                        <span>Nsukka Campus (Enugu State)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Transfer Verification:</span>
                        <span style={{ color: 'var(--accent-emerald)' }}>Safe IP Check (102.89)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Identity Mismatch Flag:</span>
                        <span style={{ color: 'var(--accent-emerald)' }}>0% (No Mismatch)</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '12px' }}>
                        Our active fraud module performs behavioral analytics on browser session state, avoiding fake bank transfers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
