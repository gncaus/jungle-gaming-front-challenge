/** FNV-1a de 32 bits: basta para identificar se dois conjuntos de valores são iguais. */
export function fingerprint(value: unknown): string {
  let hash = 0x811c9dc5
  for (const char of JSON.stringify(value)) {
    hash ^= char.codePointAt(0) ?? 0
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/** Sequência hexadecimal determinística derivada de uma semente (ex.: hash de transação simulado). */
export function hexFrom(seed: string, length: number): string {
  let hex = ''
  for (let block = 0; hex.length < length; block += 1) {
    hex += fingerprint(`${seed}:${block}`)
  }
  return hex.slice(0, length)
}
