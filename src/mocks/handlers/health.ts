import { http, HttpResponse } from 'msw'
import type { Health } from '@/features/system/schemas'

export const healthHandlers = [
  http.get('/api/health', () => HttpResponse.json<Health>({ status: 'ok' })),
]
