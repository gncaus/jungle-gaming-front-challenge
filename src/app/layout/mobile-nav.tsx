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
      className="bg-card fixed inset-x-0 bottom-0 z-40 grid h-20 grid-cols-5 place-items-center rounded-t-[36px] px-3 md:hidden"
    >
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
        className="from-primary-light to-primary-dark text-primary-foreground border-background -mt-20 flex size-19 items-center justify-center rounded-full border-[6px] bg-linear-to-b transition-opacity hover:opacity-90"
      >
        <ScanLine className="size-7" aria-hidden="true" />
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
