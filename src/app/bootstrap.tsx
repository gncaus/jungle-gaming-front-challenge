import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers'
import { installSessionHandling } from '@/app/session'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Elemento #root não encontrado em index.html')
}

installSessionHandling()

createRoot(container).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
)
