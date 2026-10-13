import { useQuery } from '@tanstack/react-query'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { nftListQueryOptions } from '@/features/catalog/hooks/queries'
import type { NftDetail, NftListQuery } from '@/features/catalog/schemas'

const visibleCards = 5

/** "Mais desta coleção": outros NFTs da mesma coleção, sem o que está aberto. */
export function RelatedNfts({ nft }: { nft: NftDetail }) {
  const query: NftListQuery = {
    q: '',
    collection: [nft.collection.id],
    network: [],
    tab: 'all',
    sort: 'recent',
    page: 1,
    // Um a mais, porque o próprio NFT vem na lista e é retirado.
    pageSize: visibleCards + 1,
  }
  const { data, isPending, isError } = useQuery(nftListQueryOptions(query))
  const related = (data?.items ?? []).filter((item) => item.id !== nft.id).slice(0, visibleCards)

  // É um complemento da página: se falhar ou não houver outros, a seção simplesmente não aparece.
  if (isError || (!isPending && related.length === 0)) return null

  return (
    <section aria-labelledby="related-title">
      <h2 id="related-title" className="text-text-accent border-b pb-3 text-base font-bold">
        Mais desta coleção
      </h2>
      <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-5 xl:gap-x-[25px]">
        {isPending
          ? Array.from({ length: visibleCards }, (_, index) => <NftCardSkeleton key={index} />)
          : related.map((item) => <NftCard key={item.id} nft={item} />)}
      </div>
    </section>
  )
}
