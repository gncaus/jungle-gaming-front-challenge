import { setBackendReady } from '@/shared/lib/backend-ready'
import '@/styles.css'

/**
 * Ponto de entrada mínimo: dispara, ao mesmo tempo, o carregamento da aplicação e o da
 * API simulada. A interface renderiza assim que estiver pronta, sem esperar o mock;
 * só as requisições aguardam o worker iniciar (ver shared/lib/backend-ready).
 */
if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
  // Lido agora porque o router pode reescrever a URL antes de o módulo de mocks carregar.
  const initialSearch = window.location.search
  setBackendReady(
    import('@/mocks/browser').then(({ startMockWorker }) => startMockWorker(initialSearch)),
  )
}

void import('@/app/bootstrap')
