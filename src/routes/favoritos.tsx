import { createFileRoute, Link } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/search'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { useFavoriteNfts, useFavorites } from '@/features/favorites/hooks/use-favorites'
import { Button } from '@/shared/ui/button'

export const Route = createFileRoute('/favoritos')({
  staticData: { requiresAuth: true },
  beforeLoad: requireSession,
  component: FavoritesPage,
})

const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6 xl:gap-x-[34px]'

function FavoritesPage() {
  const favorites = useFavorites()
  const { data, error, isPending, isFetching, refetch } = useFavoriteNfts()
  // A lista de ids muda na hora ao desfavoritar; o card sai da tela sem esperar a nova consulta.
  const ids = favorites.data?.nftIds
  const items = data?.items.filter((nft) => !ids || ids.includes(nft.id)) ?? []

  return (
    <section className="page-container py-6 md:py-10" aria-labelledby="favorites-title">
      <h1 id="favorites-title" className="mb-6 text-lg font-bold md:text-2xl">
        Favoritos
      </h1>

      {isPending && (
        <div aria-busy="true">
          <p role="status" className="sr-only">
            Carregando favoritos…
          </p>
          <div className={gridClass}>
            {Array.from({ length: 4 }, (_, index) => (
              <NftCardSkeleton key={index} />
            ))}
          </div>
        </div>
      )}

      {error && !data && (
        <div role="alert" className="bg-card flex flex-col items-start gap-4 p-8">
          <p className="text-sm">Não foi possível carregar os favoritos. {error.message}</p>
          <Button onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? 'Tentando…' : 'Tentar novamente'}
          </Button>
        </div>
      )}

      {data && items.length === 0 && (
        <div className="bg-card flex flex-col items-start gap-4 p-8">
          <p role="status" className="text-lg font-bold">
            Você ainda não tem favoritos
          </p>
          <p className="text-muted-foreground text-sm">Toque no coração de um NFT para guardá-lo aqui.</p>
          <Button asChild>
            <Link to="/" hash="catalogo">
              Explorar o catálogo
            </Link>
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <>
          <p role="status" className="text-muted-foreground mb-4 text-xs leading-4">
            {items.length === 1 ? '1 NFT favoritado' : `${items.length} NFTs favoritados`}
          </p>
          <div className={gridClass}>
            {items.map((nft, index) => (
              <NftCard key={nft.id} nft={nft} priority={index < 2} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
