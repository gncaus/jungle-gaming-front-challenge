import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Lugar reservado dos filtros. Aparece enquanto o código dos filtros é baixado (eles são
 * carregados sob demanda) e enquanto as opções chegam da API.
 */
export function CatalogFiltersSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)} aria-busy="true" data-testid="filters-skeleton">
      <p role="status" className="sr-only">
        Carregando filtros…
      </p>
      <Skeleton className="h-7 w-32" />
      {Array.from({ length: 9 }, (_, index) => (
        <Skeleton key={index} className="h-7 w-full" />
      ))}
      <Skeleton className="mt-6 h-7 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="mt-6 h-7 w-24" />
      <Skeleton className="h-28 w-full" />
    </div>
  )
}
