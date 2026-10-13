import { useSyncExternalStore } from 'react'

let connected = false
const listeners = new Set<() => void>()

/** Chamado por quem mantém a conexão de socket, a cada mudança de estado. */
export function setRealtimeConnected(next: boolean): void {
  if (next === connected) return
  connected = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Diz se a conexão de tempo real está ativa. Telas que dependem de eventos usam isto para
 * recorrer à API REST enquanto o socket está fora do ar.
 */
export function useRealtimeConnected(): boolean {
  return useSyncExternalStore(subscribe, () => connected)
}
