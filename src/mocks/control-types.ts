import type { ScenarioName } from './scenarios/names'

export interface EmittedEventInfo {
  id: string
  type: string
  resourceId: string
  version: number
}

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
  /** Altera preço e/ou estoque de uma edição; a mudança sai em REST e no evento `nft.updated`. */
  updateEdition(change: {
    nftId: string
    editionId: string
    price?: string
    available?: number
  }): void
  /** Eventos em tempo real emitidos nesta página, do mais antigo para o mais recente. */
  getEmittedEvents(): EmittedEventInfo[]
  /** Reenvia pelo servidor de socket um evento já emitido (duplicata ou evento antigo). */
  replayEvent(eventId: string): void
  /** Derruba as conexões de socket; o cliente reconecta sozinho. */
  disconnectSockets(): void
  /** Com `false`, derruba as conexões de socket e recusa novas até voltar a `true`. */
  setSocketAvailable(available: boolean): void
}

declare global {
  interface Window {
    __mockControl?: MockControl
  }
}
