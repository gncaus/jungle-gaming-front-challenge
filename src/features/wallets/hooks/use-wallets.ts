import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import {
  connectWallet,
  disconnectWallet,
  fetchWallets,
  saveWallet,
} from '@/features/wallets/api/wallets-api'
import type { WalletInput, Wallets, WalletSlot } from '@/features/wallets/schemas'
import { privateKey } from '@/shared/lib/query-keys'

export const walletKeys = {
  list: (userId: string) => privateKey(userId, 'wallets'),
}

export function useWallets() {
  const { user } = useSession()
  return useQuery({
    queryKey: walletKeys.list(user?.id ?? ''),
    queryFn: ({ signal }) => fetchWallets(signal),
    enabled: user !== null,
  })
}

/** Toda mutation de carteira responde com as duas carteiras, e a resposta vai direto para o cache. */
function useWalletMutation<Input>(mutationFn: (input: Input) => Promise<Wallets>) {
  const queryClient = useQueryClient()
  const { user } = useSession()

  return useMutation({
    mutationFn,
    onSuccess: (wallets) => {
      if (user) queryClient.setQueryData(walletKeys.list(user.id), wallets)
    },
  })
}

export function useSaveWallet() {
  return useWalletMutation(({ slot, input }: { slot: WalletSlot; input: WalletInput }) => saveWallet(slot, input))
}

export function useConnectWallet() {
  return useWalletMutation((slot: WalletSlot) => connectWallet(slot))
}

export function useDisconnectWallet() {
  return useWalletMutation((slot: WalletSlot) => disconnectWallet(slot))
}
