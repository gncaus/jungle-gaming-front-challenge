import { Link, useLocation } from '@tanstack/react-router'
import { Heart, House, ScanLine, User } from 'lucide-react'
import { useSession } from '@/features/auth/hooks/use-session'
import { CartLink } from '@/features/cart/components/cart-link'
import { cn } from '@/shared/lib/utils'

type Section = 'home' | 'favorites' | 'cart' | 'account'

/** Cada rota pertence a uma seção da barra; as demais (detalhe, pedido) não destacam nenhuma. */
const sectionByPath: [prefix: string, section: Section][] = [
  ['/favoritos', 'favorites'],
  ['/carrinho', 'cart'],
  ['/pagamento', 'cart'],
  ['/perfil', 'account'],
]

function sectionOf(pathname: string): Section | null {
  if (pathname === '/') return 'home'
  return sectionByPath.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? null
}

const itemClass = 'flex size-12 items-center justify-center rounded-full transition-colors hover:text-primary-light'
const iconClass = 'size-[22px] fill-current'

/** Navegação inferior do mobile, no lugar do cabeçalho das telas largas. */
export function MobileNav() {
  const pathname = useLocation({ select: (location) => location.pathname })
  // Lido da URL atual, e não do `useSearch`: depois do redirecionamento que segue o login,
  // o `useSearch` às vezes continuava devolvendo o parâmetro já removido da URL.
  const loginOpen = useLocation({ select: (location) => location.search.auth !== undefined })
  const session = useSession()
  // Com o login aberto, o destaque vai para a conta, que é o que o usuário está fazendo.
  const current = loginOpen ? 'account' : sectionOf(pathname)

  const tone = (section: Section) => (current === section ? 'text-text-accent' : 'text-brand-secondary')
  const currentPage = (section: Section) => (current === section ? 'page' : undefined)

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 grid h-[84px] grid-cols-5 place-items-center px-3 md:hidden"
    >
      {/* O fundo é uma camada própria para poder ter o recorte circular em volta do botão central. */}
      {/* Dentro do recorte, um véu escuro deixa o conteúdo da página aparecer só de leve. */}
      <span
        aria-hidden="true"
        className="bg-background/80 absolute inset-0 -z-10 [mask-image:radial-gradient(circle_42px_at_50%_0,black_41px,transparent_42px)]"
      />
      <span
        aria-hidden="true"
        className="bg-card absolute inset-0 -z-10 rounded-t-[40px] [mask-image:radial-gradient(circle_42px_at_50%_0,transparent_41px,black_42px)]"
      />
      <Link to="/" aria-label="Início" aria-current={currentPage('home')} className={cn(itemClass, tone('home'))}>
        <House className={iconClass} aria-hidden="true" />
      </Link>

      <Link
        to="/favoritos"
        aria-label="Favoritos"
        aria-current={currentPage('favorites')}
        className={cn(itemClass, tone('favorites'))}
      >
        <Heart className={iconClass} aria-hidden="true" />
      </Link>

      <Link
        to="/"
        hash="catalogo"
        // Sem isto, o roteador marcaria este link como página atual junto com "Início".
        activeOptions={{ includeHash: true }}
        aria-label="Explorar o catálogo"
        className="from-primary-light/95 to-primary/65 text-foreground relative -top-[42px] flex size-[58px] items-center justify-center rounded-full bg-linear-to-br transition-opacity hover:opacity-90"
      >
        <ScanLine className="size-6" strokeWidth={1.5} aria-hidden="true" />
      </Link>

      <CartLink className={cn(itemClass, tone('cart'))} iconClassName={iconClass} current={current === 'cart'} />

      {session.status === 'anonymous' ? (
        <Link
          to="."
          search={(previous) => ({ ...previous, auth: 'entrar' })}
          resetScroll={false}
          aria-label="Entrar"
          className={cn(itemClass, tone('account'))}
        >
          <User className={iconClass} aria-hidden="true" />
        </Link>
      ) : (
        <Link to="/perfil" aria-label="Perfil" aria-current={currentPage('account')} className={cn(itemClass, tone('account'))}>
          <User className={iconClass} aria-hidden="true" />
        </Link>
      )}
    </nav>
  )
}
