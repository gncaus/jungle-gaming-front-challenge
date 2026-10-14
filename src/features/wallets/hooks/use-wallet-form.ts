import { useForm, type DefaultValues, type UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import { walletInputSchema, type Wallet, type WalletInput } from '@/features/wallets/schemas'
import { zodResolver } from '@/shared/lib/zod-resolver'

export type WalletValues = z.output<typeof walletInputSchema>
export type WalletFormApi = UseFormReturn<WalletInput, unknown, WalletValues>

/** Valores iniciais: os da carteira cadastrada ou, para um cadastro novo, as sugestões. */
export function walletDefaults(wallet: Wallet | null, suggestions?: Partial<WalletInput>): DefaultValues<WalletInput> {
  return (
    wallet ?? {
      displayName: '',
      nickname: '',
      profileName: '',
      address: '',
      secondaryAddress: '',
      referralCode: '',
      email: '',
      ensName: '',
      ...suggestions,
    }
  )
}

/** Formulário de carteira com as regras do contrato da API. */
export function useWalletForm(wallet: Wallet | null, suggestions?: Partial<WalletInput>): WalletFormApi {
  return useForm<WalletInput, unknown, WalletValues>({
    resolver: zodResolver(walletInputSchema),
    defaultValues: walletDefaults(wallet, suggestions),
  })
}
