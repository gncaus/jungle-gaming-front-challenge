import type { ScenarioName } from './scenarios/names'

/**
 * Controle da API simulada exposto em `window.__mockControl`.
 * Arquivo só de tipos e sem alias de import: também é usado pelos testes E2E.
 */
export interface MockControl {
  /** Restaura o banco e o cenário para o estado inicial conhecido. */
  reset(): void
  getScenario(): ScenarioName
  setScenario(name: ScenarioName): void
  /** Vence todas as sessões abertas, como se o tempo de validade tivesse passado. */
  expireSessions(): void
  /** Altera preço e/ou estoque de uma edição e incrementa a versão do NFT. */
  updateEdition(change: {
    nftId: string
    editionId: string
    price?: string
    available?: number
  }): void
}

declare global {
  interface Window {
    __mockControl?: MockControl
  }
}
