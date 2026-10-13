import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/features/cart/hooks/use-cart'
import { cn } from '@/shared/lib/utils'

/** Atalho para o carrinho com o número de itens. Lê a mesma consulta que a página do carrinho. */
export function CartLink({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  const { data } = useCart()
  const count = data?.itemCount ?? 0

  return (
    <Link
      to="/carrinho"
      aria-label={count === 0 ? 'Carrinho, vazio' : `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
      className={cn('relative flex items-center justify-center transition-colors', className)}
    >
      <ShoppingCart className={cn('size-6', iconClassName)} aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
        >
          {count}
        </span>
      )}
    </Link>
  )
}
