import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { setupHttpAuth } from '@/auth/http-auth'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@douyinfe/semi-ui-19/dist/css/semi.css'
import App from './App.tsx'

setupHttpAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
