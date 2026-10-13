import { useNavigate } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useSession } from '@/features/auth/hooks/use-session'
import { useFavorites, useToggleFavorite } from '@/features/favorites/hooks/use-favorites'
import { cn } from '@/shared/lib/utils'

interface FavoriteButtonProps {
  nftId: string
  nftName: string
  /** `icon` é o botão redondo dos cards e do topo do detalhe mobile; `labeled`, o botão com texto. */
  variant: 'icon' | 'labeled'
  className?: string
}

/**
 * Favoritar exige sessão. Para um visitante, o clique abre o login e deixa o pedido na URL
 * (`?favoritar=`), para ser concluído assim que a sessão existir.
 */
export function FavoriteButton({ nftId, nftName, variant, className }: FavoriteButtonProps) {
  const navigate = useNavigate()
  const session = useSession()
  const { data } = useFavorites()
  const toggle = useToggleFavorite()
  const isFavorite = data?.nftIds.includes(nftId) ?? false

  function handleClick() {
    if (session.status !== 'authenticated') {
      void navigate({
        to: '.',
        search: (previous) => ({ ...previous, auth: 'entrar', favoritar: nftId }),
        resetScroll: false,
      })
      return
    }
    toggle.mutate({ nftId, nftName, favorite: !isFavorite })
  }

  const icon = <Heart className={cn('size-5', isFavorite && 'fill-current')} aria-hidden="true" />

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isFavorite}
        aria-label={`Favoritar ${nftName}`}
        className={cn(
          'bg-ink/80 hover:text-primary-light flex size-10 items-center justify-center rounded-full transition-colors',
          isFavorite ? 'text-primary' : 'text-foreground',
          className,
        )}
      >
        {icon}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFavorite}
      className={cn(
        'border-primary hover:bg-surface-raised flex h-10 min-w-[130px] items-center justify-center gap-2 rounded-sm border px-3 text-sm font-medium transition-colors',
        isFavorite ? 'text-primary' : 'text-text-secondary',
        className,
      )}
    >
      {icon}
      {isFavorite ? 'Favoritado' : 'Favoritar'}
      <span className="sr-only"> {nftName}</span>
    </button>
  )
}
