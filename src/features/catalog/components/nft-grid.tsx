import { useQuery } from '@tanstack/react-query'
import { useDeferredValue } from 'react'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { Pagination } from '@/features/catalog/components/pagination'
import { nftListQueryOptions } from '@/features/catalog/hooks/queries'
import { defaultPageSize } from '@/features/catalog/schemas'
import { toListQuery, type CatalogSearch } from '@/features/catalog/search'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:gap-x-[34px] xl:gap-y-16'

/** Quantos cards da primeira página ficam acima da dobra e carregam com prioridade. */
const priorityCards = 3

interface NftGridProps {
  search: CatalogSearch
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function NftGrid({ search, hasActiveFilters, onClearFilters }: NftGridProps) {
  const { data, error, isPending, isFetching, refetch } = useQuery(nftListQueryOptions(toListQuery(search)))

  // Quando os dados chegam, só a primeira linha de cards é montada na hora. O restante é
  // montado logo em seguida, em uma renderização que o React pode interromper, para a chegada
  // dos dados não virar uma tarefa longa. Até lá, os lugares continuam com o skeleton.
  const total = data?.items.length ?? 0
  const deferredTotal = useDeferredValue(total)
  const mounted = Math.min(total, Math.max(deferredTotal, priorityCards))

  if (isPending) {
    return (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          Carregando NFTs…
        </p>
        <Skeleton className="mb-4 h-4 w-40 max-md:hidden" />
        <div className={gridClass} data-testid="nft-grid-skeleton">
          {Array.from({ length: defaultPageSize }, (_, index) => (
            <NftCardSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="bg-card flex flex-col items-start gap-4 p-8">
        <h3 className="text-lg font-bold">Não foi possível carregar os NFTs</h3>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        <Button onClick={() => void refetch()} disabled={isFetching}>
          {isFetching ? 'Tentando…' : 'Tentar novamente'}
        </Button>
      </div>
    )
  }

  if (data.items.length === 0) {
    return (
      <div className="bg-card flex flex-col items-start gap-4 p-8">
        <p role="status" className="text-lg font-bold">
          Nenhum NFT encontrado
        </p>
        <p className="text-muted-foreground text-sm">
          {hasActiveFilters
            ? 'Nenhum item combina com a busca e os filtros escolhidos.'
            : 'Ainda não há NFTs listados. Volte em breve.'}
        </p>
        {hasActiveFilters && <Button onClick={onClearFilters}>Limpar busca e filtros</Button>}
      </div>
    )
  }

  return (
    <div>
      {/* No mobile o layout não mostra a contagem; ela continua sendo anunciada. */}
      <p role="status" className="text-muted-foreground mb-4 text-xs leading-4 max-md:sr-only">
        {data.totalItems === 1 ? '1 NFT encontrado' : `${data.totalItems} NFTs encontrados`}
        {isFetching && ' · atualizando…'}
      </p>
      <div className={gridClass}>
        {data.items.map((nft, index) =>
          index < mounted ? (
            <NftCard key={nft.id} nft={nft} priority={search.page === 1 && index < priorityCards} />
          ) : (
            <NftCardSkeleton key={nft.id} />
          ),
        )}
      </div>
      <Pagination page={data.page} totalPages={data.totalPages} />
    </div>
  )
}
