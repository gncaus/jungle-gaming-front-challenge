import { Link } from '@tanstack/react-router'
import { EllipsisVertical } from 'lucide-react'
import { networkNames } from '@/features/catalog/labels'
import { shortHash, slotNames } from '@/features/wallets/labels'
import { walletSlots, type Wallets, type WalletSlot } from '@/features/wallets/schemas'
import { cn } from '@/shared/lib/utils'

interface WalletPickerProps {
  wallets: Wallets
  selected: WalletSlot
  onSelect: (slot: WalletSlot) => void
  /** Lugar cujo formulário está aberto para edição. */
  editing: WalletSlot | null
  onEdit: (slot: WalletSlot) => void
  className?: string
}

/**
 * Escolha da carteira no mobile, como no layout: um cartão por carteira, com o menu para
 * editar os dados. Em telas largas a escolha é "Usar outra carteira?", no formulário.
 */
export function WalletPicker({ wallets, selected, onSelect, editing, onEdit, className }: WalletPickerProps) {
  const selectedWallet = wallets[selected]
  const connected = selectedWallet?.connection === 'connected'

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="wallet-picker-title" className="text-base font-bold">
          {connected ? 'Carteira conectada' : 'Carteira'}
        </h2>
        <Link
          to="/perfil/carteiras"
          className="text-text-accent hover:text-primary-light rounded-sm text-base font-bold transition-colors"
        >
          Trocar carteira
        </Link>
      </div>
      <fieldset aria-labelledby="wallet-picker-title" className="mt-4 flex flex-col gap-4">
        {walletSlots.map((slot) => {
          const wallet = wallets[slot]
          const checked = slot === selected
          return (
            <div key={slot} className="bg-card relative flex items-center gap-4 rounded-[20px] py-4 pr-2 pl-5">
              <input
                id={`wallet-slot-${slot}`}
                type="radio"
                name="wallet-slot"
                value={slot}
                checked={checked}
                onChange={() => onSelect(slot)}
                className="accent-primary size-5 shrink-0"
              />
              <label htmlFor={`wallet-slot-${slot}`} className="min-w-0 flex-1 cursor-pointer">
                <span className="block text-base font-bold">{wallet ? wallet.nickname : slotNames[slot]}</span>
                {wallet ? (
                  <>
                    <span className="text-text-secondary block text-sm">{shortHash(wallet.address)}</span>
                    <span className="text-text-secondary block text-sm">Rede {networkNames[wallet.network]}</span>
                  </>
                ) : (
                  <span className="text-text-secondary block text-sm">
                    Carteira {slotNames[slot].toLowerCase()} ainda não cadastrada
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={() => onEdit(slot)}
                aria-expanded={editing === slot}
                aria-label={`${wallet ? 'Editar' : 'Cadastrar'} carteira ${slotNames[slot].toLowerCase()}`}
                className={cn(
                  'hover:text-primary-light flex size-11 shrink-0 items-center justify-center rounded-full transition-colors',
                  editing === slot ? 'text-primary' : 'text-text-accent',
                )}
              >
                <EllipsisVertical className="size-5" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </fieldset>
    </div>
  )
}
