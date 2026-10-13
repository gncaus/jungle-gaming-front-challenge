import { walletsSchema, type WalletInput, type Wallets, type WalletSlot } from '@/features/wallets/schemas'
import { http } from '@/shared/lib/http'

export async function fetchWallets(signal?: AbortSignal): Promise<Wallets> {
  const { data } = await http.get<unknown>('/wallets', { signal })
  return walletsSchema.parse(data)
}

export async function saveWallet(slot: WalletSlot, input: WalletInput): Promise<Wallets> {
  const { data } = await http.put<unknown>(`/wallets/${slot}`, input)
  return walletsSchema.parse(data)
}

/** Pede a conexão à carteira. Na simulação, ela pode aceitar ou recusar. */
export async function connectWallet(slot: WalletSlot): Promise<Wallets> {
  const { data } = await http.post<unknown>(`/wallets/${slot}/connect`)
  return walletsSchema.parse(data)
}

export async function disconnectWallet(slot: WalletSlot): Promise<Wallets> {
  const { data } = await http.post<unknown>(`/wallets/${slot}/disconnect`)
  return walletsSchema.parse(data)
}
