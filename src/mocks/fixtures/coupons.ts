import type { CouponRecord } from '@/mocks/db/types'

export function buildCouponFixtures(): CouponRecord[] {
  return [
    {
      code: 'KURIO10',
      description: 'Desconto do lançamento',
      percent: 10,
      expiresAt: null,
      minSubtotal: null,
    },
    {
      code: 'GENESIS25',
      description: 'Desconto gênesis para compras a partir de 5 ETH',
      percent: 25,
      expiresAt: null,
      minSubtotal: '5',
    },
    {
      code: 'VERAO2025',
      description: 'Campanha de verão',
      percent: 15,
      expiresAt: '2025-03-31T23:59:59.000Z',
      minSubtotal: null,
    },
  ]
}
