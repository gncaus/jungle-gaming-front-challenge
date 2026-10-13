import { quoteInputSchema, type Quote } from '@/features/checkout/schemas'
import { readDb } from '@/mocks/db/store'
import { cartKeyFor } from '@/mocks/domain/cart'
import { buildQuote } from '@/mocks/domain/quote'
import { route } from '@/mocks/handlers/route'

export const quoteHandlers = [
  route<Quote>('post', '/quotes', async ({ request, body }) => {
    const key = cartKeyFor(request)
    const { couponCode } = await body(quoteInputSchema)
    return buildQuote(readDb(), key, couponCode)
  }),
]
