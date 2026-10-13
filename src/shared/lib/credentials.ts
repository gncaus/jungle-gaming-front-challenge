/**
 * Credenciais guardadas no navegador: o token da sessão e a identidade do visitante.
 * É o único lugar que lê e grava essas chaves; logout e expiração passam por aqui.
 *
 * Limitação: em produção o token ficaria em um cookie HttpOnly, fora do alcance de scripts.
 * A API simulada roda em um service worker, que não consegue emitir esse tipo de cookie.
 */
const tokenKey = 'kurio.session.token'
const guestKey = 'kurio.guest.id'

type Listener = () => void
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach((listener) => listener())
}

// Login ou logout feitos em outra aba valem para esta também.
window.addEventListener('storage', (event) => {
  if (event.key === tokenKey || event.key === null) notify()
})

export function getToken(): string | null {
  return localStorage.getItem(tokenKey)
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(tokenKey, token)
  } else {
    localStorage.removeItem(tokenKey)
  }
  notify()
}

/** Para `useSyncExternalStore`: avisa quando o token muda, nesta aba ou em outra. */
export function subscribeToToken(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Identifica o visitante para o carrinho, enquanto não há sessão. */
export function getGuestId(): string {
  const stored = localStorage.getItem(guestKey)
  if (stored) return stored
  return renewGuestId()
}

/** Troca a identidade do visitante. Usado no logout, para o carrinho anterior não reaparecer. */
export function renewGuestId(): string {
  const guestId = crypto.randomUUID()
  localStorage.setItem(guestKey, guestId)
  return guestId
}
