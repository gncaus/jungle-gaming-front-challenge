import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import { addCartItem, fetchCart, removeCartItem, updateCartItem } from '@/features/cart/api/cart-api'
import type { AddCartItemInput, Cart } from '@/features/cart/schemas'
import { announce } from '@/shared/lib/announce'
import { getGuestId } from '@/shared/lib/credentials'
import { privateKey } from '@/shared/lib/query-keys'

export const cartKeys = {
  /** `ownerId` é o id do usuário ou, para visitante, `guest:<id>`. */
  detail: (ownerId: string) => privateKey(ownerId, 'cart'),
}

/**
 * Dono do carrinho: o usuário da sessão ou o visitante. Enquanto a sessão está sendo
 * confirmada não há dono, e nenhum carrinho é consultado nem exibido.
 */
export function useCartOwner(): string | null {
  const session = useSession()
  if (session.status === 'loading') return null
  return session.user?.id ?? `guest:${getGuestId()}`
}

export function useCart() {
  const ownerId = useCartOwner()
  return useQuery({
    queryKey: cartKeys.detail(ownerId ?? ''),
    queryFn: ({ signal }) => fetchCart(signal),
    enabled: ownerId !== null,
  })
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

/**
 * As mutations do carrinho não são otimistas: a API responde com o carrinho inteiro
 * (preços, limites e totais calculados lá), e é essa resposta que vai para o cache.
 */
function useCartMutation<Input>(mutationFn: (input: Input) => Promise<Cart>, failure: string) {
  const queryClient = useQueryClient()
  const ownerId = useCartOwner()

  return useMutation({
    mutationFn,
    onSuccess: (cart) => {
      if (ownerId) queryClient.setQueryData(cartKeys.detail(ownerId), cart)
    },
    onError: (error) => announce(errorMessage(error, failure), 'error'),
  })
}

export function useAddToCart() {
  return useCartMutation(
    (input: AddCartItemInput) => addCartItem(input),
    'Não foi possível adicionar ao carrinho. Tente novamente.',
  )
}

export function useUpdateCartItem() {
  return useCartMutation(
    ({ itemId, quantity }: { itemId: string; quantity: number }) => updateCartItem(itemId, quantity),
    'Não foi possível alterar a quantidade. Tente novamente.',
  )
}

export function useRemoveCartItem() {
  return useCartMutation(
    (itemId: string) => removeCartItem(itemId),
    'Não foi possível remover o item. Tente novamente.',
  )
}
