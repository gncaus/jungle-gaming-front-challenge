import axios, { isAxiosError, isCancel } from 'axios'
import { apiErrorSchema, type ApiError, type ApiErrorCode } from '@/shared/lib/api-error'
import { backendReady } from '@/shared/lib/backend-ready'
import { getGuestId, getToken } from '@/shared/lib/credentials'

/** Erro de uma chamada à API, já no formato do contrato. `status` 0 indica falha de conexão. */
export class HttpError extends Error {
  readonly status: number
  readonly code: ApiErrorCode | 'NETWORK_ERROR'
  readonly fields: ApiError['fields']
  readonly details: ApiError['details']

  constructor(status: number, code: HttpError['code'], message: string, extra: Partial<ApiError> = {}) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.fields = extra.fields
    this.details = extra.details
  }

  /** Falha de conexão ou erro 5xx: vale tentar de novo. Erros 4xx não mudam ao repetir. */
  get isTransient(): boolean {
    return this.status === 0 || this.status >= 500
  }

  /** A sessão enviada não vale mais (expirou ou foi encerrada). */
  get isSessionLost(): boolean {
    return this.code === 'SESSION_EXPIRED' || this.code === 'UNAUTHENTICATED'
  }
}

export const http = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
  // Listas trafegam como parâmetro repetido: `collection=a&collection=b`.
  paramsSerializer: { indexes: null },
})

type SessionLostHandler = (error: HttpError) => void
let onSessionLost: SessionLostHandler | null = null

/** A aplicação registra aqui o que fazer quando a API recusa a sessão enviada. */
export function setSessionLostHandler(handler: SessionLostHandler): void {
  onSessionLost = handler
}

http.interceptors.request.use(async (config) => {
  await backendReady()
  const token = getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  config.headers.set('X-Guest-Id', getGuestId())
  return config
})

http.interceptors.response.use(undefined, (error: unknown) => {
  if (isCancel(error) || !isAxiosError(error)) {
    throw error
  }
  if (!error.response) {
    throw new HttpError(0, 'NETWORK_ERROR', 'Não foi possível conectar. Verifique sua conexão e tente novamente.')
  }

  const parsed = apiErrorSchema.safeParse(error.response.data)
  if (!parsed.success) {
    throw new HttpError(error.response.status, 'INTERNAL_ERROR', 'Algo deu errado. Tente novamente.')
  }
  const { code, message, ...extra } = parsed.data
  const httpError = new HttpError(error.response.status, code, message, extra)

  // Só interessa quando a requisição levou um token: sem token, 401 é apenas "faça login".
  const sentToken = error.config?.headers.has('Authorization') ?? false
  if (httpError.isSessionLost && sentToken) {
    onSessionLost?.(httpError)
  }
  throw httpError
})
