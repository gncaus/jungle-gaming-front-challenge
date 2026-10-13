import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { SiteFooter } from '@/app/layout/site-footer'
import { SiteHeader } from '@/app/layout/site-header'
import { Button } from '@/shared/ui/button'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
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
