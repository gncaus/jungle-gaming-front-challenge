import type { QueryClient } from '@tanstack/react-query'
import type { AuthResult } from '@/features/auth/schemas'
import { getToken, renewGuestId, setToken, subscribeToToken } from '@/shared/lib/credentials'

/** A sessão é guardada por token: outro token nunca reaproveita o usuário em cache. */
export function sessionKey(token: string) {
  return ['auth', 'session', token] as const
}

/**
 * Único dado em cache que não pertence a ninguém. Todo o resto (sessão, favoritos, carrinho,
 * pedidos, perfil, carteiras) é descartado quando a sessão muda.
 */
const publicCacheRoot = 'catalog'

/**
 * Apaga do cache tudo o que é de um usuário ou visitante. O catálogo fica, porque é público
 * e as telas abertas continuam observando essas consultas (apagá-las as deixaria sem
 * receber as atualizações em tempo real).
 */
function dropPrivateData(queryClient: QueryClient): void {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== publicCacheRoot })
  queryClient.getMutationCache().clear()
}

/** Token que esta aba espera encontrar; diferença indica login ou logout feito em outra aba. */
let knownToken = getToken()

/** Abre a sessão depois de login ou cadastro, sem deixar no cache nada de quem estava antes. */
export function startSession(queryClient: QueryClient, result: AuthResult): void {
  dropPrivateData(queryClient)
  queryClient.setQueryData(sessionKey(result.token), { user: result.user, expiresAt: result.expiresAt })
  knownToken = result.token
  setToken(result.token)
}

/**
 * Encerra a sessão nesta aba: logout, expiração ou sessão recusada pela API.
 * Apaga o token, os dados privados em cache e a identidade de visitante usada até então.
 */
export function endSession(queryClient: QueryClient): void {
  knownToken = null
  // A identidade de visitante é trocada antes de o token sair: as telas reagem à saída do
  // token e já precisam encontrar o visitante novo, com o carrinho vazio.
  renewGuestId()
  dropPrivateData(queryClient)
  setToken(null)
}

/** Se outra aba trocar ou encerrar a sessão, esta descarta o que tinha do usuário anterior. */
export function watchSessionFromOtherTabs(queryClient: QueryClient): () => void {
  return subscribeToToken(() => {
    const token = getToken()
    if (token !== knownToken) {
      knownToken = token
      dropPrivateData(queryClient)
    }
  })
}
