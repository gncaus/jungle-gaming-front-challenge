import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import type { FormEvent } from 'react'
import { cn } from '@/shared/lib/utils'

interface SearchFormProps {
  /** Busca aplicada no momento, para preencher o campo. */
  current: string
  placeholder: string
  inputId: string
  autoFocus?: boolean
  className?: string
  onSubmitted?: () => void
}

/** Busca do catálogo. Enviar leva à página inicial com o termo na URL e a paginação reiniciada. */
export function SearchForm({ current, placeholder, inputId, autoFocus, className, onSubmitted }: SearchFormProps) {
  const navigate = useNavigate()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    void navigate({
      to: '/',
      search: (previous) => ({ ...previous, q, page: 1 }),
      hash: 'catalogo',
    })
    onSubmitted?.()
  }

  return (
    <form role="search" onSubmit={submit} className={cn('relative', className)}>
      <label htmlFor={inputId} className="sr-only">
        Buscar NFTs por nome, token ou coleção
      </label>
      <Search
        className="text-text-secondary pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
        aria-hidden="true"
      />
      <input
        // A chave recria o campo quando a busca aplicada muda por fora (histórico, limpar filtros).
        key={current}
        id={inputId}
        name="q"
        type="search"
        defaultValue={current}
        placeholder={placeholder}
        maxLength={80}
        autoFocus={autoFocus}
        enterKeyHint="search"
        className="bg-card placeholder:text-text-secondary h-11 w-full rounded-lg pr-3 pl-11 text-[15px]"
      />
    </form>
  )
}
