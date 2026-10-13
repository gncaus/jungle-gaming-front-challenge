import { QueryClient } from '@tanstack/react-query'
import { HttpError } from '@/shared/lib/http'

const maxRetries = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados ficam "frescos" por 30 s; depois disso são revalidados em segundo plano.
      staleTime: 30_000,
      // Só falha transitória (conexão ou 5xx) é repetida. Um 4xx responderia igual de novo.
      retry: (failureCount, error) =>
        error instanceof HttpError && error.isTransient && failureCount < maxRetries,
      retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4000),
    },
    mutations: {
      // Mutations nunca são repetidas sozinhas: repetir poderia duplicar a operação.
      retry: false,
    },
  },
})
