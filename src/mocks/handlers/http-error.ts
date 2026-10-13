import type { z } from 'zod'
import { apiErrorStatus, type ApiError, type ApiErrorCode } from '@/shared/lib/api-error'

/** Erro de negócio do mock. O `route` o converte na resposta HTTP do contrato de erro. */
export class MockApiError extends Error {
  readonly code: ApiErrorCode
  readonly extra: Pick<ApiError, 'fields' | 'details'>

  constructor(code: ApiErrorCode, message: string, extra: Pick<ApiError, 'fields' | 'details'> = {}) {
    super(message)
    this.code = code
    this.extra = extra
  }

  get status(): number {
    return apiErrorStatus[this.code]
  }

  get body(): ApiError {
    return { code: this.code, message: this.message, ...this.extra }
  }
}

/** Derruba a conexão em vez de responder, como em um timeout de rede. */
export class MockNetworkError extends Error {}

/** Valida uma entrada com o schema do contrato; falha vira 422 com os erros por campo. */
export function parseInput<Schema extends z.ZodType>(schema: Schema, data: unknown): z.output<Schema> {
  const result = schema.safeParse(data)
  if (result.success) {
    return result.data
  }
  const fields: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const path = issue.path.join('.')
    fields[path] ??= issue.message
  }
  throw new MockApiError('VALIDATION_ERROR', 'Revise os campos destacados.', { fields })
}
