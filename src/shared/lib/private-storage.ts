/**
 * Dados do usuário guardados no navegador além do token (hoje, a tentativa de compra em
 * andamento). Tudo fica sob um prefixo e sob o id do dono, e é apagado quando a sessão
 * muda, para nada de um usuário sobrar para o seguinte.
 */
const prefix = 'kurio.private.'

function storageKey(userId: string, name: string): string {
  return `${prefix}${userId}.${name}`
}

export function readPrivate<Value>(userId: string, name: string): Value | null {
  const raw = localStorage.getItem(storageKey(userId, name))
  return raw ? (JSON.parse(raw) as Value) : null
}

export function writePrivate(userId: string, name: string, value: unknown): void {
  localStorage.setItem(storageKey(userId, name), JSON.stringify(value))
}

export function removePrivate(userId: string, name: string): void {
  localStorage.removeItem(storageKey(userId, name))
}

/** Apaga o que foi guardado por qualquer usuário neste navegador. */
export function clearPrivateStorage(): void {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(prefix)) localStorage.removeItem(key)
  }
}
