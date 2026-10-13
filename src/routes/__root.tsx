import { createRootRoute, Link, Outlet, useRouter } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { MobileNav } from '@/app/layout/mobile-nav'
import { SiteFooter } from '@/app/layout/site-footer'
import { SiteHeader } from '@/app/layout/site-header'
import { useToken } from '@/features/auth/hooks/use-session'
import { authSearchSchema, safeRedirect } from '@/features/auth/search'
import { Button } from '@/shared/ui/button'

// O diálogo (e o formulário que vem com ele) só é baixado quando alguém vai entrar.
const AuthDialog = lazy(() =>
  import('@/features/auth/components/auth-dialog').then((module) => ({ default: module.AuthDialog })),
)

export const Route = createRootRoute({
  validateSearch: authSearchSchema,
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const { auth, redirect, expired } = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const hasSession = useToken() !== null

  // Quem já tem sessão e chega em um link de login segue direto para o destino.
  useEffect(() => {
    if (!auth || !hasSession) return
    const target = safeRedirect(redirect)
    if (target) {
      router.history.replace(target)
    } else {
      void navigate({
        to: '.',
        search: (previous) => ({ ...previous, auth: undefined, redirect: undefined, expired: undefined }),
        replace: true,
        resetScroll: false,
      })
    }
  }, [auth, hasSession, redirect, navigate, router])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-sm px-4 py-2 font-bold focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileNav />
      {auth && !hasSession && (
        <Suspense fallback={null}>
          <AuthDialog mode={auth} redirect={redirect} expired={expired} />
        </Suspense>
      )}
    </div>
  )
}

function NotFound() {
  return (
    <section className="page-container flex flex-col items-start gap-4 py-24">
      <p className="text-text-accent text-sm">Erro 404</p>
      <h1 className="text-display-sm md:text-display font-bold uppercase">Página não encontrada</h1>
      <p className="text-muted-foreground max-w-prose text-sm">
        O endereço acessado não existe ou foi movido.
      </p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}
