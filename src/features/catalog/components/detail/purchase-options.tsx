import type { ReactNode } from 'react'
import { EditionPicker } from '@/features/catalog/components/detail/edition-picker'
import { maxQuantityOf } from '@/features/catalog/components/detail/edition-selection'
import type { NftDetail, NftEdition } from '@/features/catalog/schemas'
import { formatEth } from '@/shared/lib/money'
import { QuantityStepper } from '@/shared/ui/quantity-stepper'

interface PurchaseOptionsProps {
  nft: NftDetail
  edition: NftEdition
  /** Quantidade escolhida pelo usuário; pode estar acima do máximo se o estoque caiu depois. */
  quantity: number
  onEditionChange: (editionId: string) => void
  onQuantityChange: (quantity: number) => void
  /** Ações da linha da quantidade em telas largas (favoritar e, adiante, comprar). */
  actions?: ReactNode
}

/** Explica por que a quantidade não pode subir, ou por que a edição não pode ser comprada. */
function availabilityMessage(edition: NftEdition, chosen: number): string | null {
  const max = maxQuantityOf(edition)
  if (edition.available === 0) {
    return `A edição ${edition.label} está esgotada. Escolha outra edição.`
  }
  if (chosen > max) {
    return `A disponibilidade mudou: agora é possível levar no máximo ${max}.`
  }
  if (chosen === max) {
    return edition.available < edition.maxPerOrder
      ? `Restam ${edition.available} ${edition.available === 1 ? 'unidade' : 'unidades'} desta edição.`
      : `Limite de ${edition.maxPerOrder} por pedido nesta edição.`
  }
  return null
}

/** Escolha de edição e quantidade do detalhe. O preço exibido é o da edição selecionada. */
export function PurchaseOptions({
  nft,
  edition,
  quantity,
  onEditionChange,
  onQuantityChange,
  actions,
}: PurchaseOptionsProps) {
  const max = maxQuantityOf(edition)
  const message = availabilityMessage(edition, quantity)

  return (
    <div className="flex flex-col gap-4">
      <EditionPicker
        editions={nft.editions}
        selectedId={edition.id}
        onSelect={onEditionChange}
        name={`edition-${nft.id}`}
      />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <QuantityStepper
          value={Math.max(1, Math.min(quantity, max))}
          max={max}
          onChange={onQuantityChange}
          label={`Quantidade de ${nft.name}`}
        />
        {/* No mobile o preço fica ao lado da quantidade; em telas largas, sob o título. */}
        <p className="text-text-accent ml-auto text-[22px] font-bold md:hidden" data-testid="edition-price">
          <span className="sr-only">Preço da edição {edition.label}: </span>
          {formatEth(edition.price)}
        </p>
        {actions && <div className="ml-auto hidden gap-2 md:flex">{actions}</div>}
      </div>
      <p role="status" className="text-text-accent min-h-5 text-sm">
        {message}
      </p>
    </div>
  )
}
