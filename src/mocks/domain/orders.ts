import Decimal from 'decimal.js'
import type { NetworkId } from '@/features/catalog/schemas'
import type { QuoteStale } from '@/features/checkout/schemas'
import type { CreateOrderData, Order } from '@/features/orders/schemas'
import { nextId, readDb, updateDb } from '@/mocks/db/store'
import type { DbState, OrderRecord, UserRecord } from '@/mocks/db/types'
import { resolveItem, userCartKey } from '@/mocks/domain/cart'
import { findEdition, findNft } from '@/mocks/domain/catalog'
import { hexFrom } from '@/mocks/domain/hash'
import { buildQuote } from '@/mocks/domain/quote'
import { MockApiError } from '@/mocks/handlers/http-error'
import { fireOnce, getScenario } from '@/mocks/scenarios/state'
import { toEthAmount } from '@/shared/lib/money'

/** Tempo que a simulação leva para confirmar ou recusar o pagamento. */
const settleDelayMs = 3000

const explorers: Record<NetworkId, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
}

export function toOrder(record: OrderRecord): Order {
  return {
    id: record.id,
    status: record.status,
    version: record.version,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    receipt: record.receipt,
    transaction: record.transaction,
    declineReason: record.declineReason,
  }
}

/** Aplica, uma única vez, a interferência do cenário ativo sobre o primeiro item do carrinho. */
export function applyCheckoutInterference(state: DbState, userId: string): void {
  const { checkout } = getScenario()
  const firstItem = state.carts[userCartKey(userId)]?.items[0]
  if (!firstItem || (checkout !== 'price-changed' && checkout !== 'sold-out')) return
  if (!fireOnce(checkout)) return

  const { nft, edition } = resolveItem(state, firstItem)
  if (checkout === 'price-changed') {
    edition.price = toEthAmount(new Decimal(edition.price).times('1.1').toDecimalPlaces(3))
  } else {
    edition.available = 0
  }
  nft.version += 1
}

/**
 * Cria o pedido pendente a partir do carrinho do usuário.
 * A cotação é recalculada aqui: se não for a que o usuário confirmou, responde 409 com a atual.
 */
export function createOrder(
  state: DbState,
  user: UserRecord,
  input: CreateOrderData,
): OrderRecord {
  const wallet = state.wallets[user.id]?.[input.walletSlot]
  if (!wallet) {
    throw new MockApiError('VALIDATION_ERROR', 'Cadastre a carteira antes de finalizar.', {
      fields: { walletSlot: 'Carteira não cadastrada.' },
    })
  }
  if (wallet.connection !== 'connected') {
    throw new MockApiError('WALLET_NOT_CONNECTED', 'Conecte a carteira para confirmar a compra.')
  }

  const quote = buildQuote(state, userCartKey(user.id), input.couponCode)
  if (quote.version !== input.quoteVersion) {
    const details: QuoteStale = { quote }
    throw new MockApiError(
      'QUOTE_STALE',
      'Os valores do pedido mudaram. Revise o novo total antes de confirmar.',
      { details },
    )
  }

  const now = Date.now()
  const order: OrderRecord = {
    id: nextId(state, 'ord'),
    userId: user.id,
    status: 'pending',
    version: 1,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    settleAt: new Date(now + settleDelayMs).toISOString(),
    outcome: getScenario().payment,
    receipt: {
      items: quote.items,
      subtotal: quote.subtotal,
      discount: quote.discount,
      coupon: quote.coupon,
      networkFee: quote.networkFee,
      total: quote.total,
      wallet: {
        slot: input.walletSlot,
        provider: wallet.provider,
        nickname: wallet.nickname,
        address: wallet.address,
        network: wallet.network,
      },
      note: input.note,
    },
    transaction: null,
    declineReason: null,
  }
  state.orders.push(order)
  return order
}

function decline(order: OrderRecord, reason: string): void {
  order.status = 'declined'
  order.declineReason = reason
}

/** Confirma o pedido: baixa o estoque e tira do carrinho só o que foi comprado. */
function confirm(state: DbState, order: OrderRecord): void {
  const purchases = order.receipt.items.map((item) => {
    const nft = findNft(state, item.nftId)
    return { item, nft, edition: findEdition(nft, item.editionId) }
  })
  if (purchases.some(({ item, edition }) => edition.available < item.quantity)) {
    decline(order, 'Uma das edições esgotou antes da confirmação do pagamento.')
    return
  }

  const cart = state.carts[userCartKey(order.userId)]
  for (const { item, nft, edition } of purchases) {
    edition.available -= item.quantity
    nft.version += 1

    const cartItem = cart?.items.find(
      (candidate) => candidate.nftId === item.nftId && candidate.editionId === item.editionId,
    )
    if (cartItem) cartItem.quantity -= item.quantity
  }
  if (cart) {
    cart.items = cart.items.filter((cartItem) => cartItem.quantity > 0)
    cart.updatedAt = new Date().toISOString()
  }

  const hash = `0x${hexFrom(order.id, 64)}`
  order.status = 'confirmed'
  order.transaction = { hash, explorerUrl: `${explorers[order.receipt.wallet.network]}${hash}` }
}

/**
 * Resolve os pedidos pendentes cujo prazo já passou. Roda antes de cada requisição,
 * então o resultado não depende de um timer que se perderia em um refresh.
 * Pedidos confirmados e recusados são terminais e nunca voltam a ser avaliados.
 */
export function settleDueOrders(): void {
  const isDue = (order: OrderRecord) => order.status === 'pending' && Date.parse(order.settleAt) <= Date.now()
  if (!readDb().orders.some(isDue)) return

  updateDb((state) => {
    for (const order of state.orders.filter(isDue)) {
      if (order.outcome === 'declined') {
        decline(order, 'Pagamento recusado pela carteira.')
      } else {
        confirm(state, order)
      }
      order.version += 1
      order.updatedAt = new Date().toISOString()
    }
  })
}
