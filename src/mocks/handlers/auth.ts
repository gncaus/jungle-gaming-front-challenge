import {
  loginInputSchema,
  registerInputSchema,
  type AuthResult,
  type Session,
} from '@/features/auth/schemas'
import { nextId, readDb, updateDb } from '@/mocks/db/store'
import type { UserRecord } from '@/mocks/db/types'
import { guestCartKey, mergeGuestCart } from '@/mocks/domain/cart'
import { hashPassword, verifyPassword } from '@/mocks/domain/password'
import { authenticate, createSession, endSession, toSession } from '@/mocks/domain/session'
import { MockApiError } from '@/mocks/handlers/http-error'
import { Reply, route } from '@/mocks/handlers/route'

function sameText(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

/** Abre a sessão e traz para a conta o carrinho montado como visitante. */
function signIn(user: UserRecord, request: Request): AuthResult {
  const session = createSession(user.id)
  const guestKey = guestCartKey(request)
  if (guestKey) {
    updateDb((state) => mergeGuestCart(state, guestKey, user.id))
  }
  return { ...toSession(user, session), token: session.token }
}

export const authHandlers = [
  route<AuthResult>('post', '/auth/register', async ({ request, body }) => {
    const input = await body(registerInputSchema)

    const { users } = readDb()
    const fields: Record<string, string> = {}
    if (users.some((user) => sameText(user.email, input.email))) {
      fields.email = 'Este e-mail já está cadastrado.'
    }
    if (users.some((user) => sameText(user.username, input.username))) {
      fields.username = 'Este nome de usuário já está em uso.'
    }
    if (Object.keys(fields).length > 0) {
      throw new MockApiError('ACCOUNT_CONFLICT', 'Já existe uma conta com esses dados.', { fields })
    }

    const password = await hashPassword(input.password)
    const user = updateDb((state) => {
      const created: UserRecord = {
        id: nextId(state, 'usr'),
        username: input.username,
        email: input.email.toLowerCase(),
        displayName: input.username,
        ensName: '',
        walletNickname: '',
        avatarUrl: null,
        password,
      }
      state.users.push(created)
      return created
    })

    return new Reply(201, signIn(user, request))
  }),

  route<AuthResult>('post', '/auth/login', async ({ request, body }) => {
    const input = await body(loginInputSchema)

    const user = readDb().users.find((candidate) => sameText(candidate.email, input.email))
    if (!user || !(await verifyPassword(input.password, user.password))) {
      throw new MockApiError('INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
    }

    return signIn(user, request)
  }),

  route<Session>('get', '/auth/session', ({ request }) => {
    const auth = authenticate(request)
    if (!auth) {
      throw new MockApiError('UNAUTHENTICATED', 'Nenhuma sessão ativa.')
    }
    return toSession(auth.user, auth.session)
  }),

  route<never>('post', '/auth/logout', ({ request }) => {
    endSession(request)
    return null
  }),
]
