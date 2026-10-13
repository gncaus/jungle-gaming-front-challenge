import type { PasswordRecord } from '@/mocks/db/types'

const iterations = 100_000

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

async function derive(password: string, salt: string, rounds: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(salt), iterations: rounds },
    key,
    256,
  )
  return toHex(new Uint8Array(bits))
}

export async function hashPassword(password: string): Promise<PasswordRecord> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
  return { salt, hash: await derive(password, salt, iterations), iterations }
}

export async function verifyPassword(password: string, record: PasswordRecord): Promise<boolean> {
  return (await derive(password, record.salt, record.iterations)) === record.hash
}
