import { publishPendingChanges } from '@/mocks/db/changes'
import { buildSeed, schemaVersion } from '@/mocks/db/seed'
import type { DbState } from '@/mocks/db/types'

const storageKey = 'kurio.mock.db'

let cache: DbState | null = null

// Outra aba gravou o banco: descarta a cópia em memória para reler do storage.
window.addEventListener('storage', (event) => {
  if (event.key === storageKey || event.key === null) {
    cache = null
  }
})

function load(): DbState {
  const raw = localStorage.getItem(storageKey)
  if (raw) {
    const stored = JSON.parse(raw) as DbState
    if (stored.schemaVersion === schemaVersion) {
      return stored
    }
  }
  const seed = buildSeed()
  localStorage.setItem(storageKey, JSON.stringify(seed))
  return seed
}

/** Leitura do estado. Não altere o retorno: use `updateDb`. */
export function readDb(): DbState {
  cache ??= load()
  return cache
}

/** Aplica uma alteração e grava o estado inteiro, para sobreviver a refresh. */
export function updateDb<T>(change: (state: DbState) => T): T {
  const state = readDb()
  try {
    return change(state)
  } finally {
    // Grava mesmo se a alteração falhar no meio: memória e storage nunca divergem.
    localStorage.setItem(storageKey, JSON.stringify(state))
    publishPendingChanges()
  }
}

/** Descarta a cópia em memória: a próxima leitura vem do storage, com o que outra aba gravou. */
export function reloadDb(): void {
  cache = null
}

export function resetDb(): void {
  cache = buildSeed()
  localStorage.setItem(storageKey, JSON.stringify(cache))
}

export function nextId(state: DbState, prefix: string): string {
  state.sequence += 1
  return `${prefix}_${state.sequence}`
}
