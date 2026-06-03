import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-Memory Databases
let escrowTransactions = [
  {
    id: 'tx-001',
    productId: 'prod-001',
    productName: 'iPhone 12 Pro Max (128GB, Pacific Blue)',
    sellerName: 'Chinedu Okafor (UNN Computer Science, Year 3)',
    buyerName: 'Blessing Obi (UNN Pharmacy, Year 2)',
    price: 380000, // NGN
    status: 'awaiting_payment', // awaiting_payment -> funds_locked -> inspection_in_progress -> inspected -> buyer_approved -> funds_released
    inspectionStatus: 'pending', // pending -> passed -> failed
    inspectionScore: 0,
    inspectionCertificateUrl: '',
    disputeStatus: 'none',
    timestamp: new Date().toISOString()
  }
];

const mockProducts = [
  {
    id: 'prod-001',
    title: 'iPhone 12 Pro Max (128GB)',
    description: 'Clean UK-used. Battery health 88%. True Tone active, Face ID functional. Selling because I need to buy textbooks and pay hostel fees.',
    price: 380000,
    category: 'Electronics',
    condition: 'Used (Excellent)',
    location: 'Franco Hostel, UNN',
    seller: {
      name: 'Chinedu Okafor',
      verified: true,
      trustScore: 89,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    },
    images: [
      'https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&q=80&w=600'
    ],
    inspectionRequired: true,
    inspectionReport: {
      imei: '357289110482937',
      serialNumber: 'G0NFC17BN7FD',
      batteryHealth: '88%',
      screenCondition: 'Original - No scratches',
      repairsDetected: 'None',
      authenticity: 'Verified Original Apple',
      inspectionScore: 94,
      inspectedBy: 'CampusVerse Hub (Franco, UNN)'
    }
  },
  {
    id: 'prod-002',
    title: 'Modern Study Desk & Ergonomic Chair',
    description: 'Very sturdy wooden desk with a metal frame. Comes with a comfortable mesh office chair. Perfect for studying at night.',
    price: 65000,
    category: 'Hostel Furniture',
    condition: 'Used (Like New)',
    location: 'Odim Gate area, Nsukka',
    seller: {
      name: 'Amara Nwosu',
      verified: true,
      trustScore: 92,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
    },
    images: [
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600'
    ],
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
    seller: {
      name: 'Emeka Eze',
      verified: false,
      trustScore: 45,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
    },
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=600'
    ],
    inspectionRequired: true,
    inspectionReport: {
      imei: 'N/A - Laptop',
      serialNumber: '9J8XW42',
      batteryHealth: '82%',
      screenCondition: 'Minor bezel scratch, panel original',
      repairsDetected: 'SSD Upgraded',
      authenticity: 'Verified Dell OEM',
      inspectionScore: 88,
      inspectedBy: 'CampusVerse Hub (Sub-Dome, UNN)'
    }
  }
];

const mockServices = [
  {
    id: 'srv-001',
    title: 'Professional CV & LinkedIn Profile Writing',
    description: 'Tailored specifically for Nigerian students applying for internships, remote tech jobs, or scholarships.',
    price: 5000,
    rating: 4.9,
    reviewsCount: 32,
    provider: {
      name: 'Tobi Daniels',
      department: 'UNN Faculty of Law',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
      skills: ['CV Optimization', 'LinkedIn Branding', 'Academic Consulting'],
      trustScore: 96
    }
  },
  {
    id: 'srv-002',
    title: 'React & Node.js Website Development',
    description: 'Building custom websites, portfolios, and startup landing pages. High performance and mobile responsive guaranteed.',
    price: 45000,
    rating: 5.0,
    reviewsCount: 14,
    provider: {
      name: 'Ibrahim Bello',
      department: 'UNN Electronic Engineering',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      skills: ['React.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      trustScore: 98
    }
  },
  {
    id: 'srv-003',
    title: 'Hairdressing & Braiding (Hostel Delivery)',
    description: 'Get your hair done beautifully in the comfort of your hostel room. I braid knotless braids, twists, and weave-on styles.',
    price: 7000,
    rating: 4.8,
    reviewsCount: 47,
    provider: {
      name: 'Chioma Nkechi',
      department: 'UNN Biochemistry',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
      skills: ['Knotless Braids', 'Weaves', 'Hair Treatment'],
      trustScore: 91
    }
  }
];

const mockDirectory = [
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
  },
  {
    id: 'biz-003',
    name: 'Grace Kitchen (UNN Corner)',
    category: 'Restaurant',
    location: 'Behind Bello Hostel, Nsukka',
    description: 'Best local Jollof Rice, Egusi, Okro, and Abacha. We do deliveries to all UNN hostels.',
    rating: 4.8,
    reviewsCount: 153,
    verified: true,
    logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200'
  }
];

// Stolen Phone database (IMEIs)
const blacklistedIMEIs = ['357289110482937', '861002938172930'];

// --- ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CampusVerse Engine active' });
});

// Trust Score calculation API
app.post('/api/trust-score', (req, res) => {
  const { phoneVerified, emailVerified, studentIdVerified, selfieVerified, ninVerified, bvnVerified, tradesCount, disputeCount } = req.body;
  
  let score = 25; // Base score for account age / signup
  
  if (phoneVerified) score += 10;
  if (emailVerified) score += 10;
  if (studentIdVerified) score += 15;
  if (selfieVerified) score += 15;
  
  // Advanced verifications
  if (ninVerified) score += 10;
  if (bvnVerified) score += 15;
  
  // Trades factor
  const successfulTrades = Math.max(0, tradesCount || 0);
  score += Math.min(20, successfulTrades * 2); // Max 20 points for trades
  
  // Disputes deduction
  const disputes = Math.max(0, disputeCount || 0);
  score -= (disputes * 8);
  
  // Normalize between 10 and 100
  score = Math.max(10, Math.min(100, score));
  
  // Dynamic badge assignment
  let level = 'Unverified Student';
  if (score >= 50 && score < 75) level = 'Verified Peer';
  if (score >= 75 && score < 90) level = 'Trusted Trader';
  if (score >= 90) level = 'Elite Campus Partner';

  res.json({ trustScore: score, level });
});

// Mock NIN Validation
app.post('/api/verify/nin', (req, res) => {
  const { nin } = req.body;
  if (!nin || nin.length !== 11) {
    return res.status(400).json({ success: false, message: 'NIN must be exactly 11 digits' });
  }
  
  res.json({
    success: true,
    message: 'NIN identity matching successful',
    data: {
      fullName: 'CHINEDU CHIJIOKE OKAFOR',
      dob: '2004-04-18',
      gender: 'M',
      stateOfOrigin: 'Enugu State'
    }
  });
});

// Mock BVN Validation
app.post('/api/verify/bvn', (req, res) => {
  const { bvn } = req.body;
  if (!bvn || bvn.length !== 11) {
    return res.status(400).json({ success: false, message: 'BVN must be exactly 11 digits' });
  }
  
  res.json({
    success: true,
    message: 'BVN identity matches biometric record',
    data: {
      fullName: 'CHINEDU CHIJIOKE OKAFOR',
      phone: '080*****544',
      bankVerified: 'Access Bank PLC'
    }
  });
});

// Mock Selfie Matching validation
app.post('/api/verify/selfie', (req, res) => {
  const { selfieBase64 } = req.body;
  if (!selfieBase64) {
    return res.status(400).json({ success: false, message: 'Selfie image data is required' });
  }
  
  res.json({
    success: true,
    matchConfidence: 98.4, // Mock biometric match
    livenessDetected: true,
    message: 'Face match matches student ID photo'
  });
});

// Mock IMEI Check for Phone Safety
app.post('/api/verify/imei', (req, res) => {
  const { imei } = req.body;
  if (!imei) {
    return res.status(400).json({ success: false, message: 'IMEI is required' });
  }
  
  const isBlacklisted = blacklistedIMEIs.includes(imei.trim());
  
  res.json({
    imei,
    clean: !isBlacklisted,
    status: isBlacklisted ? 'Blacklisted / Reported Stolen' : 'Clean',
    source: isBlacklisted ? 'Nigeria Police Force & Campus Security Database' : 'Checked globally',
    carrierLock: 'Unlocked'
  });
});

// Fraud Risk Assessment Engine
app.post('/api/fraud-risk', (req, res) => {
  const { deviceFingerprint, ipAddress, userAgent, location } = req.body;
  
  // Risk assessment rules
  let riskScore = 15; // default low risk
  let flags = [];
  
  if (!deviceFingerprint) {
    riskScore += 20;
    flags.push('No device identifier');
  }
  
  // Check location anomalies (UNN vs. distant IP locations)
  if (location && !location.toLowerCase().includes('nsukka') && !location.toLowerCase().includes('enugu')) {
    riskScore += 30;
    flags.push('Geo-location anomaly: Out of campus region');
  }
  
  let riskLevel = 'Low';
  if (riskScore > 30) riskLevel = 'Moderate';
  if (riskScore > 60) riskLevel = 'High';
  
  res.json({
    riskScore,
    riskLevel,
    flags,
    action: riskLevel === 'High' ? 'Trigger OTP & Biometric Challenge' : 'Approve Transaction'
  });
});

// Get all products
app.get('/api/products', (req, res) => {
  res.json(mockProducts);
});

// Get all services
app.get('/api/services', (req, res) => {
  res.json(mockServices);
});

// Local Business Directory
app.get('/api/directory', (req, res) => {
  res.json(mockDirectory);
});

// Escrow transaction handling
app.post('/api/escrow', (req, res) => {
  const { productId, buyerName } = req.body;
  const prod = mockProducts.find(p => p.id === productId);
  if (!prod) return res.status(404).json({ error: 'Product not found' });
  
  const newTx = {
    id: `tx-${Math.floor(1000 + Math.random() * 9000)}`,
    productId,
    productName: prod.title,
    sellerName: prod.seller.name,
    buyerName: buyerName || 'Blessing Obi (UNN)',
    price: prod.price,
    status: 'funds_locked',
    inspectionStatus: prod.inspectionRequired ? 'pending' : 'not_required',
    inspectionScore: prod.inspectionRequired ? prod.inspectionReport.inspectionScore : 100,
    timestamp: new Date().toISOString()
  };
  
  escrowTransactions.push(newTx);
  res.json(newTx);
});

app.get('/api/escrow/:id', (req, res) => {
  const tx = escrowTransactions.find(t => t.id === req.params.id);
  if (!tx) return res.status(404).json({ error: 'Escrow transaction not found' });
  res.json(tx);
});

app.post('/api/escrow/:id/action', (req, res) => {
  const { action } = req.body; // inspect, approve, dispute
  const txIndex = escrowTransactions.findIndex(t => t.id === req.params.id);
  if (txIndex === -1) return res.status(404).json({ error: 'Escrow transaction not found' });
  
  const tx = escrowTransactions[txIndex];
  
  if (action === 'inspect') {
    tx.status = 'inspected';
    tx.inspectionStatus = 'passed';
  } else if (action === 'approve') {
    tx.status = 'funds_released';
  } else if (action === 'dispute') {
    tx.status = 'disputed';
    tx.disputeStatus = 'under_review';
  }
  
  escrowTransactions[txIndex] = tx;
  res.json(tx);
});

// AI Smart Search & Recommendations
app.get('/api/recommendations', (req, res) => {
  const { query, category, hostel } = req.query;
  
  let filtered = [...mockProducts];
  if (hostel) {
    // Rank products higher if they are in the same hostel
    filtered.sort((a, b) => {
      const aInHostel = a.location.toLowerCase().includes(hostel.toLowerCase());
      const bInHostel = b.location.toLowerCase().includes(hostel.toLowerCase());
      return (bInHostel ? 1 : 0) - (aInHostel ? 1 : 0);
    });
  }
  
  res.json({
    recommendedProducts: filtered.slice(0, 3),
    recommendedServices: mockServices.slice(0, 2)
  });
});

app.listen(PORT, () => {
  console.log(`CampusVerse Backend running on port ${PORT}`);
});
