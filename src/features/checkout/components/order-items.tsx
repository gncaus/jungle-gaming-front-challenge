import { NftImage } from '@/features/catalog/components/nft-image'
import type { QuoteItem } from '@/features/checkout/schemas'
import { formatEth } from '@/shared/lib/money'

/** Itens de uma cotação ou de um recibo: arte, nome, token, edição, quantidade e total da linha. */
export function OrderItems({ items }: { items: QuoteItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={`${item.nftId}:${item.editionId}`}
          className="bg-card flex items-center gap-3 py-1 pr-3 md:py-0"
          data-testid="order-item"
        >
          <NftImage image={{ ...item.image, alt: '' }} sizes="70px" className="size-[70px] shrink-0 rounded-md" />
          <div className="min-w-0 flex-1">
            <p className="text-base leading-5 font-bold">{item.name}</p>
            <p className="text-text-secondary text-[13px] leading-[18px]">ID do token: {item.tokenId}</p>
            <p className="text-text-secondary text-[13px] leading-[18px]">Edição: {item.editionLabel}</p>
          </div>
          <p className="text-text-secondary shrink-0 text-sm">
            <span aria-hidden="true">(x {item.quantity})</span>
            <span className="sr-only">Quantidade: {item.quantity}</span>
          </p>
          <p className="text-text-accent shrink-0 text-base font-bold">{formatEth(item.lineTotal)}</p>
        </li>
      ))}
    </ul>
  )
}
