import { z } from 'zod'

/** Códigos de erro da API e o status HTTP em que cada um trafega. */
export const apiErrorStatus = {
  VALIDATION_ERROR: 422,
  COUPON_INVALID: 422,
  COUPON_EXPIRED: 422,
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  ACCOUNT_CONFLICT: 409,
  INSUFFICIENT_STOCK: 409,
  QUOTE_STALE: 409,
  IDEMPOTENCY_CONFLICT: 409,
  WALLET_NOT_CONNECTED: 409,
  WALLET_REJECTED: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

export type ApiErrorCode = keyof typeof apiErrorStatus

const apiErrorCodes = Object.keys(apiErrorStatus) as [ApiErrorCode, ...ApiErrorCode[]]

export const apiErrorSchema = z.object({
  code: z.enum(apiErrorCodes),
  message: z.string(),
  /** Erros por campo, com o caminho do campo como chave (ex.: `email`). */
  fields: z.record(z.string(), z.string()).optional(),
  /** Dados extras do erro; o formato depende do código (ex.: a nova cotação em QUOTE_STALE). */
  details: z.unknown().optional(),
})

export type ApiError = z.infer<typeof apiErrorSchema>
