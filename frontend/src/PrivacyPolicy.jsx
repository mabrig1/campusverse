import React, { useState } from 'react';

const POLICY_VERSION = '1.0';
const EFFECTIVE_DATE = 'June 4, 2025';

export function hasAcceptedPolicy() {
  try {
    const stored = JSON.parse(localStorage.getItem('cv_privacy_consent') || 'null');
    return stored?.version === POLICY_VERSION && stored?.accepted === true;
  } catch {
    return false;
  }
}

export function recordAcceptance(fullName, regNo) {
  localStorage.setItem('cv_privacy_consent', JSON.stringify({
    version: POLICY_VERSION,
    accepted: true,
    fullName,
    regNo,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  }));
}

const sections = [
  {
    title: '1. Who We Are',
    body: `CampusVerse ("we", "us", "our") is a student-to-student marketplace and trust platform operating within the University of Nigeria, Nsukka (UNN) community and accessible at campusverse.store. We are committed to protecting the personal data of every student, buyer, seller, and service provider who uses our platform.`
  },
  {
    title: '2. Data We Collect',
    body: `We collect the following categories of personal data when you register and use CampusVerse:

• Identity Data: Full name, UNN registration number, student level, department, and faculty.
• Contact Data: University email address (@unn.edu.ng), phone number, and hostel address.
• Biometric & KYC Data: Selfie photograph for face-match verification, National Identification Number (NIN), and Bank Verification Number (BVN) — processed solely for identity verification purposes and never stored in plain text.
• Device & Technical Data: Device fingerprint, IP address, browser user agent, and geolocation signals used exclusively for fraud prevention.
• Transaction Data: Records of escrow transactions, product listings, service engagements, and payment milestones.
• Profile Data: Bio description, skills, social media handles (optional), and profile photo.
• Usage Data: Pages visited, search queries, feature interactions, and time-on-platform analytics.`
  },
  {
    title: '3. How We Use Your Data',
    body: `We use your personal data for the following lawful purposes:

• Account creation, authentication, and student identity verification.
• Computing your real-time Trust Score to facilitate safe peer-to-peer transactions.
• Processing escrow payments and maintaining auditable transaction records.
• Detecting and preventing fraud, account takeovers, and stolen device trafficking.
• Sending service notifications, security alerts, and platform updates.
• Improving our recommendation engine and product matching.
• Complying with applicable Nigerian law, including the Nigeria Data Protection Act (NDPA) 2023.

We do NOT use your data for targeted advertising, and we do NOT sell your data to any third party.`
  },
  {
    title: '4. Legal Basis for Processing',
    body: `Under the Nigeria Data Protection Act (NDPA) 2023, we process your data on the following legal bases:

• Contractual Necessity: Processing required to provide the services you signed up for.
• Legitimate Interest: Fraud prevention, platform security, and trust score computation.
• Consent: Biometric data (selfie, NIN, BVN) — you may withdraw consent at any time by contacting us.
• Legal Obligation: Where we are required to retain records under Nigerian financial regulations.`
  },
  {
    title: '5. KYC & Biometric Data',
    body: `CampusVerse performs Know Your Customer (KYC) verification to protect all students on the platform. Your NIN and BVN are transmitted over encrypted channels (TLS 1.3) to verification partners and are NEVER stored as plain text in our database. Selfie images are compared against your student ID photograph for liveness detection and are deleted from processing queues within 24 hours of verification. We will never use your biometric data for any purpose other than identity verification.`
  },
  {
    title: '6. Data Sharing & Third Parties',
    body: `We share your data only in the following limited circumstances:

• KYC Verification Partners: NIN verification via NIMC-licensed API providers; BVN via CBN-licensed fintech providers.
• Payment Partners: Paystack or equivalent CBN-licensed payment processors for escrow settlement.
• Cloud Infrastructure: MongoDB Atlas (data hosting) and Render.com (backend hosting) — both bound by data processing agreements.
• Law Enforcement: Only where required by a valid Nigerian court order or statutory obligation.

All third-party processors are contractually obligated to handle your data securely and only for the specified purpose.`
  },
  {
    title: '7. Data Retention',
    body: `We retain your personal data for as long as your account remains active. Upon account deletion:

• Profile and identity data: deleted within 30 days.
• Transaction records: retained for 7 years as required under Nigerian financial regulations.
• Biometric verification data: deleted immediately upon account closure.
• Device telemetry logs: anonymised and retained for up to 12 months for fraud analytics.`
  },
  {
    title: '8. Your Rights',
    body: `Under the NDPA 2023, you have the following rights regarding your personal data:

• Right of Access: Request a copy of all data we hold about you.
• Right to Rectification: Correct inaccurate or incomplete data.
• Right to Erasure: Request deletion of your data (subject to legal retention obligations).
• Right to Portability: Receive your data in a machine-readable format.
• Right to Object: Object to processing based on legitimate interests.
• Right to Withdraw Consent: Revoke consent for biometric processing at any time.

To exercise any right, email: privacy@campusverse.store. We will respond within 21 days.`
  },
  {
    title: '9. Security Measures',
    body: `CampusVerse implements the following security controls to protect your data:

• All data in transit is encrypted using TLS 1.3.
• All data at rest is encrypted using AES-256 on MongoDB Atlas.
• Passwords and sensitive credentials are hashed using bcrypt (minimum 12 rounds).
• Rate limiting and device fingerprinting protect against brute-force and account farming.
• Regular security audits and penetration testing are conducted.
• Access to production databases is restricted to authorised personnel only via role-based access control (RBAC).`
  },
  {
    title: '10. Cookies & Tracking',
    body: `CampusVerse uses only functional, session-based storage (localStorage and sessionStorage) to maintain your login state, consent record, and UI preferences. We do NOT use third-party advertising cookies, tracking pixels, or cross-site tracking technologies.`
  },
  {
    title: '11. Children & Student Eligibility',
    body: `CampusVerse is intended exclusively for enrolled students, staff, and verified traders within the UNN community. Users must be at least 16 years of age. If you are under 16, you must obtain parental or guardian consent before registering. By accepting this policy, you confirm that you meet this eligibility requirement.`
  },
  {
    title: '12. Changes to This Policy',
    body: `We may update this Privacy Policy to reflect changes in our practices or applicable law. We will notify you via your registered email address and require your re-acceptance of any material changes before you can continue using the platform. The current version and effective date are always displayed at the top of this document.`
  },
  {
    title: '13. Contact & Complaints',
    body: `Data Controller: CampusVerse Nigeria
Email: privacy@campusverse.store
Website: https://campusverse.store
Address: University of Nigeria, Nsukka, Enugu State, Nigeria

If you believe your data rights have been violated, you may also lodge a complaint with the Nigeria Data Protection Commission (NDPC) at https://ndpc.gov.ng.`
  }
];

export default function PrivacyPolicy({ onAccept }) {
  const [fullName, setFullName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(null);

  const handleAccept = () => {
    if (!fullName.trim()) { setError('Please enter your full legal name.'); return; }
    if (!regNo.trim()) { setError('Please enter your UNN registration number.'); return; }
    if (!ageConfirmed) { setError('You must confirm you are 16 years of age or older.'); return; }
    if (!agreed) { setError('You must agree to the Privacy Policy to continue.'); return; }
    recordAcceptance(fullName.trim(), regNo.trim());
    onAccept();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(11,15,25,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflowY: 'auto', padding: '40px 16px'
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '780px', marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '12px',
          background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '12px', padding: '10px 20px', marginBottom: '24px'
        }}>
          <span style={{ fontSize: '22px' }}>🛡️</span>
          <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--accent-purple)' }}>CampusVerse Privacy & Data Protection Policy</span>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: '800', lineHeight: 1.2, marginBottom: '10px' }}>
          Before you continue, please read and sign our Privacy Policy
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          CampusVerse processes your personal data including identity documents and biometrics to keep campus transactions safe.
          This policy explains exactly what we collect, why, and how your rights are protected under the
          <strong style={{ color: 'var(--text-primary)' }}> Nigeria Data Protection Act (NDPA) 2023</strong>.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>📄 Version {POLICY_VERSION}</span>
          <span>📅 Effective: {EFFECTIVE_DATE}</span>
          <span>🏛️ NDPA 2023 Compliant</span>
        </div>
      </div>

      {/* Policy sections */}
      <div style={{ width: '100%', maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
        {sections.map((sec, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-glass)', border: `1px solid ${activeSection === i ? 'rgba(139,92,246,0.4)' : 'var(--border-glass)'}`,
              borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s'
            }}
          >
            <button
              onClick={() => setActiveSection(activeSection === i ? null : i)}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                color: 'var(--text-primary)', textAlign: 'left'
              }}
            >
              <span style={{ fontWeight: '600', fontSize: '14px' }}>{sec.title}</span>
              <span style={{
                fontSize: '18px', color: 'var(--accent-purple)',
                transform: activeSection === i ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s', lineHeight: 1
              }}>▾</span>
            </button>
            {activeSection === i && (
              <div style={{ padding: '0 20px 20px 20px' }}>
                <div style={{ height: '1px', background: 'var(--border-glass)', marginBottom: '16px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {sec.body}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Signature & consent form */}
      <div style={{
        width: '100%', maxWidth: '780px',
        background: 'var(--bg-glass)', border: '1px solid rgba(139,92,246,0.35)',
        borderRadius: '16px', padding: '28px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>✍️ Digital Signature & Consent</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '22px' }}>
          By completing and submitting this form, you are providing a legally binding digital signature confirming your acceptance of this Privacy Policy.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              Full Legal Name *
            </label>
            <input
              className="form-input"
              placeholder="e.g. Obinna Chijioke Eze"
              value={fullName}
              onChange={e => { setFullName(e.target.value); setError(''); }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              UNN Registration Number *
            </label>
            <input
              className="form-input"
              placeholder="e.g. 2023/149819"
              value={regNo}
              onChange={e => { setRegNo(e.target.value); setError(''); }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <div
              onClick={() => { setAgeConfirmed(!ageConfirmed); setError(''); }}
              style={{
                width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0, marginTop: '1px',
                border: `2px solid ${ageConfirmed ? 'var(--accent-emerald)' : 'var(--border-glass)'}`,
                background: ageConfirmed ? 'var(--accent-emerald)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', cursor: 'pointer'
              }}
            >
              {ageConfirmed && <span style={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              I confirm that I am <strong style={{ color: 'var(--text-primary)' }}>16 years of age or older</strong>, or that I have obtained parental/guardian consent to use this platform.
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <div
              onClick={() => { setAgreed(!agreed); setError(''); }}
              style={{
                width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0, marginTop: '1px',
                border: `2px solid ${agreed ? 'var(--accent-purple)' : 'var(--border-glass)'}`,
                background: agreed ? 'var(--accent-purple)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', cursor: 'pointer'
              }}
            >
              {agreed && <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              I have read and understood the CampusVerse Privacy Policy (Version {POLICY_VERSION}, effective {EFFECTIVE_DATE}). I consent to the collection, processing, and use of my personal data — including identity documents and biometric data — as described above. I understand I may withdraw my consent at any time by contacting <strong style={{ color: 'var(--text-primary)' }}>privacy@campusverse.store</strong>.
            </span>
          </label>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px', padding: '10px 16px', marginBottom: '16px',
            fontSize: '13px', color: '#f87171'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn"
            style={{
              flexGrow: 1, padding: '14px', fontSize: '15px', fontWeight: '700',
              background: agreed && ageConfirmed && fullName && regNo
                ? 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))'
                : 'rgba(255,255,255,0.07)',
              color: agreed && ageConfirmed && fullName && regNo ? '#fff' : 'var(--text-muted)',
              cursor: agreed && ageConfirmed && fullName && regNo ? 'pointer' : 'not-allowed',
              border: 'none', transition: 'all 0.2s'
            }}
            onClick={handleAccept}
          >
            🛡️ I Accept — Enter CampusVerse
          </button>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '14px', lineHeight: 1.5 }}>
          This digital signature is timestamped and recorded alongside your name, registration number, browser fingerprint, and IP address. Your acceptance record is stored securely and may be retrieved upon request for legal compliance purposes.
        </p>
      </div>

      <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
        CampusVerse Nigeria · campusverse.store · privacy@campusverse.store · NDPA 2023 Compliant
      </div>
    </div>
  );
}
