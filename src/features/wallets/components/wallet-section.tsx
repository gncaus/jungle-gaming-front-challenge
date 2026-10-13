import { useRef, useState } from 'react'
import { networkNames } from '@/features/catalog/labels'
import { WalletForm } from '@/features/wallets/components/wallet-form'
import { providerNames, shortHash, slotNames } from '@/features/wallets/labels'
import { walletInputSchema, type Wallet, type WalletInput, type WalletSlot } from '@/features/wallets/schemas'

interface WalletSectionProps {
  slot: WalletSlot
  wallet: Wallet | null
  /** Valores sugeridos para um cadastro novo, vindos do perfil. */
  suggestions: Partial<WalletInput>
  /** Carteira que pode ser copiada para este cadastro ("Igual à carteira principal"). */
  copyFrom?: Wallet | null
}

/** Uma das carteiras do colecionador: resumo do que está salvo e formulário de cadastro ou edição. */
export function WalletSection({ slot, wallet, suggestions, copyFrom = null }: WalletSectionProps) {
  // Sem carteira principal, o formulário já começa aberto, como no layout.
  const [open, setOpen] = useState(slot === 'primary' && !wallet)
  const [copying, setCopying] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const titleId = `wallet-${slot}-title`
  const name = `Carteira ${slotNames[slot].toLowerCase()}`
  const canCopy = !wallet && copyFrom !== null

  return (
    <section aria-labelledby={titleId}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id={titleId} className="text-base font-bold">
          {name}
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {canCopy && (
            <label className="flex min-h-6 cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={copying}
                onChange={(event) => setCopying(event.target.checked)}
                className="accent-primary size-4"
              />
              Igual à carteira principal
            </label>
          )}
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label={`${open ? 'Fechar' : wallet ? 'Editar' : 'Adicionar'} ${name.toLowerCase()}`}
            className="text-text-accent hover:text-primary-light rounded-sm text-base font-bold transition-colors"
          >
            {open ? 'Fechar' : wallet ? 'Editar' : 'Adicionar'}
          </button>
        </div>
      </div>

      {!open && !wallet && (
        <p className="text-text-secondary mt-2 text-sm">Você ainda não adicionou uma {name.toLowerCase()}.</p>
      )}

      {!open && wallet && (
        <dl className="bg-card mt-4 grid gap-x-6 gap-y-2 rounded-sm border p-4 text-sm sm:grid-cols-[160px_1fr]">
          <dt className="text-text-secondary">Apelido</dt>
          <dd>{wallet.nickname}</dd>
          <dt className="text-text-secondary">Rede</dt>
          <dd>{networkNames[wallet.network]}</dd>
          <dt className="text-text-secondary">Endereço</dt>
          <dd title={wallet.address}>{shortHash(wallet.address)}</dd>
          <dt className="text-text-secondary">Tipo de carteira</dt>
          <dd>{providerNames[wallet.provider]}</dd>
          <dt className="text-text-secondary">Conexão</dt>
          <dd>{wallet.connection === 'connected' ? 'Conectada' : 'Desconectada'}</dd>
        </dl>
      )}

      {open && (
        <div className="mt-4">
          <WalletForm
            // Marcar a cópia, ou salvar, recomeça o formulário com os dados correspondentes.
            key={`${wallet?.updatedAt ?? 'new'}:${copying}`}
            slot={slot}
            wallet={wallet}
            // O schema de entrada deixa passar só os campos do formulário.
            suggestions={canCopy && copying ? walletInputSchema.parse(copyFrom) : suggestions}
            onSaved={() => {
              setOpen(false)
              toggleRef.current?.focus()
            }}
          />
        </div>
      )}
    </section>
  )
}
