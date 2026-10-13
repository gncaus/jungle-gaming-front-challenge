import { cartSchema, type AddCartItemInput, type Cart } from '@/features/cart/schemas'
import { http } from '@/shared/lib/http'

/** O dono do carrinho vai nos headers que o cliente HTTP já envia: a sessão ou o `X-Guest-Id`. */
export async function fetchCart(signal?: AbortSignal): Promise<Cart> {
  const { data } = await http.get<unknown>('/cart', { signal })
  return cartSchema.parse(data)
}

export async function addCartItem(input: AddCartItemInput): Promise<Cart> {
  const { data } = await http.post<unknown>('/cart/items', input)
  return cartSchema.parse(data)
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  const { data } = await http.patch<unknown>(`/cart/items/${encodeURIComponent(itemId)}`, { quantity })
  return cartSchema.parse(data)
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const { data } = await http.delete<unknown>(`/cart/items/${encodeURIComponent(itemId)}`)
  return cartSchema.parse(data)
}
