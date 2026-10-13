import { quoteSchema, type Quote } from '@/features/checkout/schemas'
import { http } from '@/shared/lib/http'

/** Pede a cotação do carrinho atual, com o cupom informado. É a referência de valores da compra. */
export async function requestQuote(couponCode: string | null, signal?: AbortSignal): Promise<Quote> {
  const { data } = await http.post<unknown>('/quotes', { couponCode }, { signal })
  return quoteSchema.parse(data)
}
