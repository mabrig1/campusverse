import React, { useState, useEffect } from 'react';
import PrivacyPolicy, { hasAcceptedPolicy } from './PrivacyPolicy.jsx';

// API Configuration
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  Lock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  User: () => (
    <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
};

export default function App() {
  const [policyAccepted, setPolicyAccepted] = useState(hasAcceptedPolicy);

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // User States & Biometrics
  const [userProfile, setUserProfile] = useState({
    name: 'Obinna Eze',
    regNo: '2023/149819',
    hostel: 'Franco Hostel, UNN',
    phoneVerified: true,
    emailVerified: true,
    studentIdVerified: false,
    selfieVerified: false,
    ninVerified: false,
    bvnVerified: false,
    tradesCount: 3,
    disputeCount: 0,
    trustScore: 45,
    trustLevel: 'Verified Student',
    // Profile description fields
    bio: 'Computer Science student at UNN. Building tech solutions for campus life. I buy and sell gadgets, offer web development services, and connect students with opportunities.',
    department: 'Faculty of Physical Sciences – Computer Science',
    level: '300 Level',
    email: 'o.eze@unn.edu.ng',
    skills: ['React.js', 'Node.js', 'Python', 'UI Design'],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    twitter: '',
    linkedin: '',
    github: '',
    joinedDate: 'January 2024',
    totalReviews: 5,
    rating: 4.8
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState(null);

  // DB States
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [escrowList, setEscrowList] = useState([]);
  const [activeEscrow, setActiveEscrow] = useState(null);
  
  // Custom interactive variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [imeiInput, setImeiInput] = useState('');
  const [imeiReport, setImeiReport] = useState(null);
  const [bvnInput, setBvnInput] = useState('');
  const [ninInput, setNinInput] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [selfieMock, setSelfieMock] = useState(false);
  
  // New Feed Post form
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

  // Simulated Device Fingerprint
  const [deviceFingerprint, setDeviceFingerprint] = useState({
    fingerprint: 'CV-F3B900D8A201',
    ip: '102.89.44.11',
    browser: 'Mozilla/Chrome Windows NT 10.0',
    riskScore: 12,
    riskLevel: 'Low (Safe)'
  });

  // Load backend content
  useEffect(() => {
    fetchBackendData();
    calculateTrustScore(userProfile);
  }, []);

  const fetchBackendData = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch(`${API_BASE}/products`).then(r => r.json());
      setProducts(prodRes);
      const srvRes = await fetch(`${API_BASE}/services`).then(r => r.json());
      setServices(srvRes);
      const dirRes = await fetch(`${API_BASE}/directory`).then(r => r.json());
      setDirectory(dirRes);
    } catch (err) {
      console.warn("Backend not active, using local mock fallbacks");
      // Fallback mocks
      setProducts([
        {
          id: 'prod-001',
          title: 'iPhone 12 Pro Max (128GB)',
          description: 'Clean UK-used. Battery health 88%. True Tone active, Face ID functional. Selling because I need to buy textbooks and pay hostel fees.',
          price: 380000,
          category: 'Electronics',
          condition: 'Used (Excellent)',
          location: 'Franco Hostel, UNN',
          seller: { name: 'Chinedu Okafor', verified: true, trustScore: 89, avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
          images: ['https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&q=80&w=600'],
          inspectionRequired: true,
          inspectionReport: { imei: '357289110482937', serialNumber: 'G0NFC17BN7FD', batteryHealth: '88%', screenCondition: 'Original - No scratches', repairsDetected: 'None', authenticity: 'Verified Original Apple', inspectionScore: 94, inspectedBy: 'CampusVerse Hub (Franco, UNN)' }
        },
        {
          id: 'prod-002',
          title: 'Modern Study Desk & Ergonomic Chair',
          description: 'Very sturdy wooden desk with a metal frame. Comes with a comfortable mesh office chair. Perfect for studying at night.',
          price: 65000,
          category: 'Hostel Furniture',
          condition: 'Used (Like New)',
          location: 'Odim Gate area, Nsukka',
          seller: { name: 'Amara Nwosu', verified: true, trustScore: 92, avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200' },
          images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600'],
          inspectionRequired: false
        },
        {
          id: 'prod-003',
          title: 'Dell Latitude 7490 Core i7',
          description: '16GB RAM, 512GB SSD. Perfect for programming, graphic design, and assignments. Battery lasts 4 hours on heavy use.',
          price: 245000,
          category: 'Electronics',
          condition: 'Used (Good)',
          location: 'Alvan Hostel, UNN',
          seller: { name: 'Emeka Eze', verified: false, trustScore: 45, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
          images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=600'],
          inspectionRequired: true,
          inspectionReport: { imei: '98274092749028', serialNumber: '9J8XW42', batteryHealth: '82%', screenCondition: 'Minor bezel scratch, panel original', repairsDetected: 'SSD Upgraded', authenticity: 'Verified Dell OEM', inspectionScore: 88, inspectedBy: 'CampusVerse Hub (Sub-Dome, UNN)' }
        }
      ]);
      setServices([
        {
          id: 'srv-001',
          title: 'Professional CV & LinkedIn Profile Writing',
          description: 'Tailored specifically for Nigerian students applying for internships, remote tech jobs, or scholarships.',
          price: 5000,
          rating: 4.9,
          reviewsCount: 32,
          provider: { name: 'Tobi Daniels', department: 'UNN Faculty of Law', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', skills: ['CV Optimization', 'LinkedIn Branding'], trustScore: 96 }
        },
        {
          id: 'srv-002',
          title: 'React & Node.js Website Development',
          description: 'Building custom websites, portfolios, and startup landing pages. High performance and mobile responsive guaranteed.',
          price: 45000,
          rating: 5.0,
          reviewsCount: 14,
          provider: { name: 'Ibrahim Bello', department: 'UNN Electronic Engineering', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200', skills: ['React.js', 'Node.js', 'PostgreSQL'], trustScore: 98 }
        }
      ]);
      setDirectory([
        {
          id: 'biz-001',
          name: 'Odim Gate Printing & Business Hub',
          category: 'Business Center',
          location: 'Odim Gate, Nsukka',
          description: 'Affordable printing, scanning, photocopy, and thesis binding. Open from 7 AM to 9 PM daily.',
          rating: 4.6,
          reviewsCount: 104,
          verified: true,
          logoUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=200'
        },
        {
          id: 'biz-002',
          name: 'Franco Hostel Shuttle & Logistics',
          category: 'Transportation',
          location: 'Franco Car Park, UNN',
          description: 'Reliable moving service from town to hostels, and campus shuttles. Student-friendly rates.',
          rating: 4.7,
          reviewsCount: 88,
          verified: true,
          logoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=200'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrustScore = async (profile) => {
    try {
      const response = await fetch(`${API_BASE}/trust-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(prev => ({
          ...prev,
          trustScore: data.trustScore,
          trustLevel: data.level
        }));
      }
    } catch (err) {
      // Fallback math
      let score = 25;
      if (profile.phoneVerified) score += 10;
      if (profile.emailVerified) score += 10;
      if (profile.studentIdVerified) score += 15;
      if (profile.selfieVerified) score += 15;
      if (profile.ninVerified) score += 10;
      if (profile.bvnVerified) score += 15;
      
      let level = 'Verified Student';
      if (score >= 50 && score < 75) level = 'Verified Peer';
      if (score >= 75 && score < 90) level = 'Trusted Trader';
      if (score >= 90) level = 'Elite Campus Partner';
      
      setUserProfile(prev => ({ ...prev, trustScore: score, trustLevel: level }));
    }
  };

  const showToast = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 4000);
  };

  // NIN Sim
  const verifyNIN = async () => {
    if (ninInput.length !== 11) {
      showToast('NIN must be exactly 11 digits');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/verify/nin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nin: ninInput })
      });
      const data = await response.json();
      if (response.ok) {
        const updated = { ...userProfile, ninVerified: true };
        setUserProfile(updated);
        calculateTrustScore(updated);
        showToast(`NIN matching successful: ${data.data.fullName}`);
      } else {
        showToast(data.message || 'NIN verification failed');
      }
    } catch {
      const updated = { ...userProfile, ninVerified: true };
      setUserProfile(updated);
      calculateTrustScore(updated);
      showToast('NIN matches NIMC identity record (Simulated)');
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
      const response = await fetch(`${API_BASE}/verify/bvn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bvn: bvnInput })
      });
      const data = await response.json();
      if (response.ok) {
        const updated = { ...userProfile, bvnVerified: true };
        setUserProfile(updated);
        calculateTrustScore(updated);
        showToast(`BVN matching successful: Verified with ${data.data.bankVerified}`);
      } else {
        showToast(data.message || 'BVN verification failed');
      }
    } catch {
      const updated = { ...userProfile, bvnVerified: true };
      setUserProfile(updated);
      calculateTrustScore(updated);
      showToast('BVN matches biometric bank account (Simulated)');
    } finally {
      setLoading(false);
    }
  };

  // Student ID Verify
  const verifyStudentID = () => {
    if (!studentIdInput.trim()) {
      showToast('Please enter your UNN Registration Number');
      return;
    }
    const updated = { ...userProfile, studentIdVerified: true, regNo: studentIdInput };
    setUserProfile(updated);
    calculateTrustScore(updated);
    showToast('UNN Student Record verified: ' + studentIdInput.toUpperCase());
  };

  // Selfie Biometric Match
  const verifySelfieBiometrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/verify/selfie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selfieBase64: 'mock_base64_data' })
      });
      const data = await response.json();
      if (response.ok) {
        const updated = { ...userProfile, selfieVerified: true };
        setUserProfile(updated);
        calculateTrustScore(updated);
        setSelfieMock(true);
        showToast(`Selfie verification: ${data.message} (${data.matchConfidence}% Match)`);
      }
    } catch {
      const updated = { ...userProfile, selfieVerified: true };
      setUserProfile(updated);
      calculateTrustScore(updated);
      setSelfieMock(true);
      showToast('Face biometrics matching matches student ID card');
    } finally {
      setLoading(false);
    }
  };

  // IMEI Checker
  const checkIMEI = async () => {
    if (!imeiInput) {
      showToast('Please enter a 15-digit IMEI number');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/verify/imei`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imei: imeiInput })
      });
      const data = await response.json();
      setImeiReport(data);
      if (data.clean) {
        showToast('IMEI Clean! Device safe for buy/sell.');
      } else {
        showToast('WARNING: This device is flagged as stolen/blacklisted!');
      }
    } catch {
      const isClean = imeiInput !== '357289110482937';
      setImeiReport({
        imei: imeiInput,
        clean: isClean,
        status: isClean ? 'Clean' : 'Blacklisted / Reported Stolen',
        source: 'Checked offline db',
        carrierLock: 'Unlocked'
      });
      if (isClean) {
        showToast('IMEI Check: Clean (Simulated)');
      } else {
        showToast('WARNING: Stolen device flagged (Simulated)');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize Escrow
  const startEscrowBuy = async (product) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          buyerName: userProfile.name
        })
      });
      if (response.ok) {
        const data = await response.json();
        setActiveEscrow(data);
        setCurrentTab('escrow');
        showToast(`Escrow transaction created! Funds locked: ₦${product.price.toLocaleString()}`);
      }
    } catch {
      // Mock start
      const mockTx = {
        id: `tx-${Math.floor(1000 + Math.random() * 9000)}`,
        productId: product.id,
        productName: product.title,
        sellerName: product.seller.name,
        buyerName: userProfile.name,
        price: product.price,
        status: 'funds_locked',
        inspectionStatus: product.inspectionRequired ? 'pending' : 'not_required',
        inspectionScore: product.inspectionRequired ? (product.inspectionReport?.inspectionScore || 90) : 100,
        timestamp: new Date().toISOString()
      };
      setActiveEscrow(mockTx);
      setCurrentTab('escrow');
      showToast(`Escrow initialized (Local Mode). Funds Locked: ₦${product.price.toLocaleString()}`);
    } finally {
      setLoading(false);
    }
  };

  // Perform Escrow Actions
  const runEscrowAction = async (action) => {
    if (!activeEscrow) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/escrow/${activeEscrow.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (response.ok) {
        const data = await response.json();
        setActiveEscrow(data);
        if (action === 'inspect') showToast('Hub Inspection Complete: Verified Passed!');
        if (action === 'approve') showToast('Funds released to the seller successfully!');
        if (action === 'dispute') showToast('Dispute opened. A CampusVerse support officer is assigned.');
      }
    } catch {
      let updatedStatus = activeEscrow.status;
      let inspectionStatus = activeEscrow.inspectionStatus;
      
      if (action === 'inspect') {
        updatedStatus = 'inspected';
        inspectionStatus = 'passed';
      } else if (action === 'approve') {
        updatedStatus = 'funds_released';
      } else if (action === 'dispute') {
        updatedStatus = 'disputed';
      }
      
      setActiveEscrow(prev => ({
        ...prev,
        status: updatedStatus,
        inspectionStatus: inspectionStatus
      }));
      
      if (action === 'inspect') showToast('Hub Inspection Completed! Quality Certified (Simulated).');
      if (action === 'approve') showToast('Payment Released to Seller (Simulated).');
      if (action === 'dispute') showToast('Dispute logged to arbitration desk (Simulated).');
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
      author: userProfile.name,
      details: `${userProfile.regNo} • Just now`,
      tag: newPostTag,
      content: newPostContent,
      likes: 0,
      liked: false
    };
    setFeedPosts([newPost, ...feedPosts]);
    setNewPostContent('');
    showToast('Post shared to campus news feed!');
  };

  if (!policyAccepted) {
    return <PrivacyPolicy onAccept={() => setPolicyAccepted(true)} />;
  }

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
          <a href="#" className={`nav-item ${currentTab === 'trust' ? 'active' : ''}`} onClick={() => setCurrentTab('trust')}>
            <Icons.Trust /> <span>Trust & KYC</span>
          </a>
          <a href="#" className={`nav-item ${currentTab === 'escrow' ? 'active' : ''}`} onClick={() => setCurrentTab('escrow')}>
            <Icons.Escrow /> <span>Escrow Engine</span>
          </a>
          <a href="#" className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`} onClick={() => setCurrentTab('profile')}>
            <Icons.User /> <span>My Profile</span>
          </a>
        </nav>

        <div className="sidebar-user">
          <img className="user-avatar" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" alt="User avatar" />
          <div className="user-info">
            <span className="user-name">{userProfile.name}</span>
            <span className="user-trust-badge">🛡️ {userProfile.trustScore}% Trust Score</span>
          </div>
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
              {currentTab === 'trust' && 'Campus Biometric & Identity Trust'}
              {currentTab === 'escrow' && 'Escrow Payment Terminal'}
              {currentTab === 'profile' && 'My Campus Profile'}
            </h1>
            <span className="page-subtitle">
              {currentTab === 'dashboard' && 'Social forums, news, and student interactions'}
              {currentTab === 'marketplace' && 'Secure buying and selling within Nsukka'}
              {currentTab === 'services' && 'Hire student talent or view professional portfolios'}
              {currentTab === 'directory' && 'Find verified restaurants, printing hubs, and shuttles'}
              {currentTab === 'trust' && 'Dynamic safety score calculation and fraud telemetry'}
              {currentTab === 'escrow' && 'Milestone escrow contract protection'}
              {currentTab === 'profile' && 'Your public identity on the CampusVerse network'}
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
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifycontent: 'center', fontWeight: 'bold' }}>
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
                  <div className="trust-score-circle" style={{ width: '70px', height: '70px', fontSize: '18px', '--score-percent': `${userProfile.trustScore}%` }}>
                    {userProfile.trustScore}%
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600' }}>{userProfile.trustLevel}</h4>
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

        {/* Product Marketplace Tab */}
        {currentTab === 'marketplace' && (
          <div>
            {/* IMEI and stolen check banner */}
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🕵️ UNN Smart Anti-Theft Device Checker
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '500px' }}>
                  Buying a used phone or laptop? Validate the IMEI or Serial Number against our campus security database before completing the deal.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexGrow: 1, maxWidth: '400px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter 15-digit IMEI or Serial No..."
                  style={{ flexGrow: 1 }}
                  value={imeiInput}
                  onChange={(e) => setImeiInput(e.target.value)}
                />
                <button className="btn btn-accent" onClick={checkIMEI}>Verify</button>
              </div>
            </div>

            {/* IMEI results panel */}
            {imeiReport && (
              <div className="glass-panel" style={{
                padding: '16px 20px',
                marginBottom: '24px',
                borderLeft: `4px solid ${imeiReport.clean ? 'var(--accent-emerald)' : 'red'}`,
                background: imeiReport.clean ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: '600' }}>Device Telemetry Status: {imeiReport.status}</h4>
                  <button className="action-btn" onClick={() => setImeiReport(null)}>✕ Close</button>
                </div>
                <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '13px' }}>
                  <div><strong>IMEI / Serial:</strong> {imeiReport.imei}</div>
                  <div><strong>Network Lock:</strong> {imeiReport.carrierLock}</div>
                  <div><strong>Source Database:</strong> {imeiReport.source}</div>
                </div>
              </div>
            )}

            {/* Products grid */}
            <div className="items-grid">
              {products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase())).map(prod => (
                <div key={prod.id} className="glass-panel item-card">
                  <div className="item-image-wrapper">
                    <img className="item-image" src={prod.images[0]} alt={prod.title} />
                    <span className={`item-badge ${prod.inspectionRequired ? 'badge-verified' : 'badge-unverified'}`}>
                      {prod.inspectionRequired ? '🛡️ Inspected & Verified' : 'Unverified Listing'}
                    </span>
                  </div>
                  
                  <div className="item-content">
                    <span className="item-category">{prod.category}</span>
                    <h3 className="item-title">{prod.title}</h3>
                    <div className="item-price">₦{prod.price.toLocaleString()}</div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <span className="post-tag" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                        {prod.condition}
                      </span>
                      <span className="post-tag" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                        📍 {prod.location}
                      </span>
                    </div>

                    <div className="item-footer">
                      <div className="seller-brief">
                        <img className="seller-avatar" src={prod.seller.avatarUrl} alt="avatar" />
                        <div>
                          <div>{prod.seller.name}</div>
                          <div style={{ color: 'var(--accent-emerald)', fontSize: '10px' }}>🛡️ {prod.seller.trustScore}% Score</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      {prod.inspectionRequired && (
                        <button className="btn btn-secondary" style={{ flexGrow: 1, padding: '8px' }} onClick={() => setSelectedProduct(prod)}>
                          Specs
                        </button>
                      )}
                      <button className="btn btn-accent" style={{ flexGrow: 2, padding: '8px' }} onClick={() => startEscrowBuy(prod)}>
                        Buy Escrow
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Product details and Inspection certificate modal */}
            {selectedProduct && (
              <div className="modal-overlay">
                <div className="glass-panel modal-content" style={{ position: 'relative' }}>
                  <button className="modal-close" onClick={() => setSelectedProduct(null)}>✕</button>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>🛡️ CampusVerse Inspection Certificate</h2>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '20px' }}>
                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-emerald)' }}>Condition Grade</span>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-emerald)' }}>
                        {selectedProduct.inspectionReport.inspectionScore} / 100
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-emerald)' }}>Inspected By</span>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{selectedProduct.inspectionReport.inspectedBy}</div>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>Device Serial Number:</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500' }}>{selectedProduct.inspectionReport.serialNumber}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>IMEI Number:</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500' }}>{selectedProduct.inspectionReport.imei}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>Battery State of Health:</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500', color: 'var(--accent-emerald)' }}>{selectedProduct.inspectionReport.batteryHealth}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>Display Conditions:</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500' }}>{selectedProduct.inspectionReport.screenCondition}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>Repair/Diagnostic History:</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500' }}>{selectedProduct.inspectionReport.repairsDetected}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>Authenticity Verification:</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500', color: 'var(--accent-emerald)' }}>{selectedProduct.inspectionReport.authenticity}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Disclaimer: This document certifies that the device has passed visual and automated hardware analysis at a designated CampusVerse Hub location in UNN. The serial numbers and IMEI databases have been confirmed clean.
                  </p>
                </div>
              </div>
            )}
          </div>
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

        {/* Identity & Trust Portal */}
        {currentTab === 'trust' && (
          <div>
            <div className="glass-panel trust-score-header-card">
              <div className="trust-circle-container">
                <div className="trust-score-circle" style={{ '--score-percent': `${userProfile.trustScore}%` }}>
                  {userProfile.trustScore}%
                </div>
                <span className="user-trust-badge">🛡️ {userProfile.trustLevel}</span>
              </div>
              <div className="trust-score-details">
                <h3 className="trust-tier">Safety Verification Telemetry</h3>
                <p className="trust-desc">
                  CampusVerse utilizes advanced identity resolution, device behavior heuristics, and biometric matching to compute a live trust vector for students. Higher score guarantees access to zero escrow transaction fees and high-volume limits.
                </p>
                <div className="telemetry-row">
                  <div className="glass-panel telemetry-card">
                    <span className="telemetry-value">₦0</span>
                    <span className="telemetry-label">Disputed Escrow</span>
                  </div>
                  <div className="glass-panel telemetry-card">
                    <span className="telemetry-value">98.4%</span>
                    <span className="telemetry-label">Biometric Match</span>
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
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+234 808 **** 542 (OTP matches telecom provider)</div>
                    </div>
                    <span className="status-badge verified">Verified</span>
                  </div>

                  <div className="kyc-status-row">
                    <div>
                      <strong>Email Verification</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>o.eze@unn.edu.ng (UNN student domain matched)</div>
                    </div>
                    <span className="status-badge verified">Verified</span>
                  </div>

                  <div className="kyc-status-row">
                    <div>
                      <strong>Student Records (UNN Portal)</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>UNN Registrar validation database query</div>
                    </div>
                    {userProfile.studentIdVerified ? (
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
                    {userProfile.selfieVerified ? (
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
                    {userProfile.ninVerified ? (
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
                    {userProfile.bvnVerified ? (
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
                  To inspect and simulate the escrow lifecycle, purchase any high-value device from the Marketplace tab.
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
                      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Simulate Transaction Workflows</h4>
                      
                      {activeEscrow.status === 'funds_locked' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Funds have been securely locked in the CampusVerse bank ledger. The seller has been notified to deliver the device to the **CampusVerse Inspection Hub (Sub-Dome Center)**.
                          </p>
                          <button className="btn btn-accent" onClick={() => runEscrowAction('inspect')}>
                            Simulate Hub Inspection Report & Score
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
                            ✓ Funds successfully disbursed to the seller's account. This contract is closed.
                          </p>
                          <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => setActiveEscrow(null)}>
                            Reset Escrow Simulation
                          </button>
                        </div>
                      )}

                      {activeEscrow.status === 'disputed' && (
                        <div>
                          <p style={{ fontSize: '13px', color: 'var(--accent-amber)', fontWeight: '500' }}>
                            ⚠ Transaction is in Dispute status. Support is reviewing logs & serial history.
                          </p>
                          <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => setActiveEscrow(null)}>
                            Reset Escrow Simulation
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
        {/* My Profile Tab */}
        {currentTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>

            {/* Left — Profile Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Avatar + name card */}
              <div className="glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                  <img
                    src={userProfile.avatarUrl}
                    alt="Profile"
                    style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-purple)' }}
                  />
                  <div style={{
                    position: 'absolute', bottom: '0', right: '0',
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'var(--accent-emerald)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-primary)'
                  }}>✓</div>
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{userProfile.name}</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{userProfile.department}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{userProfile.level} &nbsp;·&nbsp; {userProfile.regNo}</p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '14px 0' }}>
                  <span style={{
                    background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)',
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                  }}>🛡️ {userProfile.trustLevel}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-emerald)' }}>{userProfile.trustScore}%</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Trust Score</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700' }}>{userProfile.tradesCount}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Trades</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-amber)' }}>★ {userProfile.rating}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{userProfile.totalReviews} Reviews</div>
                  </div>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => { setProfileDraft({ ...userProfile }); setEditingProfile(true); }}
                >
                  <Icons.Edit /> Edit Profile
                </button>
              </div>

              {/* Verification badges */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Status</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  {[
                    { label: 'Phone Number', done: userProfile.phoneVerified },
                    { label: 'University Email', done: userProfile.emailVerified },
                    { label: 'Student ID (UNN Portal)', done: userProfile.studentIdVerified },
                    { label: 'Selfie Biometrics', done: userProfile.selfieVerified },
                    { label: 'NIN (NIMC)', done: userProfile.ninVerified },
                    { label: 'BVN (Bank Record)', done: userProfile.bvnVerified },
                  ].map(({ label, done }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: done ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
                      <span style={{
                        fontSize: '11px', padding: '2px 10px', borderRadius: '20px', fontWeight: '600',
                        background: done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                        color: done ? 'var(--accent-emerald)' : 'var(--text-muted)'
                      }}>{done ? '✓ Verified' : 'Pending'}</span>
                    </div>
                  ))}
                </div>
                <button className="btn" style={{ width: '100%', marginTop: '16px', fontSize: '12px' }} onClick={() => setCurrentTab('trust')}>
                  Complete Verification
                </button>
              </div>

              {/* Joined info */}
              <div className="glass-panel" style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                📅 Member since {userProfile.joinedDate} &nbsp;·&nbsp; 📍 {userProfile.hostel}
              </div>
            </div>

            {/* Right — Description + Skills + Activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Bio / Description */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>About Me</h3>
                  <button
                    className="action-btn"
                    style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => { setProfileDraft({ ...userProfile }); setEditingProfile(true); }}
                  >
                    <Icons.Edit /> Edit
                  </button>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                  {userProfile.bio || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No bio yet. Click Edit to add one.</span>}
                </p>

                {/* Skills */}
                {userProfile.skills.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills & Expertise</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {userProfile.skills.map((sk, i) => (
                        <span key={i} style={{
                          background: 'rgba(139,92,246,0.12)', color: 'var(--accent-purple)',
                          padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                          border: '1px solid rgba(139,92,246,0.25)'
                        }}>{sk}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social links */}
                {(userProfile.twitter || userProfile.linkedin || userProfile.github) && (
                  <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                    {userProfile.twitter && (
                      <a href={`https://twitter.com/${userProfile.twitter}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                        🐦 @{userProfile.twitter}
                      </a>
                    )}
                    {userProfile.linkedin && (
                      <a href={`https://linkedin.com/in/${userProfile.linkedin}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                        💼 LinkedIn
                      </a>
                    )}
                    {userProfile.github && (
                      <a href={`https://github.com/${userProfile.github}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                        💻 GitHub
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Contact info card */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Contact & Identity</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>University Email</div>
                    <div style={{ fontWeight: '500' }}>{userProfile.email}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Registration No.</div>
                    <div style={{ fontWeight: '500' }}>{userProfile.regNo}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Department</div>
                    <div style={{ fontWeight: '500' }}>{userProfile.department}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Hostel</div>
                    <div style={{ fontWeight: '500' }}>{userProfile.hostel}</div>
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Recent Activity</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { icon: '🛒', text: 'Completed escrow purchase — Dell Latitude 7490', time: '2 days ago', color: 'var(--accent-emerald)' },
                    { icon: '⭐', text: 'Received a 5-star review from Adaeze Okonkwo', time: '4 days ago', color: 'var(--accent-amber)' },
                    { icon: '🛡️', text: 'Phone number verified successfully', time: '1 week ago', color: 'var(--accent-purple)' },
                    { icon: '📝', text: 'Listed iPhone 12 Pro Max on the Marketplace', time: '2 weeks ago', color: 'var(--accent-blue)' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingBottom: '12px', borderBottom: i < 3 ? '1px solid var(--border-glass)' : 'none' }}>
                      <div style={{ fontSize: '18px', lineHeight: 1 }}>{item.icon}</div>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{item.text}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {editingProfile && profileDraft && (
          <div className="modal-overlay">
            <div className="glass-panel modal-content" style={{ position: 'relative', maxWidth: '560px', width: '100%' }}>
              <button className="modal-close" onClick={() => setEditingProfile(false)}>✕</button>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Edit Your Profile</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Full Name</label>
                    <input className="form-input" value={profileDraft.name} onChange={e => setProfileDraft(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Level</label>
                    <select className="form-input" value={profileDraft.level} onChange={e => setProfileDraft(p => ({ ...p, level: e.target.value }))}>
                      {['100 Level','200 Level','300 Level','400 Level','500 Level','Postgraduate'].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Department / Faculty</label>
                  <input className="form-input" value={profileDraft.department} onChange={e => setProfileDraft(p => ({ ...p, department: e.target.value }))} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Bio / Description</label>
                  <textarea
                    className="form-input"
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    maxLength={300}
                    value={profileDraft.bio}
                    onChange={e => setProfileDraft(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell the campus who you are, what you sell or offer..."
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>{profileDraft.bio.length}/300</div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Skills (comma separated)</label>
                  <input
                    className="form-input"
                    value={profileDraft.skills.join(', ')}
                    onChange={e => setProfileDraft(p => ({ ...p, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="e.g. React.js, Graphic Design, Photography"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Hostel / Location</label>
                  <input className="form-input" value={profileDraft.hostel} onChange={e => setProfileDraft(p => ({ ...p, hostel: e.target.value }))} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Twitter Handle</label>
                    <input className="form-input" placeholder="username" value={profileDraft.twitter} onChange={e => setProfileDraft(p => ({ ...p, twitter: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>LinkedIn ID</label>
                    <input className="form-input" placeholder="username" value={profileDraft.linkedin} onChange={e => setProfileDraft(p => ({ ...p, linkedin: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>GitHub</label>
                    <input className="form-input" placeholder="username" value={profileDraft.github} onChange={e => setProfileDraft(p => ({ ...p, github: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                  <button
                    className="btn"
                    style={{ flexGrow: 2 }}
                    onClick={() => {
                      setUserProfile(profileDraft);
                      setEditingProfile(false);
                      showToast('Profile updated successfully!');
                    }}
                  >
                    Save Changes
                  </button>
                  <button className="btn btn-secondary" onClick={() => setEditingProfile(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
