import type { ScenarioName } from '@/mocks/scenarios/names'

export type Latency =
  | { kind: 'fixed'; ms: number }
  /** Atraso pseudoaleatório com semente fixa: a mesma sequência a cada carregamento. */
  | { kind: 'variable'; minMs: number; maxMs: number }
  /** Requisições ímpares ao caminho são lentas e as pares rápidas, então chegam fora de ordem. */
  | { kind: 'alternating'; pathPrefix: string; slowMs: number; fastMs: number }

export interface Failure {
  /** `network` derruba a conexão; os demais respondem com o status HTTP indicado. */
  kind: 'network' | 'http-500' | 'http-503'
  pathPrefix: string
  methods: 'all' | 'mutations'
  /** Quando definido, só as primeiras N tentativas de cada rota falham. */
  firstAttempts: number | null
}

export interface ScenarioConfig {
  description: string
  latency: Latency
  emptyCatalog: boolean
  /** Toda requisição autenticada responde 401 SESSION_EXPIRED. */
  sessionExpired: boolean
  failure: Failure | null
  /**
   * Interferência na criação do pedido, aplicada uma única vez:
   * `price-changed` altera o preço do primeiro item antes da validação;
   * `sold-out` esgota a edição do primeiro item antes da validação;
   * `timeout-after-create` cria o pedido e derruba a conexão antes de responder.
   */
  checkout: 'price-changed' | 'sold-out' | 'timeout-after-create' | null
  payment: 'confirmed' | 'declined'
  walletConnection: 'accepted' | 'rejected'
}

const base: ScenarioConfig = {
  description: 'Tudo funciona, com latência baixa e constante.',
  latency: { kind: 'fixed', ms: 60 },
  emptyCatalog: false,
  sessionExpired: false,
  failure: null,
  checkout: null,
  payment: 'confirmed',
  walletConnection: 'accepted',
}

export const scenarios: Record<ScenarioName, ScenarioConfig> = {
  default: base,
  'empty-catalog': {
    ...base,
    description: 'O catálogo não tem nenhum NFT.',
    emptyCatalog: true,
  },
  slow: {
    ...base,
    description: 'Toda resposta demora 2 segundos.',
    latency: { kind: 'fixed', ms: 2000 },
  },
  'variable-latency': {
    ...base,
    description: 'Cada resposta demora entre 100 ms e 1,5 s, em sequência determinística.',
    latency: { kind: 'variable', minMs: 100, maxMs: 1500 },
  },
  'out-of-order': {
    ...base,
    description: 'Consultas ao catálogo alternam entre lentas e rápidas e chegam fora de ordem.',
    latency: { kind: 'alternating', pathPrefix: '/nfts', slowMs: 1200, fastMs: 80 },
  },
  offline: {
    ...base,
    description: 'Toda requisição falha por erro de conexão.',
    failure: { kind: 'network', pathPrefix: '/', methods: 'all', firstAttempts: null },
  },
  'server-error': {
    ...base,
    description: 'Toda requisição responde 500.',
    failure: { kind: 'http-500', pathPrefix: '/', methods: 'all', firstAttempts: null },
  },
  flaky: {
    ...base,
    description: 'As duas primeiras tentativas de cada rota respondem 503; a terceira funciona.',
    failure: { kind: 'http-503', pathPrefix: '/', methods: 'all', firstAttempts: 2 },
  },
  'session-expired': {
    ...base,
    description: 'Toda requisição autenticada responde como sessão expirada.',
    sessionExpired: true,
  },
  'favorites-failure': {
    ...base,
    description: 'Favoritar e desfavoritar respondem 500; as consultas funcionam.',
    failure: { kind: 'http-500', pathPrefix: '/favorites', methods: 'mutations', firstAttempts: null },
  },
  'price-changed': {
    ...base,
    description: 'O preço do primeiro item do carrinho sobe 10% no momento de criar o pedido.',
    checkout: 'price-changed',
  },
  'sold-out': {
    ...base,
    description: 'A edição do primeiro item do carrinho esgota no momento de criar o pedido.',
    checkout: 'sold-out',
  },
  'order-timeout': {
    ...base,
    description: 'O pedido é criado, mas a conexão cai antes da resposta. Reenviar com a mesma chave o recupera.',
    checkout: 'timeout-after-create',
  },
  'payment-declined': {
    ...base,
    description: 'O pagamento é recusado e o pedido termina como recusado.',
    payment: 'declined',
  },
  'wallet-rejected': {
    ...base,
    description: 'A carteira recusa o pedido de conexão.',
    walletConnection: 'rejected',
  },
}
