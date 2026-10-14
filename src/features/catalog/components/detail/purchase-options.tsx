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

interface MobilePurchaseBarProps {
  nft: NftDetail
  edition: NftEdition
  quantity: number
  onQuantityChange: (quantity: number) => void
  actions: ReactNode
}

/**
 * Rodapé fixo do detalhe no mobile, como no layout: quantidade e preço da edição, e abaixo
 * "Comprar NFT" e o carrinho. Fica preso à base da tela enquanto o detalhe está visível.
 */
export function MobilePurchaseBar({ nft, edition, quantity, onQuantityChange, actions }: MobilePurchaseBarProps) {
  const max = maxQuantityOf(edition)
  return (
    <div className="bg-background sticky bottom-0 z-30 -mx-6 mt-10 flex flex-col gap-4 rounded-t-[28px] px-6 pt-5 pb-6 shadow-[0_-8px_24px_rgb(0_0_0/0.35)] md:hidden">
      <div className="flex items-center gap-3">
        <span className="text-sm" aria-hidden="true">
          Qtd.
        </span>
        <QuantityStepper
          value={Math.max(1, Math.min(quantity, max))}
          max={max}
          onChange={onQuantityChange}
          label={`Quantidade de ${nft.name}`}
        />
        <p className="text-text-accent ml-auto text-[22px] font-bold" data-testid="edition-price">
          <span className="sr-only">Preço da edição {edition.label}: </span>
          {formatEth(edition.price)}
        </p>
      </div>
      <div className="flex items-center gap-3">{actions}</div>
    </div>
  )
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
      {/* No mobile, quantidade, preço e compra ficam na barra fixa do rodapé (MobilePurchaseBar). */}
      <div className="hidden flex-wrap items-center gap-x-6 gap-y-3 md:flex">
        <QuantityStepper
          value={Math.max(1, Math.min(quantity, max))}
          max={max}
          onChange={onQuantityChange}
          label={`Quantidade de ${nft.name}`}
        />
        {actions && <div className="ml-auto flex gap-2">{actions}</div>}
      </div>
      {/* Vazio, o aviso não ocupa espaço (anula o espaçamento da coluna), como no layout. */}
      <p role="status" className="text-text-accent -mt-4 text-sm not-empty:mt-0">
        {message}
      </p>
    </div>
  )
}
