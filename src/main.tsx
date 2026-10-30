import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { authService } from './services/authService'
import './services/businessService'

const root = createRoot(document.getElementById('root')!)

// Restore the Firebase session before rendering so route guards never flash.
authService.init().then(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
