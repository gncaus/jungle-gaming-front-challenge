import { useEffect, useState } from 'react'
import type { Cart, CartItem } from '@/features/cart/schemas'
import { announce } from '@/shared/lib/announce'
import { formatEth } from '@/shared/lib/money'

type Notices = Record<string, string>

/** Descreve o que mudou em um item por causa do catálogo (preço ou estoque), se algo mudou. */
function describeChange(before: CartItem, after: CartItem): string | null {
  if (before.unitPrice !== after.unitPrice) {
    return `O preço de ${after.name} mudou de ${formatEth(before.unitPrice)} para ${formatEth(after.unitPrice)}.`
  }
  if (before.available !== after.available && after.status === 'insufficient-stock') {
    return after.available === 0
      ? `${after.name} esgotou nesta edição.`
      : `A disponibilidade de ${after.name} caiu para ${after.available}.`
  }
  return null
}

/**
 * Acompanha o carrinho enquanto ele está aberto e devolve, por item, o aviso da última
 * mudança de preço ou disponibilidade. Mudanças feitas pelo próprio usuário (quantidade,
 * remoção) não geram aviso. Cada aviso novo também é anunciado na região `aria-live`.
 */
export function useCartChangeNotices(cart: Cart | undefined): Notices {
  const [seen, setSeen] = useState(cart)
  const [notices, setNotices] = useState<Notices>({})

  // Comparação durante a renderização, no padrão do React para derivar estado de uma
  // prop que mudou: evita um efeito que renderizaria a tela duas vezes.
  if (cart && cart !== seen) {
    setSeen(cart)
    const changes: Notices = {}
    for (const item of cart.items) {
      const before = seen?.items.find((candidate) => candidate.id === item.id)
      const change = before && describeChange(before, item)
      if (change) changes[item.id] = change
    }
    if (Object.keys(changes).length > 0) {
      setNotices((current) => ({ ...current, ...changes }))
    }
  }

  useEffect(() => {
    const messages = Object.values(notices)
    if (messages.length > 0) announce(messages.join(' '))
  }, [notices])

  return notices
}
