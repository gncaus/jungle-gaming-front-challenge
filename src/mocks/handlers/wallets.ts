import {
  walletInputSchema,
  walletSlotSchema,
  type Wallet,
  type Wallets,
  type WalletSlot,
} from '@/features/wallets/schemas'
import { readDb, updateDb } from '@/mocks/db/store'
import type { WalletRecord } from '@/mocks/db/types'
import { requireUser } from '@/mocks/domain/session'
import { MockApiError } from '@/mocks/handlers/http-error'
import { route } from '@/mocks/handlers/route'
import { getScenario } from '@/mocks/scenarios/state'

function parseSlot(value: string): WalletSlot {
  const slot = walletSlotSchema.safeParse(value)
  if (!slot.success) {
    throw new MockApiError('NOT_FOUND', 'Carteira não encontrada.')
  }
  return slot.data
}

function toWallet(slot: WalletSlot, record: WalletRecord): Wallet {
  return { ...record, slot }
}

function walletsOf(userId: string): Wallets {
  const wallets = readDb().wallets[userId]
  return {
    primary: wallets?.primary ? toWallet('primary', wallets.primary) : null,
    secondary: wallets?.secondary ? toWallet('secondary', wallets.secondary) : null,
  }
}

/** Muda o estado de conexão de uma carteira cadastrada e devolve as carteiras do usuário. */
function setConnection(userId: string, slot: WalletSlot, connection: WalletRecord['connection']): Wallets {
  updateDb((state) => {
    const wallet = state.wallets[userId]?.[slot]
    if (!wallet) {
      throw new MockApiError('NOT_FOUND', 'Cadastre a carteira antes de conectar.')
    }
    wallet.connection = connection
  })
  return walletsOf(userId)
}

export const walletHandlers = [
  route<Wallets>('get', '/wallets', ({ request }) => walletsOf(requireUser(request).id)),

  route<Wallets>('put', '/wallets/:slot', async ({ request, param, body }) => {
    const user = requireUser(request)
    const slot = parseSlot(param('slot'))
    const input = await body(walletInputSchema)

    updateDb((state) => {
      const current = state.wallets[user.id]?.[slot]
      // Trocar o endereço ou o tipo de carteira exige conectar de novo.
      const sameAccount = current?.address === input.address && current.provider === input.provider
      state.wallets[user.id] = {
        ...state.wallets[user.id],
        [slot]: {
          ...input,
          email: input.email.toLowerCase(),
          connection: sameAccount ? current.connection : 'disconnected',
          updatedAt: new Date().toISOString(),
        },
      }
    })
    return walletsOf(user.id)
  }),

  route<Wallets>('post', '/wallets/:slot/connect', ({ request, param }) => {
    const user = requireUser(request)
    const slot = parseSlot(param('slot'))
    if (getScenario().walletConnection === 'rejected') {
      throw new MockApiError('WALLET_REJECTED', 'A conexão foi recusada na carteira.')
    }
    return setConnection(user.id, slot, 'connected')
  }),

  route<Wallets>('post', '/wallets/:slot/disconnect', ({ request, param }) => {
    const user = requireUser(request)
    return setConnection(user.id, parseSlot(param('slot')), 'disconnected')
  }),
]
