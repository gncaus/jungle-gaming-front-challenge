import Decimal from 'decimal.js'
import type { StockConflict } from '@/features/cart/schemas'
import type { Quote } from '@/features/checkout/schemas'
import type { CouponRecord, DbState } from '@/mocks/db/types'
import { toCart } from '@/mocks/domain/cart'
import { fingerprint } from '@/mocks/domain/hash'
import { networks } from '@/mocks/fixtures/collections'
import { MockApiError } from '@/mocks/handlers/http-error'
import { toEthAmount } from '@/shared/lib/money'

function findCoupon(state: DbState, code: string, subtotal: Decimal): CouponRecord {
  const coupon = state.coupons.find((candidate) => candidate.code === code.toUpperCase())
  if (!coupon) {
    throw new MockApiError('COUPON_INVALID', 'Código promocional inválido.')
  }
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= Date.now()) {
    throw new MockApiError('COUPON_EXPIRED', 'Este código promocional expirou.')
  }
  if (coupon.minSubtotal && subtotal.lt(coupon.minSubtotal)) {
    throw new MockApiError(
      'COUPON_INVALID',
      `Este código vale para compras a partir de ${coupon.minSubtotal} ETH.`,
    )
  }
  return coupon
}

/**
 * Calcula a cotação do carrinho com os preços e estoques atuais.
 * Falha com 409 se algum item excede o disponível e com 422 se o cupom não se aplica.
 */
export function buildQuote(state: DbState, cartKey: string, couponCode: string | null): Quote {
  const cart = toCart(state, cartKey)
  if (cart.items.length === 0) {
    throw new MockApiError('VALIDATION_ERROR', 'Seu carrinho está vazio.')
  }

  const unavailable = cart.items.filter((item) => item.status === 'insufficient-stock')
  if (unavailable.length > 0) {
    const details: StockConflict = {
      items: unavailable.map((item) => ({
        nftId: item.nftId,
        editionId: item.editionId,
        requested: item.quantity,
        available: item.available,
        maxQuantity: item.maxQuantity,
      })),
    }
    throw new MockApiError(
      'INSUFFICIENT_STOCK',
      'A disponibilidade de um ou mais itens mudou. Ajuste as quantidades para continuar.',
      { details },
    )
  }

  const subtotal = new Decimal(cart.subtotal)
  const coupon = couponCode ? findCoupon(state, couponCode, subtotal) : null
  const discount = coupon ? subtotal.times(coupon.percent).div(100).toDecimalPlaces(6) : new Decimal(0)

  // Uma taxa por rede envolvida na compra.
  const usedNetworks = [...new Set(cart.items.map((item) => item.network))]
  const networkFee = Decimal.sum(0, ...usedNetworks.map((network) => networks[network].fee))

  const values = {
    items: cart.items.map((item) => ({
      nftId: item.nftId,
      editionId: item.editionId,
      name: item.name,
      tokenId: item.tokenId,
      image: item.image,
      network: item.network,
      editionLabel: item.editionLabel,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    subtotal: cart.subtotal,
    discount: toEthAmount(discount),
    coupon: coupon && { code: coupon.code, description: coupon.description, percent: coupon.percent },
    networkFee: toEthAmount(networkFee),
    total: toEthAmount(subtotal.minus(discount).plus(networkFee)),
  }

  return { version: fingerprint(values), ...values, createdAt: new Date().toISOString() }
}
