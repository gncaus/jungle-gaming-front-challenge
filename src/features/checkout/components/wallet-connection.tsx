import { Wallet as WalletIcon } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { useConnectWallet, useDisconnectWallet } from '@/features/wallets/hooks/use-wallets'
import { providerNames } from '@/features/wallets/labels'
import type { Wallet, WalletProvider, WalletSlot } from '@/features/wallets/schemas'
import { announce } from '@/shared/lib/announce'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

/** Ordem das opções no layout. */
const providerOrder: WalletProvider[] = ['walletconnect', 'metamask', 'coinbase']

/** Marca de cada carteira, como nos círculos do layout mobile. */
const providerMarks: Record<WalletProvider, ReactNode> = {
  walletconnect: 'W',
  metamask: 'M',
  coinbase: <WalletIcon className="size-5" aria-hidden="true" />,
}

interface WalletConnectionProps {
  /** Lugar da carteira escolhida para o pagamento. */
  slot: WalletSlot
  /** Carteira cadastrada nesse lugar, ou `null`. */
  wallet: Wallet | null
  /** Tipo de carteira escolhido no formulário (pode ainda não estar salvo). */
  provider: WalletProvider | undefined
  onProviderChange: (provider: WalletProvider) => void
  /**
   * Há dados novos ou alterados no formulário: conectar salva antes. Devolve `false` se o
   * formulário tiver erros ou a API recusar.
   */
  saveFirst: (() => Promise<boolean>) | null
  className?: string
}

/**
 * "Carteira e rede": o tipo de carteira e a conexão simulada com ela (conectar, recusa da
 * carteira e desconectar). O pedido só pode ser confirmado com a carteira conectada.
 */
export function WalletConnection({ slot, wallet, provider, onProviderChange, saveFirst, className }: WalletConnectionProps) {
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const [failure, setFailure] = useState('')
  const [saving, setSaving] = useState(false)
  const titleId = useId()

  const connected = Boolean(wallet && wallet.connection === 'connected' && !saveFirst)
  const busy = saving || connect.isPending || disconnect.isPending

  async function toggle() {
    setFailure('')
    if (connected && wallet) {
      disconnect.mutate(wallet.slot, {
        onSuccess: () => announce('Carteira desconectada.'),
        onError: (error) => setFailure(error.message),
      })
      return
    }
    if (saveFirst) {
      setSaving(true)
      const saved = await saveFirst()
      setSaving(false)
      if (!saved) return
    }
    connect.mutate(slot, {
      onSuccess: () => announce('Carteira conectada.'),
      onError: (error) => setFailure(error.message),
    })
  }

  return (
    <section aria-labelledby={titleId} className={cn('flex flex-col gap-3', className)}>
      <h2 id={titleId} className="text-lg font-bold md:text-center">
        Carteira e rede
      </h2>
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Tipo de carteira para o pagamento</legend>
        {providerOrder.map((id) => {
          const checked = provider === id
          return (
            <label
              key={id}
              className={cn(
                'bg-card has-focus-visible:outline-ring flex min-h-16 cursor-pointer items-center gap-4 rounded-[20px] border px-4 py-3 transition-colors has-focus-visible:outline-2 md:min-h-12.5 md:rounded-sm md:bg-transparent md:py-2',
                checked ? 'border-primary md:border-primary' : 'border-transparent md:border-border',
              )}
            >
              <span
                aria-hidden="true"
                className="bg-surface-raised text-text-accent flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold md:hidden"
              >
                {providerMarks[id]}
              </span>
              <input
                type="radio"
                name="checkout-provider"
                value={id}
                checked={checked}
                onChange={() => onProviderChange(id)}
                className="accent-primary order-last ml-auto size-5 md:order-first md:ml-0"
              />
              <span className="text-[15px]">{providerNames[id]}</span>
            </label>
          )
        })}
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-text-secondary text-sm" data-testid="wallet-connection-state">
          {saving ? 'Salvando a carteira…' : connect.isPending ? 'Aguardando a carteira…' : connected ? 'Carteira conectada' : 'Carteira desconectada'}
        </p>
        <Button variant={connected ? 'outline' : 'default'} size="sm" onClick={() => void toggle()} disabled={busy}>
          {connected ? 'Desconectar' : 'Conectar carteira'}
        </Button>
      </div>
      <p role="alert" className="text-text-coral text-sm empty:hidden">
        {failure}
      </p>
    </section>
  )
}
