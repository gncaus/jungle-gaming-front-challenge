import Decimal from 'decimal.js'
import type { Cart, CartItem, StockConflict } from '@/features/cart/schemas'
import { nextId } from '@/mocks/db/store'
import type { CartItemRecord, CartRecord, DbState, EditionRecord, NftRecord } from '@/mocks/db/types'
import { findEdition, findNft } from '@/mocks/domain/catalog'
import { authenticate } from '@/mocks/domain/session'
import { coverImage } from '@/mocks/fixtures/images'
import { MockApiError } from '@/mocks/handlers/http-error'
import { toEthAmount } from '@/shared/lib/money'

const guestHeader = 'X-Guest-Id'

export function guestCartKey(request: Request): string | null {
  const guestId = request.headers.get(guestHeader)?.trim()
  return guestId ? `guest:${guestId}` : null
}

export function userCartKey(userId: string): string {
  return `user:${userId}`
}

/** Dono do carrinho da requisição: o usuário autenticado ou, sem sessão, o visitante. */
export function cartKeyFor(request: Request): string {
  const auth = authenticate(request)
  if (auth) return userCartKey(auth.user.id)

  const guestKey = guestCartKey(request)
  if (!guestKey) {
    throw new MockApiError('VALIDATION_ERROR', `Envie o header ${guestHeader} ou autentique-se.`)
  }
  return guestKey
}

function maxQuantity(edition: EditionRecord): number {
  return Math.min(edition.available, edition.maxPerOrder)
}

export function resolveItem(state: DbState, item: CartItemRecord): { nft: NftRecord; edition: EditionRecord } {
  const nft = findNft(state, item.nftId)
  return { nft, edition: findEdition(nft, item.editionId) }
}

function toCartItem(state: DbState, item: CartItemRecord): CartItem {
  const { nft, edition } = resolveItem(state, item)
  const limit = maxQuantity(edition)
  return {
    id: item.id,
    nftId: nft.id,
    editionId: edition.id,
    name: nft.name,
    tokenId: nft.tokenId,
    image: coverImage(nft.imageKey, nft.name),
    network: nft.network,
    editionLabel: edition.label,
    unitPrice: edition.price,
    quantity: item.quantity,
    lineTotal: toEthAmount(new Decimal(edition.price).times(item.quantity)),
    available: edition.available,
    maxQuantity: limit,
    status: item.quantity > limit ? 'insufficient-stock' : 'ok',
    nftVersion: nft.version,
  }
}

export function toCart(state: DbState, key: string): Cart {
  const record = state.carts[key]
  const items = (record?.items ?? []).map((item) => toCartItem(state, item))
  return {
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: toEthAmount(Decimal.sum(0, ...items.map((item) => item.lineTotal))),
    updatedAt: record?.updatedAt ?? new Date(0).toISOString(),
  }
}

function ensureCart(state: DbState, key: string): CartRecord {
  const cart = (state.carts[key] ??= { items: [], updatedAt: '' })
  cart.updatedAt = new Date().toISOString()
  return cart
}

function assertStock(nft: NftRecord, edition: EditionRecord, requested: number): void {
  const limit = maxQuantity(edition)
  if (requested <= limit) return

  const details: StockConflict = {
    items: [
      { nftId: nft.id, editionId: edition.id, requested, available: edition.available, maxQuantity: limit },
    ],
  }
  const message =
    edition.available === 0
      ? `A edição ${edition.label} de ${nft.name} está esgotada.`
      : `Só é possível levar ${limit} unidade(s) da edição ${edition.label} de ${nft.name}.`
  throw new MockApiError('INSUFFICIENT_STOCK', message, { details })
}

export function addCartItem(
  state: DbState,
  key: string,
  input: { nftId: string; editionId: string; quantity: number },
): void {
  const nft = findNft(state, input.nftId)
  const edition = findEdition(nft, input.editionId)
  const existing = state.carts[key]?.items.find(
    (item) => item.nftId === nft.id && item.editionId === edition.id,
  )
  assertStock(nft, edition, (existing?.quantity ?? 0) + input.quantity)

  const cart = ensureCart(state, key)
  if (existing) {
    existing.quantity += input.quantity
  } else {
    cart.items.push({ id: nextId(state, 'item'), nftId: nft.id, editionId: edition.id, quantity: input.quantity })
  }
}

function findCartItem(state: DbState, key: string, itemId: string): CartItemRecord {
  const item = state.carts[key]?.items.find((candidate) => candidate.id === itemId)
  if (!item) {
    throw new MockApiError('NOT_FOUND', 'Item não encontrado no carrinho.')
  }
  return item
}

export function updateCartItem(state: DbState, key: string, itemId: string, quantity: number): void {
  const item = findCartItem(state, key, itemId)
  const { nft, edition } = resolveItem(state, item)
  assertStock(nft, edition, quantity)
  item.quantity = quantity
  ensureCart(state, key)
}

export function removeCartItem(state: DbState, key: string, itemId: string): void {
  findCartItem(state, key, itemId)
  const cart = ensureCart(state, key)
  cart.items = cart.items.filter((item) => item.id !== itemId)
}

/**
 * Passa os itens do visitante para o carrinho do usuário, somando quantidades do mesmo
 * NFT e edição até o limite disponível. O carrinho do visitante deixa de existir.
 */
export function mergeGuestCart(state: DbState, guestKey: string, userId: string): void {
  const guestCart = state.carts[guestKey]
  if (!guestCart) return

  const userCart = ensureCart(state, userCartKey(userId))
  for (const guestItem of guestCart.items) {
    const { edition } = resolveItem(state, guestItem)
    const existing = userCart.items.find(
      (item) => item.nftId === guestItem.nftId && item.editionId === guestItem.editionId,
    )
    const quantity = Math.min((existing?.quantity ?? 0) + guestItem.quantity, maxQuantity(edition))
    if (existing) {
      existing.quantity = Math.max(existing.quantity, quantity)
    } else if (quantity > 0) {
      userCart.items.push({ ...guestItem, quantity })
    }
  }
  state.carts = Object.fromEntries(Object.entries(state.carts).filter(([key]) => key !== guestKey))
}
