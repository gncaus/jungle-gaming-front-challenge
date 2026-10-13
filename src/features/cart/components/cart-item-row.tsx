import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { NftImage } from '@/features/catalog/components/nft-image'
import { useRemoveCartItem, useUpdateCartItem } from '@/features/cart/hooks/use-cart'
import type { CartItem } from '@/features/cart/schemas'
import { announce } from '@/shared/lib/announce'
import { formatEth } from '@/shared/lib/money'
import { QuantityStepper } from '@/shared/ui/quantity-stepper'
import { Skeleton } from '@/shared/ui/skeleton'

/** Mesma grade do cabeçalho da tabela em telas largas; no mobile, um card por item. */
export const cartRowGrid =
  'md:grid md:grid-cols-[minmax(0,1fr)_110px_120px_110px_44px] md:items-center md:gap-0 xl:grid-cols-[311px_139px_136px_152px_44px]'

interface CartItemRowProps {
  item: CartItem
  /** Aviso de mudança de preço ou disponibilidade vinda do catálogo. */
  notice?: string
}

export function CartItemRow({ item, notice }: CartItemRowProps) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const busy = update.isPending || remove.isPending
  const overStock = item.status === 'insufficient-stock'

  function setQuantity(quantity: number) {
    update.mutate({ itemId: item.id, quantity })
  }

  function removeItem() {
    remove.mutate(item.id, { onSuccess: () => announce(`${item.name} removido do carrinho.`) })
  }

  return (
    <li className="bg-card overflow-hidden rounded-xl md:rounded-none" data-testid="cart-item">
      <div className={`flex gap-1 ${cartRowGrid}`}>
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Link to="/nft/$nftId" params={{ nftId: item.nftId }} search={{ edicao: item.editionId }} className="shrink-0">
            <NftImage
              image={{ ...item.image, alt: '' }}
              sizes="100px"
              className="size-[100px] md:size-[70px] md:rounded-sm"
            />
            <span className="sr-only">Ver {item.name}</span>
          </Link>
          <div className="min-w-0 py-2 md:py-0">
            <h3 className="text-base leading-5 font-bold md:truncate">{item.name}</h3>
            <p className="text-text-secondary hidden text-[13px] leading-[18px] md:block">ID do token: {item.tokenId}</p>
            <p className="text-text-secondary text-[13px] leading-[18px]">Edição: {item.editionLabel}</p>
            <p className="text-text-accent mt-1 text-lg font-bold md:hidden">
              <span className="sr-only">Total do item: </span>
              {formatEth(item.lineTotal)}
            </p>
          </div>
        </div>

        <p className="text-text-secondary hidden text-base font-bold md:block">
          <span className="sr-only">Preço unitário: </span>
          {formatEth(item.unitPrice)}
        </p>

        {/* No mobile, quantidade e remover ficam empilhados à direita; em telas largas cada um
            ocupa a sua coluna da tabela, e `order` os põe em volta do total. */}
        <div className="flex shrink-0 flex-col items-end justify-center gap-1 pr-2 md:contents">
          <QuantityStepper
            size="sm"
            value={item.quantity}
            max={item.maxQuantity}
            onChange={setQuantity}
            label={`Quantidade de ${item.name}`}
            disabled={busy}
          />
          <button
            type="button"
            onClick={removeItem}
            disabled={busy}
            aria-label={`Remover ${item.name} do carrinho`}
            className="text-brand-secondary hover:text-primary flex size-9 shrink-0 items-center justify-center rounded-sm transition-colors disabled:opacity-40 md:order-5 md:size-11"
          >
            <Trash2 className="size-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-text-accent hidden text-base font-bold md:order-4 md:block">
          <span className="sr-only">Total do item: </span>
          {formatEth(item.lineTotal)}
        </p>

      </div>

      {(overStock || notice) && (
        <div className="border-t px-3 py-2 text-sm md:px-4">
          {notice && <p className="text-text-accent">{notice}</p>}
          {overStock && (
            <p className="text-text-coral flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                <span className="font-bold">Quantidade indisponível.</span>{' '}
                {item.maxQuantity === 0
                  ? 'Esta edição esgotou: remova o item para continuar.'
                  : `Só é possível levar ${item.maxQuantity}.`}
              </span>
              {item.maxQuantity > 0 && (
                <button
                  type="button"
                  onClick={() => setQuantity(item.maxQuantity)}
                  disabled={busy}
                  className="text-text-accent hover:text-primary-light rounded-sm font-bold underline underline-offset-4 disabled:opacity-40"
                >
                  Ajustar para {item.maxQuantity}
                </button>
              )}
            </p>
          )}
        </div>
      )}
    </li>
  )
}

export function CartItemRowSkeleton() {
  return <Skeleton className="h-[100px] w-full rounded-xl md:h-[70px] md:rounded-none" />
}
