let ready: Promise<void> = Promise.resolve()

/**
 * A interface renderiza antes de a API simulada terminar de iniciar. Requisições REST e a
 * conexão de socket esperam esta promessa para não escapar do mock nos primeiros instantes.
 * Sem mocks, ela já nasce resolvida.
 */
export function setBackendReady(promise: Promise<void>): void {
  ready = promise
}

export function backendReady(): Promise<void> {
  return ready
}
