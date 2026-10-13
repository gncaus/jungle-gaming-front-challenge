import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
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
      <header className="mx-auto w-full max-w-[1200px] border-b px-4 py-6 md:px-6">
        <Link to="/" className="text-sm font-bold tracking-widest" aria-label="Kurio — início">
          KURIO
        </Link>
      </header>
      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-[1200px] flex-1 px-4 md:px-6">
        <Outlet />
      </main>
    </div>
  )
}

function NotFound() {
  return (
    <section className="flex flex-col items-start gap-4 py-24">
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
