import type * as React from 'react'
import { cn } from '@/shared/lib/utils'

/** Bloco de carregamento com shimmer. Dê a ele as dimensões do conteúdo que vai substituí-lo. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn('skeleton rounded-sm', className)} {...props} />
}

export { Skeleton }
