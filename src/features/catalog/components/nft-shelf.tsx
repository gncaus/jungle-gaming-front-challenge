import { useQuery } from '@tanstack/react-query'
import { useId } from 'react'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { nftListQueryOptions } from '@/features/catalog/hooks/queries'
import type { NftListQuery } from '@/features/catalog/schemas'

const visibleCards = 5

interface NftShelfProps {
  title: string
  /** Recorte do catálogo a mostrar (coleção, aba…). */
  filter: Partial<Pick<NftListQuery, 'collection' | 'tab' | 'sort'>>
  /** NFTs que não devem aparecer, como o que está aberto ou os que já estão no carrinho. */
  excludeIds: string[]
}

/** Fileira de sugestões ("Mais desta coleção", "Colecionadores também viram"). */
export function NftShelf({ title, filter, excludeIds }: NftShelfProps) {
  const titleId = useId()
  const query: NftListQuery = {
    q: '',
    collection: [],
    network: [],
    tab: 'all',
    sort: 'recent',
    page: 1,
    // Sobra para compensar os que forem retirados da lista.
    pageSize: visibleCards + excludeIds.length,
    ...filter,
  }
  const { data, isPending, isError } = useQuery(nftListQueryOptions(query))
  const items = (data?.items ?? []).filter((item) => !excludeIds.includes(item.id)).slice(0, visibleCards)

  // É um complemento da página: se falhar ou não houver o que sugerir, a seção não aparece.
  if (isError || (!isPending && items.length === 0)) return null

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="text-text-accent border-b pb-3 text-base font-bold">
        {title}
      </h2>
      <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-5 xl:gap-x-[25px]">
        {isPending
          ? Array.from({ length: visibleCards }, (_, index) => <NftCardSkeleton key={index} />)
          : items.map((item) => <NftCard key={item.id} nft={item} />)}
      </div>
    </section>
  )
}
