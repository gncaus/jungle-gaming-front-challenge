import type { NftEdition } from '@/features/catalog/schemas'
import { cn } from '@/shared/lib/utils'

interface EditionPickerProps {
  editions: NftEdition[]
  selectedId: string
  onSelect: (editionId: string) => void
  /** Os botões de rádio de páginas diferentes não podem compartilhar o nome. */
  name: string
}

/** Edições do NFT como um grupo de opções. Edição esgotada continua visível, mas não pode ser escolhida. */
export function EditionPicker({ editions, selectedId, onSelect, name }: EditionPickerProps) {
  return (
    <fieldset>
      <legend className="text-sm font-bold">Edição:</legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const selected = edition.id === selectedId
          return (
            <label
              key={edition.id}
              className={cn(
                'has-focus-visible:outline-ring relative flex h-[26px] items-center rounded-full border px-2 text-[13px] transition-colors has-focus-visible:outline-2',
                selected ? 'border-primary text-text-accent font-bold' : 'text-text-secondary',
                soldOut ? 'cursor-not-allowed opacity-60' : 'hover:border-primary-light cursor-pointer',
              )}
            >
              <input
                type="radio"
                name={name}
                value={edition.id}
                checked={selected}
                disabled={soldOut}
                onChange={() => onSelect(edition.id)}
                className="absolute inset-0 size-full cursor-[inherit] opacity-0"
              />
              <span className={cn(soldOut && 'line-through')}>{edition.label}</span>
              {soldOut && <span className="sr-only"> (esgotada)</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
