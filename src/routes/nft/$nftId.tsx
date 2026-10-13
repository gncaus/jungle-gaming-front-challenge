import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { NftImage } from '@/features/catalog/components/nft-image'
import { nftDetailQueryOptions } from '@/features/catalog/hooks/queries'
import { HttpError } from '@/shared/lib/http'
import { formatEth } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export const Route = createFileRoute('/nft/$nftId')({
  component: NftPage,
})

function NftPage() {
  const { nftId } = Route.useParams()
  const { data: nft, error, isPending, refetch } = useQuery(nftDetailQueryOptions(nftId))

  if (isPending) {
    return (
      <div className="page-container flex flex-col gap-4 py-10" aria-busy="true">
        <p role="status" className="sr-only">
          Carregando NFT…
        </p>
        <Skeleton className="size-[320px] max-w-full rounded-2xl" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-7 w-32" />
      </div>
    )
  }

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

  return (
    <article className="page-container flex flex-col items-start gap-4 py-10">
      <NftImage
        image={nft.image}
        sizes="(min-width: 768px) 320px, 90vw"
        priority
        className="w-[320px] max-w-full rounded-2xl"
      />
      <h1 className="text-heading-lg font-bold">{nft.name}</h1>
      <p className="text-text-accent text-xl font-bold">{formatEth(nft.price)}</p>
      <p className="text-text-secondary max-w-prose text-sm leading-6">{nft.description}</p>
      <Button asChild variant="outline">
        <Link to="/" hash="catalogo">
          Voltar ao catálogo
        </Link>
      </Button>
    </article>
  )
}
