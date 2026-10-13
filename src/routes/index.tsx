import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { CatalogFilters } from '@/features/catalog/components/catalog-filters'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'

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
      <div className="flex gap-2 pt-10 pb-3 md:hidden">
        <SearchForm
          current={search.q}
          placeholder="Explorar coleções"
          inputId="mobile-search"
          className="flex-1"
        />
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="relative size-11 rounded-lg" aria-label="Abrir filtros">
              <SlidersHorizontal aria-hidden="true" className="size-5" />
              {activeFilters > 0 && (
                <span className="bg-ink text-foreground absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full text-[11px]">
                  {activeFilters}
                  <span className="sr-only"> filtros ativos</span>
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>Coleções, faixa de preço e rede.</SheetDescription>
            </SheetHeader>
            <CatalogFilters search={search} onChange={changeFilters} idPrefix="sheet" className="px-5" />
            <div className="bg-background sticky bottom-0 mt-auto flex gap-3 border-t p-5">
              <Button variant="outline" className="flex-1" onClick={clearFilters} disabled={activeFilters === 0}>
                Limpar
              </Button>
              <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                Ver resultados
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Hero />

      <section
        id="catalogo"
        aria-labelledby="catalog-title"
        className="mt-8 gap-12 md:mt-14 lg:grid lg:grid-cols-[310px_minmax(0,1fr)] xl:mt-24"
      >
        <h2 id="catalog-title" className="sr-only">
          Catálogo de NFTs
        </h2>

        <div className="hidden flex-col gap-6 lg:flex">
          <CatalogFilters
            search={search}
            onChange={changeFilters}
            idPrefix="sidebar"
            className="bg-card p-5"
          />
          <LimitedOffer />
        </div>

        <div>
          <div className="mb-4 hidden justify-end md:flex lg:hidden">
            <Button variant="outline" onClick={() => setFiltersOpen(true)}>
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

      <div className="mt-16 xl:mt-[100px]">
        <PromoBanners />
      </div>
      <div className="mt-16 xl:mt-[100px]">
        <Journal />
      </div>
    </div>
  )
}
