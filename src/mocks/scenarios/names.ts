/** Arquivo sem dependências: também é importado pelos testes E2E. */
export const scenarioNames = [
  'default',
  'empty-catalog',
  'slow',
  'variable-latency',
  'out-of-order',
  'offline',
  'server-error',
  'flaky',
  'session-expired',
  'favorites-failure',
  'price-changed',
  'sold-out',
  'order-timeout',
  'payment-declined',
  'wallet-rejected',
] as const

export type ScenarioName = (typeof scenarioNames)[number]

export function isScenarioName(value: unknown): value is ScenarioName {
  return scenarioNames.includes(value as ScenarioName)
}
