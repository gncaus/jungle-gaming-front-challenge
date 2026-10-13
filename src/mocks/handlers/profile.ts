import {
  avatarInputSchema,
  passwordChangeSchema,
  profileInputSchema,
  type Profile,
} from '@/features/profile/schemas'
import { readDb, updateDb } from '@/mocks/db/store'
import type { UserRecord } from '@/mocks/db/types'
import { hashPassword, verifyPassword } from '@/mocks/domain/password'
import { authenticate, requireUser } from '@/mocks/domain/session'
import { MockApiError } from '@/mocks/handlers/http-error'
import { route } from '@/mocks/handlers/route'

function toProfile(user: UserRecord): Profile {
  return {
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName,
    walletNickname: user.walletNickname,
    avatarUrl: user.avatarUrl,
  }
}

/** Altera o registro do usuário no banco e devolve o perfil atualizado. */
function changeUser(userId: string, change: (user: UserRecord) => void): Profile {
  return updateDb((state) => {
    const user = state.users.find((candidate) => candidate.id === userId)
    if (!user) {
      throw new MockApiError('NOT_FOUND', 'Conta não encontrada.')
    }
    change(user)
    return toProfile(user)
  })
}

export const profileHandlers = [
  route<Profile>('get', '/profile', ({ request }) => toProfile(requireUser(request))),

  route<Profile>('patch', '/profile', async ({ request, body }) => {
    const user = requireUser(request)
    const input = await body(profileInputSchema)
    const email = input.email.toLowerCase()

    const others = readDb().users.filter((candidate) => candidate.id !== user.id)
    const fields: Record<string, string> = {}
    if (others.some((other) => other.email.toLowerCase() === email)) {
      fields.email = 'Este e-mail já está cadastrado.'
    }
    if (others.some((other) => other.username.toLowerCase() === input.username.toLowerCase())) {
      fields.username = 'Este nome de usuário já está em uso.'
    }
    if (Object.keys(fields).length > 0) {
      throw new MockApiError('ACCOUNT_CONFLICT', 'Já existe uma conta com esses dados.', { fields })
    }

    return changeUser(user.id, (record) => {
      Object.assign(record, { ...input, email })
    })
  }),

  route<Profile>('put', '/profile/avatar', async ({ request, body }) => {
    const user = requireUser(request)
    const { dataUrl } = await body(avatarInputSchema)
    return changeUser(user.id, (record) => {
      record.avatarUrl = dataUrl
    })
  }),

  route<Profile>('delete', '/profile/avatar', ({ request }) => {
    const user = requireUser(request)
    return changeUser(user.id, (record) => {
      record.avatarUrl = null
    })
  }),

  route<never>('put', '/profile/password', async ({ request, body }) => {
    const auth = authenticate(request)
    if (!auth) {
      throw new MockApiError('UNAUTHENTICATED', 'Entre na sua conta para continuar.')
    }
    const input = await body(passwordChangeSchema)
    if (!(await verifyPassword(input.currentPassword, auth.user.password))) {
      throw new MockApiError('VALIDATION_ERROR', 'Revise os campos destacados.', {
        fields: { currentPassword: 'Senha atual incorreta.' },
      })
    }

    const password = await hashPassword(input.newPassword)
    changeUser(auth.user.id, (record) => {
      record.password = password
    })
    // A sessão atual continua; as demais sessões da conta são encerradas.
    updateDb((state) => {
      state.sessions = state.sessions.filter(
        (session) => session.userId !== auth.user.id || session.token === auth.session.token,
      )
    })
    return null
  }),
]
