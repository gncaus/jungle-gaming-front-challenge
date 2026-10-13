import { useState } from 'react'
import { networkNames } from '@/features/catalog/labels'
import { useConnectWallet, useDisconnectWallet } from '@/features/wallets/hooks/use-wallets'
import { providerNames, slotNames } from '@/features/wallets/labels'
import type { Wallet } from '@/features/wallets/schemas'
import { announce } from '@/shared/lib/announce'
import { Button } from '@/shared/ui/button'

/**
 * Conexão simulada com a carteira escolhida: conectar (a carteira pode recusar) e
 * desconectar. O pedido só pode ser confirmado com a carteira conectada.
 */
export function WalletConnection({ wallet }: { wallet: Wallet | null }) {
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const [failure, setFailure] = useState('')

  if (!wallet) {
    return (
      <p className="text-text-secondary text-sm">
        Cadastre os dados da carteira para poder conectá-la.
      </p>
    )
  }

  const connected = wallet.connection === 'connected'
  const busy = connect.isPending || disconnect.isPending

  function toggle() {
    if (!wallet) return
    setFailure('')
    if (connected) {
      disconnect.mutate(wallet.slot, {
        onSuccess: () => announce('Carteira desconectada.'),
        onError: (error) => setFailure(error.message),
      })
    } else {
      connect.mutate(wallet.slot, {
        onSuccess: () => announce('Carteira conectada.'),
        onError: (error) => setFailure(error.message),
      })
    }
  }

  return (
    <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 md:rounded-sm">
      <div>
        <p className="text-base font-bold">
          {providerNames[wallet.provider]} · Rede {networkNames[wallet.network]}
        </p>
        <p className="text-text-secondary text-sm">Carteira {slotNames[wallet.slot].toLowerCase()}</p>
        <p role="status" className="mt-1 text-sm" data-testid="wallet-connection-state">
          {connect.isPending ? 'Aguardando a carteira…' : connected ? 'Carteira conectada' : 'Carteira desconectada'}
        </p>
      </div>
      <Button variant={connected ? 'outline' : 'default'} onClick={toggle} disabled={busy} className="self-start">
        {connected ? 'Desconectar' : 'Conectar carteira'}
      </Button>
      <p role="alert" className="text-text-coral text-sm empty:hidden">
        {failure}
      </p>
    </div>
  )
}
