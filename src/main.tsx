import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { authService } from './services/authService'
import './services/businessService'

const root = createRoot(document.getElementById('root')!)

const render = () =>
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

// Public, unauthenticated pages reached by scanning a QR code. These never
// depend on a restored merchant session, so paint them immediately and let
// auth restore in the background — the merchant dashboard/login routes still
// wait for auth so their guards never flash.
const PUBLIC_PREFIXES = ['/card/', '/menu/', '/order/', '/book/', '/appointment/', '/services/', '/catalog/']
const path = typeof window !== 'undefined' ? window.location.pathname : ''
const isPublicRoute = PUBLIC_PREFIXES.some((p) => path.startsWith(p))

if (isPublicRoute) {
  render()
  void authService.init()
} else {
  authService.init().then(render)
}
