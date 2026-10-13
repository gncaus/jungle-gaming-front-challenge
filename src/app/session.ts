import { queryClient } from '@/app/query-client'
import { router } from '@/app/router'
import { endSession, watchSessionFromOtherTabs } from '@/features/auth/session'
import { getToken } from '@/shared/lib/credentials'
import { setSessionLostHandler } from '@/shared/lib/http'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** Rota que só existe para quem tem sessão. */
    requiresAuth?: boolean
  }
}

/**
 * Executa quando o router não está no meio de uma navegação. A sessão pode ser recusada
 * enquanto a página ainda carrega (o código da rota chega depois da resposta da API); uma
 * navegação disparada nesse intervalo seria desfeita pela navegação inicial ao terminar.
 */
function whenRouterSettles(run: () => void): void {
  if (router.state.status === 'idle' && router.state.resolvedLocation) {
    run()
    return
  }
  const unsubscribe = router.subscribe('onResolved', () => {
    unsubscribe()
    run()
  })
}

/** Reabre o login avisando que a sessão expirou, sem perder onde o usuário estava. */
function askToSignInAgain(): void {
  const { location, matches } = router.state
  const onPrivateRoute = matches.some((match) => match.staticData.requiresAuth)
  void router.navigate(
    onPrivateRoute
      ? { to: '/', search: { auth: 'entrar', redirect: location.href, expired: true } }
      : { to: '.', search: (previous) => ({ ...previous, auth: 'entrar', expired: true }) },
  )
}

/**
 * Liga a sessão ao resto da aplicação:
 * - quando a API recusa a sessão (expirada ou encerrada), a sessão local termina, os dados
 *   privados saem do cache e o login reabre com o endereço atual como retorno;
 * - quando outra aba troca ou encerra a sessão, esta descarta o que tinha em cache.
 */
export function installSessionHandling(): void {
  setSessionLostHandler(() => {
    // Várias chamadas podem falhar juntas com 401: só a primeira encerra a sessão.
    if (!getToken()) return
    endSession(queryClient)
    whenRouterSettles(askToSignInAgain)
  })

  watchSessionFromOtherTabs(queryClient)
}
