import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const itemClass =
  'flex size-[35px] items-center justify-center rounded-sm border text-base transition-colors hover:border-primary hover:text-primary'

const maxPagesWithoutGaps = 7

/**
 * Páginas a exibir. Poucas páginas aparecem todas; a partir daí, só a primeira, a última
 * e as vizinhas da atual, com `null` marcando cada salto.
 */
function visiblePages(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= maxPagesWithoutGaps) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }
  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b)
  return sorted.flatMap((value, index) => {
    const previous = sorted[index - 1]
    return previous !== undefined && value - previous > 1 ? [null, value] : [value]
  })
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação do catálogo" className="mt-14 flex justify-end">
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 && (
          <li>
            <Link
              to="/"
              search={(previous) => ({ ...previous, page: page - 1 })}
              resetScroll={false}
              hash="catalogo"
              aria-label="Página anterior"
              className={itemClass}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Link>
          </li>
        )}
        {visiblePages(page, totalPages).map((value, index) =>
          value === null ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1">
              …
            </li>
          ) : (
            <li key={value}>
              <Link
                to="/"
                search={(previous) => ({ ...previous, page: value })}
                resetScroll={false}
                hash="catalogo"
                aria-label={`Página ${value}`}
                aria-current={value === page ? 'page' : undefined}
                className={cn(
                  itemClass,
                  value === page &&
                    'border-primary bg-primary text-primary-foreground hover:text-primary-foreground font-bold',
                )}
              >
                {value}
              </Link>
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <Link
              to="/"
              search={(previous) => ({ ...previous, page: page + 1 })}
              resetScroll={false}
              hash="catalogo"
              aria-label="Próxima página"
              className={itemClass}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
