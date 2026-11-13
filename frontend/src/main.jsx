import { StrictMode, Suspense, lazy, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import './EarnWhileYouLearn.css'
import './storefront.css'
// Keep the public storefront fast on Nigerian mobile connections: avoid loading
// admin, referral and dashboard JavaScript until those screens are requested.
const App = lazy(() => import('./App.jsx'))
const CampusVerseStorefront = lazy(() => import('./CampusVerseStorefront.jsx'))
const ReferralPortal = lazy(() => import('./ReferralPortal.jsx'))
const AdminPortal = lazy(() => import('./AdminPortal.jsx'))

function CampusVerseRoot() {
  const path = window.location.pathname.toLowerCase()
  if (path.startsWith('/earn')) return <ReferralPortal />
  if (path.startsWith('/admin')) return <AdminPortal />

  const [storefront, setStorefront] = useState(true)
  const [initialTab, setInitialTab] = useState('laptops')
  return storefront ? (
    <CampusVerseStorefront onLogin={(tab = 'laptops') => { setInitialTab(tab); setStorefront(false) }} />
  ) : (
    <App initialTab={initialTab} />
  )
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<div role="status" style={{padding: 32, color: '#065f46', fontFamily: 'system-ui, sans-serif'}}>Loading CampusVerse…</div>}>
      <CampusVerseRoot />
    </Suspense>
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
)
