import { Star } from 'lucide-react'
import type { NftDetail } from '@/features/catalog/schemas'
import { cn } from '@/shared/lib/utils'

const maxStars = 5

function formatAverage(average: number): string {
  return average.toFixed(1).replace('.', ',')
}

/** Nota média e número de avaliações. As estrelas são decorativas; o texto diz o mesmo. */
export function NftRating({ rating, compact = false }: { rating: NftDetail['rating']; compact?: boolean }) {
  const filled = Math.round(rating.average)
  const reviews = rating.count === 1 ? '1 avaliação' : `${rating.count} avaliações`

  if (compact) {
    return (
      <p className="border-primary flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-sm">
        <Star className="text-primary size-4 fill-current" aria-hidden="true" />
        <span className="font-bold">{formatAverage(rating.average)}</span>
        <span className="text-text-secondary">({rating.count})</span>
        <span className="sr-only">
          Nota {formatAverage(rating.average)} de 5, {reviews}
        </span>
      </p>
    )
  }

  return (
    <p className="flex items-center gap-2 text-[15px]">
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: maxStars }, (_, index) => (
          <Star
            key={index}
            className={cn('size-4', index < filled ? 'text-primary fill-current' : 'text-border-soft')}
          />
        ))}
      </span>
      <span className="sr-only">Nota {formatAverage(rating.average)} de 5.</span>
      {reviews} de colecionadores
    </p>
  )
}
