import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers'
import '@/styles.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Elemento #root não encontrado em index.html')
}

if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
  const { startMockWorker } = await import('@/mocks/browser')
  await startMockWorker()
}

createRoot(container).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
)
