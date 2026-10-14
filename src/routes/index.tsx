import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { CatalogFiltersSkeleton } from '@/features/catalog/components/catalog-filters-skeleton'
import { CatalogToolbar } from '@/features/catalog/components/catalog-toolbar'
import { Hero } from '@/features/catalog/components/hero'
import { LimitedOffer } from '@/features/catalog/components/limited-offer'
import { NftGrid } from '@/features/catalog/components/nft-grid'
import { SearchForm } from '@/features/catalog/components/search-form'
import {
  catalogSearchDefaults,
  catalogSearchSchema,
  countActiveFilters,
  type CatalogFilters as Filters,
} from '@/features/catalog/search'
import { Journal } from '@/features/home/components/journal'
import { PromoBanners } from '@/features/home/components/promo-banners'
import { Button } from '@/shared/ui/button'

// Os filtros trazem o slider e o painel lateral, que não são necessários para a primeira
// pintura: são baixados à parte, com um lugar reservado do mesmo tamanho enquanto isso.
const CatalogFilters = lazy(() =>
  import('@/features/catalog/components/catalog-filters').then((module) => ({
    default: module.CatalogFilters,
  })),
)
const FiltersSheet = lazy(() =>
  import('@/features/catalog/components/filters-sheet').then((module) => ({ default: module.FiltersSheet })),
)

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  // Parâmetros com o valor padrão ficam fora da URL.
  search: { middlewares: [stripSearchParams(catalogSearchDefaults)] },
  component: HomePage,
})

function HomePage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilters = countActiveFilters(search)

  /** Mudar busca, filtro, aba ou ordenação sempre volta para a primeira página. */
  function changeFilters(filters: Partial<Filters>) {
    void navigate({ search: (previous) => ({ ...previous, ...filters, page: 1 }), resetScroll: false })
  }

  function clearFilters() {
    void navigate({ search: { tab: search.tab, sort: search.sort }, resetScroll: false })
  }

  return (
    <div className="page-container">
      <div className="flex gap-2 pt-10 pb-4 md:hidden">
        <SearchForm
          current={search.q}
          placeholder="Explorar coleções"
          inputId="mobile-search"
          className="flex-1"
        />
        <Button
          size="icon"
          className="relative size-11 rounded-lg"
          aria-label="Abrir filtros"
          aria-haspopup="dialog"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal aria-hidden="true" className="size-5" />
          {activeFilters > 0 && (
            <span className="bg-ink text-foreground absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full text-[11px]">
              {activeFilters}
              <span className="sr-only"> filtros ativos</span>
            </span>
          )}
        </Button>
      </div>

      <Hero />

      <section
        id="catalogo"
        aria-labelledby="catalog-title"
        className="mt-6 gap-12 md:mt-14 lg:grid lg:grid-cols-[310px_minmax(0,1fr)] xl:mt-24"
      >
        <h2 id="catalog-title" className="sr-only">
          Catálogo de NFTs
        </h2>

        <div className="hidden flex-col gap-6 lg:flex">
          <Suspense fallback={<CatalogFiltersSkeleton className="bg-card p-5" />}>
            <CatalogFilters
              search={search}
              onChange={changeFilters}
              idPrefix="sidebar"
              className="bg-card p-5"
            />
          </Suspense>
          <LimitedOffer />
        </div>

        <div>
          <div className="mb-4 hidden justify-end md:flex lg:hidden">
            <Button variant="outline" aria-haspopup="dialog" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal aria-hidden="true" />
              Filtros{activeFilters > 0 && ` (${activeFilters})`}
            </Button>
          </div>
          <CatalogToolbar search={search} onChange={changeFilters} />
          <div className="mt-6">
            <NftGrid
              search={search}
              hasActiveFilters={activeFilters > 0 || search.q !== '' || search.tab !== 'all'}
              onClearFilters={() => void navigate({ search: {}, resetScroll: false })}
            />
          </div>
        </div>
      </section>

      {filtersOpen && (
        <Suspense fallback={null}>
          <FiltersSheet
            search={search}
            activeFilters={activeFilters}
            onChange={changeFilters}
            onClear={clearFilters}
            onClose={() => setFiltersOpen(false)}
          />
        </Suspense>
      )}

      <div className="render-when-near mt-16 xl:mt-[100px]">
        <PromoBanners />
      </div>
      <div className="render-when-near mt-16 xl:mt-[100px]">
        <Journal />
      </div>
    </div>
  )
}
