import { Link, useNavigate } from '@tanstack/react-router'
import { LogIn, LogOut, User } from 'lucide-react'
import { useLogout, useSession } from '@/features/auth/hooks/use-session'
import { Skeleton } from '@/shared/ui/skeleton'

const pillClass =
  'bg-primary text-primary-foreground hover:bg-primary-light flex h-[35px] items-center gap-1.5 rounded-sm px-2.5 text-base font-medium transition-colors'

/** Canto direito do cabeçalho: "Entrar" para visitantes; nome e "Sair" para quem tem sessão. */
export function AccountMenu() {
  const session = useSession()
  const logout = useLogout()
  const navigate = useNavigate()

  if (session.status === 'loading') {
    return <Skeleton className="h-[35px] w-[100px]" />
  }

  if (session.status === 'anonymous') {
    return (
      <Link to="." search={(previous) => ({ ...previous, auth: 'entrar' })} resetScroll={false} className={pillClass}>
        <LogIn className="size-5" aria-hidden="true" />
        Entrar
      </Link>
    )
  }

  const firstName = session.user.displayName.split(' ')[0] ?? session.user.displayName

  return (
    <div className="flex items-center gap-1">
      <Link to="/perfil" className={pillClass} aria-label={`Perfil de ${session.user.displayName}`}>
        <User className="size-5" aria-hidden="true" />
        <span className="max-w-24 truncate">{firstName}</span>
      </Link>
      <button
        type="button"
        onClick={() => logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })}
        disabled={logout.isPending}
        aria-label="Sair"
        className="hover:text-primary-light flex size-11 items-center justify-center rounded-sm transition-colors disabled:opacity-50"
      >
        <LogOut className="size-5" aria-hidden="true" />
      </button>
    </div>
  )
}
