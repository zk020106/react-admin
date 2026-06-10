import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { setupHttpAuth } from '@/auth/http-auth'
import App from './App.tsx'

setupHttpAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
