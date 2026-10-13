export interface Announcement {
  id: number
  message: string
  tone: 'info' | 'error'
}

const visibleForMs = 6000

let current: Announcement | null = null
let sequence = 0
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function emit(next: Announcement | null): void {
  current = next
  listeners.forEach((listener) => listener())
}

/**
 * Avisa o usuário do resultado de uma ação ou de uma mudança em tempo real.
 * A mensagem aparece na tela e é lida por leitores de tela (ver `Announcer`);
 * some sozinha depois de alguns segundos.
 */
export function announce(message: string, tone: Announcement['tone'] = 'info'): void {
  sequence += 1
  clearTimeout(timer)
  emit({ id: sequence, message, tone })
  timer = setTimeout(() => emit(null), visibleForMs)
}

export function subscribeToAnnouncements(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function currentAnnouncement(): Announcement | null {
  return current
}
