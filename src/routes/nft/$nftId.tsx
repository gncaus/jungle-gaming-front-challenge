import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { maxQuantityOf, resolveEdition } from '@/features/catalog/components/detail/edition-selection'
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button'
import { NftGallery, NftGallerySkeleton } from '@/features/catalog/components/detail/nft-gallery'
import { NftInfoTabs } from '@/features/catalog/components/detail/nft-info-tabs'
import { NftRating } from '@/features/catalog/components/detail/nft-rating'
import { MobilePurchaseBar, PurchaseOptions } from '@/features/catalog/components/detail/purchase-options'
import { NftShelf } from '@/features/catalog/components/nft-shelf'
import { ShareLinks } from '@/features/catalog/components/detail/share-links'
import { nftDetailQueryOptions } from '@/features/catalog/hooks/queries'
import type { NftDetail } from '@/features/catalog/schemas'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { HttpError } from '@/shared/lib/http'
import { formatEth } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export const Route = createFileRoute('/nft/$nftId')({
  // A edição escolhida fica na URL: sobrevive a refresh e pode ser compartilhada.
  validateSearch: z.object({ edicao: z.string().optional().catch(undefined) }),
  component: NftPage,
})

function NftPage() {
  const { nftId } = Route.useParams()
  const { data: nft, error, isPending, refetch } = useQuery(nftDetailQueryOptions(nftId))

  if (isPending) return <NftPageSkeleton />

  if (error) {
    const notFound = error instanceof HttpError && error.status === 404
    return (
      <section role="alert" className="page-container flex flex-col items-start gap-4 py-24">
        <h1 className="text-heading-lg font-bold">
          {notFound ? 'NFT não encontrado' : 'Não foi possível carregar o NFT'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {notFound ? 'Este NFT não existe ou saiu do catálogo.' : error.message}
        </p>
        <div className="flex gap-3">
          {!notFound && <Button onClick={() => void refetch()}>Tentar novamente</Button>}
          <Button asChild variant={notFound ? 'default' : 'outline'}>
            <Link to="/" hash="catalogo">
              Voltar ao catálogo
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  // A chave zera a quantidade escolhida ao navegar de um NFT para outro.
  return <NftView key={nft.id} nft={nft} />
}

function NftView({ nft }: { nft: NftDetail }) {
  const { edicao } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [quantity, setQuantity] = useState(1)
  const edition = resolveEdition(nft, edicao)
  const maxQuantity = maxQuantityOf(edition)
  // O que vai para o carrinho é a quantidade exibida, já limitada ao que há disponível.
  const selection = {
    nftId: nft.id,
    nftName: nft.name,
    editionId: edition.id,
    quantity: Math.max(1, Math.min(quantity, maxQuantity)),
    unavailable: maxQuantity < 1,
  }

  function changeEdition(editionId: string) {
    setQuantity(1)
    void navigate({ search: (previous) => ({ ...previous, edicao: editionId }), replace: true, resetScroll: false })
  }

  return (
    <article className="page-container pb-4">
      <div className="flex items-center justify-between py-4 md:hidden">
        <Link
          to="/"
          hash="catalogo"
          aria-label="Voltar ao catálogo"
          className="bg-card hover:text-primary-light flex size-10 items-center justify-center rounded-full transition-colors"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Link>
        <FavoriteButton nftId={nft.id} nftName={nft.name} variant="icon" className="bg-card" />
      </div>

      <nav aria-label="Trilha" className="hidden pt-[30px] pb-3 text-sm font-bold md:block">
        <ol className="flex gap-2">
          <li>
            <Link to="/" className="hover:text-primary-light transition-colors">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/" hash="catalogo" className="hover:text-primary-light transition-colors">
              Mercado
            </Link>
          </li>
        </ol>
      </nav>

      <div className="grid gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-[572px_minmax(0,1fr)]">
        <NftGallery images={nft.gallery} />

        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold md:text-[28px] md:leading-9">{nft.name}</h1>
            <div className="md:hidden">
              <NftRating rating={nft.rating} compact />
            </div>
          </div>
          <div className="mt-1 hidden items-center justify-between border-b pb-2 md:flex">
            <p className="text-text-accent text-[22px] font-bold" data-testid="edition-price">
              <span className="sr-only">Preço da edição {edition.label}: </span>
              {formatEth(edition.price)}
            </p>
            <NftRating rating={nft.rating} />
          </div>

          <h2 className="mt-3 text-sm font-bold max-md:sr-only md:mt-4">Sobre este NFT:</h2>
          <p className="text-text-secondary mt-1 text-sm leading-6">{nft.description}</p>

          <div className="mt-3">
            <PurchaseOptions
              nft={nft}
              edition={edition}
              quantity={quantity}
              onEditionChange={changeEdition}
              onQuantityChange={(next) => setQuantity(Math.max(1, Math.min(next, maxQuantity)))}
              actions={
                <>
                  <AddToCartButton {...selection} variant="buy" className="min-w-[130px]" />
                  <FavoriteButton nftId={nft.id} nftName={nft.name} variant="labeled" />
                </>
              }
            />
          </div>

          <dl className="text-brand-secondary mt-4 flex flex-col gap-2 text-[15px]">
            <div className="flex gap-2">
              <dt>ID do token:</dt>
              <dd>{nft.tokenId}</dd>
            </div>
            <div className="flex gap-2">
              <dt>Coleção:</dt>
              <dd>
                <Link
                  to="/"
                  search={{ collection: [nft.collection.id], page: 1 }}
                  hash="catalogo"
                  className="hover:text-primary-light underline-offset-4 transition-colors hover:underline"
                >
                  {nft.collection.name}
                </Link>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt>Atributos:</dt>
              <dd>{nft.attributes.join(', ')}</dd>
            </div>
          </dl>
          <ShareLinks nft={nft} />
        </div>
      </div>

      <div className="mt-10 md:mt-[72px]">
        <NftInfoTabs nft={nft} />
      </div>
      <div className="mt-12 md:mt-[72px]">
        <NftShelf title="Mais desta coleção" filter={{ collection: [nft.collection.id] }} excludeIds={[nft.id]} />
      </div>

      <MobilePurchaseBar
        nft={nft}
        edition={edition}
        quantity={quantity}
        onQuantityChange={(next) => setQuantity(Math.max(1, Math.min(next, maxQuantity)))}
        actions={
          <>
            <AddToCartButton
              {...selection}
              variant="buy"
              label="Comprar NFT"
              className="h-[60px] flex-1 rounded-full text-base normal-case"
            />
            <AddToCartButton {...selection} variant="icon" className="bg-card size-[60px]" />
          </>
        }
      />
    </article>
  )
}

function NftPageSkeleton() {
  return (
    <div className="page-container min-h-dvh pt-[72px] pb-4 md:pt-20" aria-busy="true" data-testid="nft-skeleton">
      <p role="status" className="sr-only">
        Carregando NFT…
      </p>
      <div className="grid gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-[572px_minmax(0,1fr)]">
        <NftGallerySkeleton />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-[72px] w-full" />
          <Skeleton className="h-[26px] w-64 max-w-full" />
          <Skeleton className="h-12 w-56 max-w-full" />
          <Skeleton className="h-24 w-72 max-w-full" />
        </div>
      </div>
    </div>
  )
}
