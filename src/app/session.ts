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

    const { location, matches } = router.state
    const onPrivateRoute = matches.some((match) => match.staticData.requiresAuth)
    void router.navigate(
      onPrivateRoute
        ? { to: '/', search: { auth: 'entrar', redirect: location.href, expired: true } }
        : { to: '.', search: (previous) => ({ ...previous, auth: 'entrar', expired: true }) },
    )
  })

  watchSessionFromOtherTabs(queryClient)
}
