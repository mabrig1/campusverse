import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import './EarnWhileYouLearn.css'
import './storefront.css'
import App from './App.jsx'
import CampusVerseStorefront from './CampusVerseStorefront.jsx'
import EarnWhileYouLearnLauncher from './EarnWhileYouLearnLauncher.jsx'
import ReferralPortal from './ReferralPortal.jsx'
import AdminDashboard from './AdminDashboard.jsx'

function CampusVerseRoot() {
  const path = window.location.pathname.toLowerCase()
  if (path.startsWith('/earn')) return <ReferralPortal />
  if (path.startsWith('/admin')) return <AdminDashboard />

  const [storefront, setStorefront] = useState(true)
  return storefront ? (
    <CampusVerseStorefront onLogin={() => setStorefront(false)} />
  ) : (
    <>
      <App />
      <EarnWhileYouLearnLauncher />
    </>
  )
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CampusVerseRoot />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
)
