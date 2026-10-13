import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { NftImage } from '@/features/catalog/components/nft-image'
import { nftHighlightsQueryOptions } from '@/features/catalog/hooks/queries'
import { formatEth } from '@/shared/lib/money'
import { Skeleton } from '@/shared/ui/skeleton'

/** Cartão "NFT em destaque — oferta limitada" da lateral do catálogo. */
export function LimitedOffer() {
  const { data, isPending } = useQuery(nftHighlightsQueryOptions)
  const nft = data?.limitedOffer

  if (!isPending && !nft) return null

  return (
    <aside aria-labelledby="limited-offer-title" className="bg-surface-raised pt-7">
      <h2 id="limited-offer-title" className="px-5">
        <span className="text-primary block text-2xl font-bold uppercase">NFT em destaque</span>
        <span className="mt-2 block text-center text-xl font-bold uppercase">Oferta limitada</span>
      </h2>
      {nft ? (
        <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="group mt-3 block overflow-hidden rounded-3xl">
          <NftImage
            image={nft.image}
            sizes="310px"
            className="w-full transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
          <span className="sr-only">
            {nft.name}, por {formatEth(nft.price)}
            {nft.previousPrice && `, antes ${formatEth(nft.previousPrice)}`}
          </span>
        </Link>
      ) : (
        <Skeleton className="mt-3 aspect-square w-full rounded-3xl" />
      )}
    </aside>
  )
}
