import { useNavigate } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { useAddToCart } from '@/features/cart/hooks/use-cart'
import { announce } from '@/shared/lib/announce'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

interface AddToCartButtonProps {
  nftId: string
  nftName: string
  editionId: string
  quantity: number
  /** `buy` adiciona e leva ao carrinho; `icon` adiciona e fica na página. */
  variant: 'buy' | 'icon'
  /** Sem estoque para a seleção atual. */
  unavailable?: boolean
  label?: string
  className?: string
}

/** Adiciona a seleção ao carrinho pela API. Limites de estoque são validados lá. */
export function AddToCartButton({
  nftId,
  nftName,
  editionId,
  quantity,
  variant,
  unavailable = false,
  label = 'Comprar',
  className,
}: AddToCartButtonProps) {
  const navigate = useNavigate()
  const add = useAddToCart()
  const disabled = unavailable || add.isPending

  function handleClick() {
    add.mutate(
      { nftId, editionId, quantity },
      {
        onSuccess: () => {
          announce(`${nftName} adicionado ao carrinho.`)
          if (variant === 'buy') void navigate({ to: '/carrinho' })
        },
      },
    )
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={`Adicionar ${nftName} ao carrinho`}
        className={cn(
          'bg-ink/80 text-foreground hover:text-primary-light flex size-10 items-center justify-center rounded-full transition-colors disabled:opacity-40',
          className,
        )}
      >
        <ShoppingCart className="size-5" aria-hidden="true" />
      </button>
    )
  }

  return (
    <Button onClick={handleClick} disabled={disabled} className={cn('tracking-wider uppercase', className)}>
      {add.isPending ? 'Adicionando…' : label}
      <span className="sr-only"> {nftName}</span>
    </Button>
  )
}
