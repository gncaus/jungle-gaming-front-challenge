import {
  addCartItemInputSchema,
  updateCartItemInputSchema,
  type Cart,
} from '@/features/cart/schemas'
import { readDb, updateDb } from '@/mocks/db/store'
import { addCartItem, cartKeyFor, removeCartItem, toCart, updateCartItem } from '@/mocks/domain/cart'
import { Reply, route } from '@/mocks/handlers/route'

export const cartHandlers = [
  route<Cart>('get', '/cart', ({ request }) => toCart(readDb(), cartKeyFor(request))),

  route<Cart>('post', '/cart/items', async ({ request, body }) => {
    const key = cartKeyFor(request)
    const input = await body(addCartItemInputSchema)
    updateDb((state) => addCartItem(state, key, input))
    return new Reply(201, toCart(readDb(), key))
  }),

  route<Cart>('patch', '/cart/items/:itemId', async ({ request, param, body }) => {
    const key = cartKeyFor(request)
    const { quantity } = await body(updateCartItemInputSchema)
    updateDb((state) => updateCartItem(state, key, param('itemId'), quantity))
    return toCart(readDb(), key)
  }),

  route<Cart>('delete', '/cart/items/:itemId', ({ request, param }) => {
    const key = cartKeyFor(request)
    updateDb((state) => removeCartItem(state, key, param('itemId')))
    return toCart(readDb(), key)
  }),
]
