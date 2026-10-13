import type { Session, SessionUser } from '@/features/auth/schemas'
import { readDb, updateDb } from '@/mocks/db/store'
import type { SessionRecord, UserRecord } from '@/mocks/db/types'
import { MockApiError } from '@/mocks/handlers/http-error'
import { getScenario } from '@/mocks/scenarios/state'

const sessionTtlMs = 30 * 60_000

function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
}

export function toSessionUser(user: UserRecord): SessionUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  }
}

export function toSession(user: UserRecord, session: SessionRecord): Session {
  return { user: toSessionUser(user), expiresAt: session.expiresAt }
}

export function createSession(userId: string): SessionRecord {
  return updateDb((state) => {
    const session: SessionRecord = {
      token: crypto.randomUUID(),
      userId,
      expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(),
    }
    state.sessions.push(session)
    return session
  })
}

export function endSession(request: Request): void {
  const token = bearerToken(request)
  updateDb((state) => {
    state.sessions = state.sessions.filter((session) => session.token !== token)
  })
}

/**
 * Identifica quem fez a requisição. Sem token, devolve `null` (visitante).
 * Com token inválido ou vencido, falha com 401: o cliente precisa encerrar a sessão local.
 */
export function authenticate(request: Request): { user: UserRecord; session: SessionRecord } | null {
  const token = bearerToken(request)
  if (!token) return null

  const state = readDb()
  const session = state.sessions.find((candidate) => candidate.token === token)
  const user = session && state.users.find((candidate) => candidate.id === session.userId)
  if (!session || !user) {
    throw new MockApiError('UNAUTHENTICATED', 'Sessão inválida. Entre novamente.')
  }
  if (getScenario().sessionExpired || Date.parse(session.expiresAt) <= Date.now()) {
    updateDb((draft) => {
      draft.sessions = draft.sessions.filter((candidate) => candidate.token !== token)
    })
    throw new MockApiError('SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
  }
  return { user, session }
}

export function requireUser(request: Request): UserRecord {
  const auth = authenticate(request)
  if (!auth) {
    throw new MockApiError('UNAUTHENTICATED', 'Entre na sua conta para continuar.')
  }
  return auth.user
}
