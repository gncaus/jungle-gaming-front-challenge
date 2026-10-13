import axios, { isAxiosError, isCancel } from 'axios'
import { apiErrorSchema, type ApiError, type ApiErrorCode } from '@/shared/lib/api-error'
import { backendReady } from '@/shared/lib/backend-ready'

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
}

export const http = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
  // Listas trafegam como parâmetro repetido: `collection=a&collection=b`.
  paramsSerializer: { indexes: null },
})

http.interceptors.request.use(async (config) => {
  await backendReady()
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
  if (parsed.success) {
    const { code, message, ...extra } = parsed.data
    throw new HttpError(error.response.status, code, message, extra)
  }
  throw new HttpError(error.response.status, 'INTERNAL_ERROR', 'Algo deu errado. Tente novamente.')
})
