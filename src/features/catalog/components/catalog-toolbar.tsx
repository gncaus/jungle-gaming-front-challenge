import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { nftSorts, nftTabs } from '@/features/catalog/schemas'
import type { CatalogFilters, CatalogSearch } from '@/features/catalog/search'
import { cn } from '@/shared/lib/utils'

const tabLabels: Record<(typeof nftTabs)[number], string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}

const sortLabels: Record<(typeof nftSorts)[number], string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  name: 'Nome (A–Z)',
}

interface CatalogToolbarProps {
  search: CatalogSearch
  onChange: (filters: Partial<CatalogFilters>) => void
}

export function CatalogToolbar({ search, onChange }: CatalogToolbarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <nav aria-label="Seleções do catálogo" className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
        <ul className="flex gap-5 text-[15px] font-bold whitespace-nowrap">
          {nftTabs.map((tab) => (
            <li key={tab}>
              <Link
                to="/"
                search={(previous) => ({ ...previous, tab, page: 1 })}
                resetScroll={false}
                aria-current={search.tab === tab ? 'page' : undefined}
                className={cn(
                  'hover:text-primary-light inline-block border-b-2 border-transparent py-1 transition-colors',
                  search.tab === tab && 'border-primary text-text-accent',
                )}
              >
                {tabLabels[tab]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <label className="flex items-center gap-1 text-[15px]">
        <span>Ordenar por:</span>
        <span className="relative">
          <select
            value={search.sort}
            onChange={(event) => onChange({ sort: event.target.value as CatalogSearch['sort'] })}
            className="bg-background cursor-pointer appearance-none rounded-sm py-1 pr-6 pl-1"
          >
            {nftSorts.map((sort) => (
              <option key={sort} value={sort}>
                {sortLabels[sort]}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-1 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
        </span>
      </label>
    </div>
  )
}
