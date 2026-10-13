import { Link, useLocation } from '@tanstack/react-router'
import { House, ScanLine, User } from 'lucide-react'
import { useSession } from '@/features/auth/hooks/use-session'
import { cn } from '@/shared/lib/utils'

const itemClass = 'flex size-12 items-center justify-center rounded-full transition-colors hover:text-primary-light'

/** Navegação inferior do mobile, no lugar do cabeçalho das telas largas. */
export function MobileNav() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const session = useSession()

  return (
    <nav
      aria-label="Principal"
      className="bg-card fixed inset-x-0 bottom-0 z-40 flex h-[72px] items-center justify-around rounded-t-[28px] border-t px-6 md:hidden"
    >
      <Link
        to="/"
        aria-label="Início"
        aria-current={pathname === '/' ? 'page' : undefined}
        className={cn(itemClass, pathname === '/' ? 'text-primary' : 'text-brand-secondary')}
      >
        <House className="size-6" aria-hidden="true" />
      </Link>

      <Link
        to="/"
        hash="catalogo"
        aria-label="Explorar o catálogo"
        className="bg-primary text-primary-foreground hover:bg-primary-light border-background -mt-9 flex size-16 items-center justify-center rounded-full border-4 transition-colors"
      >
        <ScanLine className="size-7" aria-hidden="true" />
      </Link>

      {session.status === 'anonymous' ? (
        <Link
          to="."
          search={(previous) => ({ ...previous, auth: 'entrar' })}
          resetScroll={false}
          aria-label="Entrar"
          className={cn(itemClass, 'text-brand-secondary')}
        >
          <User className="size-6" aria-hidden="true" />
        </Link>
      ) : (
        <Link
          to="/perfil"
          aria-label="Perfil"
          aria-current={pathname === '/perfil' ? 'page' : undefined}
          className={cn(itemClass, pathname === '/perfil' ? 'text-primary' : 'text-brand-secondary')}
        >
          <User className="size-6" aria-hidden="true" />
        </Link>
      )}
    </nav>
  )
}
