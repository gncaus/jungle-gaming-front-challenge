import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { CatalogFiltersSkeleton } from '@/features/catalog/components/catalog-filters-skeleton'
import { PriceRange } from '@/features/catalog/components/price-range'
import { nftFacetsQueryOptions } from '@/features/catalog/hooks/queries'
import type { NetworkId } from '@/features/catalog/schemas'
import type { CatalogFilters as Filters, CatalogSearch } from '@/features/catalog/search'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

interface CatalogFiltersProps {
  search: CatalogSearch
  onChange: (filters: Partial<Filters>) => void
  /** Prefixo dos ids, porque os filtros existem duas vezes na página (lateral e painel mobile). */
  idPrefix: string
  className?: string
}

function toggle<Value>(list: readonly Value[], value: Value): Value[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

interface OptionListProps {
  legend: string
  name: string
  options: { id: string; name: string; count: number }[]
  selected: readonly string[]
  onToggle: (id: string) => void
  /** No layout, a contagem das coleções é destacada e a das redes não. */
  strongCount?: boolean
}

function OptionList({ legend, name, options, selected, onToggle, strongCount = false }: OptionListProps) {
  return (
    <fieldset>
      <legend className="text-lg font-bold">{legend}</legend>
      <ul className="mt-3">
        {options.map((option) => {
          const checked = selected.includes(option.id)
          const id = `${name}-${option.id}`
          return (
            <li key={option.id}>
              <label
                htmlFor={id}
                className="hover:text-primary-light has-focus-visible:outline-ring relative flex min-h-10 items-center gap-2 rounded-sm px-3 text-[15px] has-focus-visible:outline-2"
              >
                <input
                  id={id}
                  type="checkbox"
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  checked={checked}
                  onChange={() => onToggle(option.id)}
                />
                <span className={cn('flex-1', checked ? 'text-primary font-bold' : 'text-text-secondary')}>
                  {option.name}
                </span>
                {checked && <Check className="text-primary size-4" aria-hidden="true" />}
                <span className={cn(strongCount ? 'text-foreground font-bold' : 'text-text-secondary')}>
                  ({option.count})
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

export function CatalogFilters({ search, onChange, idPrefix, className }: CatalogFiltersProps) {
  const { data: facets, error, isPending, refetch } = useQuery(nftFacetsQueryOptions)

  if (isPending) {
    return <CatalogFiltersSkeleton className={className} />
  }

  if (error) {
    return (
      <div role="alert" className={cn('flex flex-col items-start gap-3', className)}>
        <p className="text-sm">Não foi possível carregar os filtros.</p>
        <Button size="sm" variant="outline" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      <OptionList
        legend="Coleções"
        name={`${idPrefix}-collection`}
        options={facets.collections}
        selected={search.collection}
        onToggle={(id) => onChange({ collection: toggle(search.collection, id) })}
        strongCount
      />

      <section aria-labelledby={`${idPrefix}-price-title`}>
        <h3 id={`${idPrefix}-price-title`} className="mb-4 text-lg font-bold">
          Faixa de preço
        </h3>
        <PriceRange
          bounds={facets.price}
          applied={{ min: search.minPrice, max: search.maxPrice }}
          onApply={({ min, max }) => onChange({ minPrice: min, maxPrice: max })}
        />
      </section>

      <OptionList
        legend="Rede"
        name={`${idPrefix}-network`}
        options={facets.networks}
        selected={search.network}
        onToggle={(id) => onChange({ network: toggle(search.network, id as NetworkId) })}
      />
    </div>
  )
}
