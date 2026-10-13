import { Link } from '@tanstack/react-router'
import { NftImage } from '@/features/catalog/components/nft-image'
import type { NftSummary } from '@/features/catalog/schemas'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { formatEth } from '@/shared/lib/money'
import { Skeleton } from '@/shared/ui/skeleton'

const cardImageSizes = '(min-width: 1280px) 258px, (min-width: 768px) 30vw, 42vw'

export function NftCard({ nft, priority = false }: { nft: NftSummary; priority?: boolean }) {
  return (
    <article className="relative max-md:even:mt-5">
      <FavoriteButton
        nftId={nft.id}
        nftName={nft.name}
        variant="icon"
        className="absolute top-2 right-2 z-10"
      />
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="group block rounded-sm">
        <div className="bg-card relative flex aspect-[258/300] items-center justify-center overflow-hidden rounded-[20px] p-1 md:rounded-none">
          <NftImage
            image={nft.image}
            sizes={cardImageSizes}
            priority={priority}
            className="w-full rounded-2xl transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
          {nft.rarity === 'rare' && (
            <span className="bg-primary text-primary-foreground absolute top-3 left-0 px-3 py-1 text-xs font-bold tracking-wide">
              RARO
            </span>
          )}
          {nft.soldOut && (
            <span className="bg-ink/85 text-foreground absolute inset-x-0 bottom-0 py-2 text-center text-xs font-bold tracking-wide uppercase">
              Esgotado
            </span>
          )}
        </div>
        <h3 className="group-hover:text-primary-light mt-3 min-h-12 text-base transition-colors md:min-h-6 md:truncate">{nft.name}</h3>
      </Link>
      <p className="text-text-accent mt-0.5 flex h-[25.5px] items-baseline gap-x-2 overflow-hidden text-[17px] font-bold whitespace-nowrap">
        {formatEth(nft.price)}
        {nft.previousPrice && (
          <>
            <span className="sr-only">Preço anterior:</span>
            <del className="text-brand-secondary text-sm font-normal md:text-[17px]">{formatEth(nft.previousPrice)}</del>
          </>
        )}
      </p>
    </article>
  )
}

/** Mesmas dimensões do card real, para a grade não se mexer quando os dados chegam. */
export function NftCardSkeleton() {
  return (
    <div className="max-md:even:mt-5">
      <Skeleton className="aspect-[258/300] w-full rounded-[20px] md:rounded-none" />
      <Skeleton className="mt-3 h-12 w-3/4 md:h-6" />
      <Skeleton className="mt-0.5 h-[25.5px] w-1/3" />
    </div>
  )
}
