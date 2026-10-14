import { Link, useNavigate } from '@tanstack/react-router'
import { Download, Heart, LifeBuoy, LogOut, MapPin, ShoppingCart, Tag, User } from 'lucide-react'
import { useLogout } from '@/features/auth/hooks/use-session'

const itemClass =
  'flex h-11 items-center gap-3 border-b-2 border-transparent px-3 text-sm whitespace-nowrap md:h-[45px] md:border-b-0 md:border-l-[6px] md:px-2.5 [&_svg]:shrink-0'
const linkClass = `${itemClass} text-text-accent hover:text-primary-light transition-colors`
const activeProps = { className: 'border-primary!', 'aria-current': 'page' } as const

/** Seções do layout que estão fora do escopo da entrega. */
const upcomingSections = [
  { label: 'Ofertas', icon: Tag },
  { label: 'Arquivos baixados', icon: Download },
  { label: 'Suporte', icon: LifeBuoy },
]

/**
 * Navegação da área do colecionador: coluna lateral a partir de 768 px e faixa de abas no
 * mobile, onde as seções ainda indisponíveis não aparecem.
 */
export function ProfileNav() {
  const navigate = useNavigate()
  const logout = useLogout()

  return (
    <aside className="bg-card self-start md:pt-4">
      <h2 className="hidden px-2.5 text-lg font-bold md:block">Meu perfil</h2>
      <nav aria-label="Meu perfil">
        <ul className="flex md:mt-1 md:flex-col">
          <li>
            <Link to="/perfil" activeOptions={{ exact: true }} activeProps={activeProps} className={linkClass}>
              <User className="hidden size-5 md:block" aria-hidden="true" />
              Dados do perfil
            </Link>
          </li>
          <li>
            <Link to="/perfil/carteiras" activeProps={activeProps} className={linkClass}>
              <MapPin className="hidden size-5 md:block" aria-hidden="true" />
              Carteiras
            </Link>
          </li>
          <li className="hidden md:block">
            <span aria-disabled="true" className={`${itemClass} text-brand-secondary cursor-default`}>
              <ShoppingCart className="size-5" aria-hidden="true" />
              Atividade
              <span className="sr-only"> (em breve)</span>
            </span>
          </li>
          {/* No mobile, os favoritos estão na barra de navegação inferior. */}
          <li className="hidden md:block">
            <Link to="/favoritos" className={linkClass}>
              <Heart className="size-5" aria-hidden="true" />
              Lista de interesse
            </Link>
          </li>
          {upcomingSections.map(({ label, icon: Icon }) => (
            <li key={label} className="hidden md:block">
              <span aria-disabled="true" className={`${itemClass} text-brand-secondary cursor-default`}>
                <Icon className="size-5" aria-hidden="true" />
                {label}
                <span className="sr-only"> (em breve)</span>
              </span>
            </li>
          ))}
          <li className="ml-auto md:ml-0 md:border-t">
            <button
              type="button"
              onClick={() => logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })}
              disabled={logout.isPending}
              className={`${linkClass} w-full font-bold disabled:opacity-50`}
            >
              <LogOut className="size-5" aria-hidden="true" />
              {logout.isPending ? 'Saindo…' : 'Sair'}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  )
}
