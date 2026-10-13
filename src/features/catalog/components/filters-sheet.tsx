import { CatalogFilters } from '@/features/catalog/components/catalog-filters'
import type { CatalogFilters as Filters, CatalogSearch } from '@/features/catalog/search'
import { useReturnFocus } from '@/shared/lib/use-return-focus'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet'

interface FiltersSheetProps {
  search: CatalogSearch
  activeFilters: number
  onChange: (filters: Partial<Filters>) => void
  onClear: () => void
  onClose: () => void
}

/** Filtros em um painel lateral, para telas sem espaço para a coluna de filtros. */
export function FiltersSheet({ search, activeFilters, onChange, onClear, onClose }: FiltersSheetProps) {
  const returnFocus = useReturnFocus()

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" onCloseAutoFocus={returnFocus}>
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Coleções, faixa de preço e rede.</SheetDescription>
        </SheetHeader>
        <CatalogFilters search={search} onChange={onChange} idPrefix="sheet" className="px-5" />
        <div className="bg-background sticky bottom-0 mt-auto flex gap-3 border-t p-5">
          <Button variant="outline" className="flex-1" onClick={onClear} disabled={activeFilters === 0}>
            Limpar
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Ver resultados
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
