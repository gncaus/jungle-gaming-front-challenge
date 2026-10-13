import { scenarios, type Failure, type ScenarioConfig } from '@/mocks/scenarios/config'
import { isScenarioName, type ScenarioName } from '@/mocks/scenarios/names'

const storageKey = 'kurio.mock.scenario'
const firedKey = 'kurio.mock.scenario.fired'
const latencySeed = 20260729

/** Contadores por carregamento de página; zerados a cada troca de cenário. */
let attempts = new Map<string, number>()
let randomState = latencySeed

function nextRandom(): number {
  // mulberry32: gerador determinístico, suficiente para variar a latência.
  randomState = (randomState + 0x6d2b79f5) | 0
  let t = randomState
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function countAttempt(key: string): number {
  const count = (attempts.get(key) ?? 0) + 1
  attempts.set(key, count)
  return count
}

export function getScenarioName(): ScenarioName {
  const stored = localStorage.getItem(storageKey)
  return isScenarioName(stored) ? stored : 'default'
}

export function getScenario(): ScenarioConfig {
  return scenarios[getScenarioName()]
}

export function setScenario(name: ScenarioName): void {
  localStorage.setItem(storageKey, name)
  localStorage.removeItem(firedKey)
  attempts = new Map()
  randomState = latencySeed
}

/** `?scenario=nome` na URL seleciona o cenário e o mantém nos próximos carregamentos. */
export function applyScenarioFromUrl(search: string): void {
  const requested = new URLSearchParams(search).get('scenario')
  if (isScenarioName(requested)) {
    setScenario(requested)
  }
}

export function latencyFor(path: string): number {
  const { latency } = getScenario()
  switch (latency.kind) {
    case 'fixed':
      return latency.ms
    case 'variable':
      return Math.round(latency.minMs + nextRandom() * (latency.maxMs - latency.minMs))
    case 'alternating': {
      if (!path.startsWith(latency.pathPrefix)) return latency.fastMs
      return countAttempt(`latency:${latency.pathPrefix}`) % 2 === 1 ? latency.slowMs : latency.fastMs
    }
  }
}

export function failureFor(method: string, path: string): Failure | null {
  const { failure } = getScenario()
  if (!failure || !path.startsWith(failure.pathPrefix)) return null
  if (failure.methods === 'mutations' && method === 'GET') return null
  if (failure.firstAttempts !== null && countAttempt(`failure:${method} ${path}`) > failure.firstAttempts) {
    return null
  }
  return failure
}

/**
 * Efeitos que acontecem uma única vez por cenário. O registro fica no storage para
 * não se repetir depois de um refresh; trocar de cenário (ou resetar) o limpa.
 */
export function fireOnce(effect: string): boolean {
  const fired = JSON.parse(localStorage.getItem(firedKey) ?? '[]') as string[]
  if (fired.includes(effect)) return false
  localStorage.setItem(firedKey, JSON.stringify([...fired, effect]))
  return true
}
