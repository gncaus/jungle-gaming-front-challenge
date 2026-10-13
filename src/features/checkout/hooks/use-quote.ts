import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCartOwner } from '@/features/cart/hooks/use-cart'
import type { Cart } from '@/features/cart/schemas'
import { requestQuote } from '@/features/checkout/api/quote-api'
import { privateKey } from '@/shared/lib/query-keys'

/**
 * Identifica o conteúdo do carrinho que a cotação reflete. Entra na chave da consulta,
 * então qualquer mudança de item, quantidade, preço ou estoque pede uma cotação nova.
 */
function cartStamp(cart: Cart): string {
  return cart.items.map((item) => `${item.id}:${item.quantity}:${item.nftVersion}`).join('|')
}

export const quoteKeys = {
  all: (ownerId: string) => privateKey(ownerId, 'quote'),
  detail: (ownerId: string, stamp: string, couponCode: string | null) =>
    [...quoteKeys.all(ownerId), stamp, couponCode] as const,
}

/**
 * Cotação do carrinho. Subtotal, desconto, taxa de rede e total vêm sempre daqui: a
 * interface não soma valores por conta própria.
 */
export function useQuote(cart: Cart | undefined, couponCode: string | null) {
  const ownerId = useCartOwner()
  const hasItems = (cart?.items.length ?? 0) > 0

  return useQuery({
    queryKey: quoteKeys.detail(ownerId ?? '', cart ? cartStamp(cart) : '', couponCode),
    queryFn: ({ signal }) => requestQuote(couponCode, signal),
    enabled: ownerId !== null && hasItems,
  })
}

/**
 * Valida um cupom pedindo a cotação com ele. Se a API aceitar, a cotação já vai para o
 * cache na chave que a tela vai consultar em seguida.
 */
export function useApplyCoupon(cart: Cart | undefined) {
  const queryClient = useQueryClient()
  const ownerId = useCartOwner()

  return useMutation({
    mutationFn: (couponCode: string) => requestQuote(couponCode),
    onSuccess: (quote) => {
      if (ownerId && cart && quote.coupon) {
        queryClient.setQueryData(quoteKeys.detail(ownerId, cartStamp(cart), quote.coupon.code), quote)
      }
    },
  })
}
