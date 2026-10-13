import type { NetworkId } from '@/features/catalog/schemas'
import type { Receipt } from '@/features/orders/schemas'
import type { WalletProvider, WalletSlot } from '@/features/wallets/schemas'
import type { ImageKey } from '@/mocks/fixtures/images'
import type { EthAmount } from '@/shared/lib/money'

export interface EditionRecord {
  id: string
  label: string
  price: EthAmount
  available: number
  maxPerOrder: number
}

export interface NftRecord {
  id: string
  name: string
  tokenId: string
  imageKey: ImageKey
  collectionId: string
  network: NetworkId
  previousPrice: EthAmount | null
  rarity: 'common' | 'rare'
  isNew: boolean
  isTrending: boolean
  listedAt: string
  description: string
  story: string[]
  attributes: string[]
  rating: { average: number; count: number }
  creator: { name: string; royaltyPercent: number }
  contract: { address: string; standard: string }
  editions: EditionRecord[]
  defaultEditionId: string
  version: number
}

export interface PasswordRecord {
  /** PBKDF2-SHA256; sal e hash em hexadecimal. A senha em claro nunca é guardada. */
  salt: string
  hash: string
  iterations: number
}

export interface UserRecord {
  id: string
  username: string
  email: string
  displayName: string
  ensName: string
  walletNickname: string
  avatarUrl: string | null
  password: PasswordRecord
}

export interface SessionRecord {
  token: string
  userId: string
  expiresAt: string
}

export interface CartItemRecord {
  id: string
  nftId: string
  editionId: string
  quantity: number
}

export interface CartRecord {
  items: CartItemRecord[]
  updatedAt: string
}

export interface CouponRecord {
  code: string
  description: string
  percent: number
  expiresAt: string | null
  minSubtotal: EthAmount | null
}

export interface WalletRecord {
  displayName: string
  nickname: string
  network: NetworkId
  profileName: string
  address: string
  secondaryAddress: string
  provider: WalletProvider
  referralCode: string
  email: string
  ensName: string
  connection: 'connected' | 'disconnected'
  updatedAt: string
}

export interface OrderRecord {
  id: string
  userId: string
  status: 'pending' | 'confirmed' | 'declined'
  version: number
  createdAt: string
  updatedAt: string
  /** Momento em que a simulação resolve o pagamento e o resultado já decidido na criação. */
  settleAt: string
  outcome: 'confirmed' | 'declined'
  receipt: Receipt
  transaction: { hash: string; explorerUrl: string } | null
  declineReason: string | null
}

export interface IdempotencyRecord {
  userId: string
  key: string
  /** Impressão digital do corpo enviado com a chave. */
  fingerprint: string
  orderId: string
}

export interface DbState {
  schemaVersion: number
  /** Contador para ids legíveis e determinísticos (`usr_3`, `item_12`). */
  sequence: number
  nfts: NftRecord[]
  users: UserRecord[]
  sessions: SessionRecord[]
  coupons: CouponRecord[]
  /** Chave: id do usuário. */
  favorites: Record<string, string[]>
  /** Chave: dono do carrinho, `user:<id>` ou `guest:<id>`. */
  carts: Record<string, CartRecord>
  /** Chave: id do usuário. */
  wallets: Record<string, Partial<Record<WalletSlot, WalletRecord>>>
  orders: OrderRecord[]
  idempotency: IdempotencyRecord[]
}
