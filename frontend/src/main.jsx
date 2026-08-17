import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import './EarnWhileYouLearn.css'
import App from './App.jsx'
import EarnWhileYouLearnLauncher from './EarnWhileYouLearnLauncher.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Installability degrades gracefully without a service worker — not fatal.
    })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <EarnWhileYouLearnLauncher />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
)
