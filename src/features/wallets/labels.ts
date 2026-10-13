import type { WalletProvider, WalletSlot } from '@/features/wallets/schemas'

export const providerNames: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

export const slotNames: Record<WalletSlot, string> = {
  primary: 'Principal',
  secondary: 'Secundária',
}

/** `0x7A42c0ff…19E8` vira `0x7A42…19E8`, como o layout mostra endereços e hashes. */
export function shortHash(value: string): string {
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value
}
