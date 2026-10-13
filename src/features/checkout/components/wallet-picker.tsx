import { networkNames } from '@/features/catalog/labels'
import { providerNames, shortHash, slotNames } from '@/features/wallets/labels'
import { walletSlots, type Wallets, type WalletSlot } from '@/features/wallets/schemas'
import { cn } from '@/shared/lib/utils'

interface WalletPickerProps {
  wallets: Wallets
  selected: WalletSlot
  onSelect: (slot: WalletSlot) => void
}

/** Escolha entre a carteira principal e a secundária para receber os NFTs e pagar. */
export function WalletPicker({ wallets, selected, onSelect }: WalletPickerProps) {
  return (
    <fieldset>
      <legend className="text-lg font-bold">Carteira</legend>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {walletSlots.map((slot) => {
          const wallet = wallets[slot]
          const checked = slot === selected
          return (
            <label
              key={slot}
              className={cn(
                'bg-card has-focus-visible:outline-ring relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-focus-visible:outline-2 md:rounded-sm',
                checked ? 'border-primary' : 'hover:border-border-soft border-transparent',
              )}
            >
              <input
                type="radio"
                name="wallet-slot"
                value={slot}
                checked={checked}
                onChange={() => onSelect(slot)}
                className="accent-primary mt-1 size-4"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold">
                  {slotNames[slot]}
                  {wallet && `: ${wallet.nickname}`}
                </span>
                {wallet ? (
                  <>
                    <span className="text-text-secondary block text-sm">{shortHash(wallet.address)}</span>
                    <span className="text-text-secondary block text-sm">
                      {providerNames[wallet.provider]} · Rede {networkNames[wallet.network]}
                    </span>
                    <span className={cn('block text-sm', wallet.connection === 'connected' ? 'text-success' : 'text-text-secondary')}>
                      {wallet.connection === 'connected' ? 'Conectada' : 'Desconectada'}
                    </span>
                  </>
                ) : (
                  <span className="text-text-secondary block text-sm">Ainda não cadastrada</span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
