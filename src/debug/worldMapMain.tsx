import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WorldMapReview } from './WorldMapReview'
import './worldMapReview.css'

createRoot(document.getElementById('world-map-root')!).render(
  <StrictMode>
    <WorldMapReview />
  </StrictMode>,
)
