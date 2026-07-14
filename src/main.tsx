import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App'
import { installE2EBridge } from './testing/e2eBridge'

function updateViewportHeight() {
  const height = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${height}px`)
}

function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

async function clearNativeWebCaches() {
  if (!Capacitor.isNativePlatform()) return
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
      registrations.map((registration) => registration.unregister()),
    )
  }
  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
}

updateViewportHeight()
window.visualViewport?.addEventListener('resize', updateViewportHeight)
window.addEventListener('resize', updateViewportHeight)
installE2EBridge()

void clearNativeWebCaches().finally(renderApp)
