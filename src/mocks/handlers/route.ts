import { delay, http, HttpResponse, type HttpHandler, type JsonBodyType } from 'msw'
import type { z } from 'zod'
import { settleDueOrders } from '@/mocks/domain/orders'
import { MockApiError, MockNetworkError, parseInput } from '@/mocks/handlers/http-error'
import { failureFor, latencyFor } from '@/mocks/scenarios/state'
import type { ApiError } from '@/shared/lib/api-error'

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'

export interface RouteContext {
  request: Request
  url: URL
  param(name: string): string
  /** Lê o corpo JSON e o valida com o schema de entrada do contrato. */
  body<Schema extends z.ZodType>(schema: Schema): Promise<z.output<Schema>>
}

/** Resposta com status diferente de 200 (ex.: 201 na criação). */
export class Reply<Body> {
  readonly status: number
  readonly body: Body

  constructor(status: number, body: Body) {
    this.status = status
    this.body = body
  }
}

const failureBodies: Record<'http-500' | 'http-503', ApiError> = {
  'http-500': { code: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.' },
  'http-503': { code: 'SERVICE_UNAVAILABLE', message: 'Serviço indisponível no momento. Tente novamente.' },
}

/**
 * Registra uma rota da API simulada em `/api<path>`.
 * Aplica a latência e as falhas do cenário ativo e converte `MockApiError` no contrato de erro.
 * O resolver devolve o corpo da resposta (200), um `Reply` para outro status ou `null` (204).
 */
export function route<Body extends JsonBodyType>(
  method: Method,
  path: string,
  resolver: (context: RouteContext) => Body | Reply<Body> | null | Promise<Body | Reply<Body> | null>,
): HttpHandler {
  return http[method](`/api${path}`, async ({ request, params }) => {
    const url = new URL(request.url)
    const apiPath = url.pathname.replace(/^\/api/, '')

    await delay(latencyFor(apiPath))

    const failure = failureFor(request.method, apiPath)
    if (failure?.kind === 'network') {
      return HttpResponse.error()
    }
    if (failure) {
      const body = failureBodies[failure.kind]
      return HttpResponse.json(body, { status: failure.kind === 'http-500' ? 500 : 503 })
    }

    const context: RouteContext = {
      request,
      url,
      param(name) {
        const value = params[name]
        return typeof value === 'string' ? value : ''
      },
      async body(schema) {
        const data: unknown = await request.json().catch(() => null)
        return parseInput(schema, data)
      },
    }

    try {
      await settleDueOrders()
      const result = await resolver(context)
      if (result === null) {
        return new HttpResponse(null, { status: 204 })
      }
      if (result instanceof Reply) {
        return HttpResponse.json(result.body, { status: result.status })
      }
      return HttpResponse.json(result)
    } catch (error) {
      if (error instanceof MockApiError) {
        return HttpResponse.json(error.body, { status: error.status })
      }
      if (error instanceof MockNetworkError) {
        return HttpResponse.error()
      }
      throw error
    }
  })
}
