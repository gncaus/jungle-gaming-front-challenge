import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/search'
import { ProfileNav } from '@/features/profile/components/profile-nav'

export const Route = createFileRoute('/perfil')({
  staticData: { requiresAuth: true },
  beforeLoad: requireSession,
  component: AccountLayout,
})

/** Área do colecionador: a navegação fica fixa e cada seção é uma rota filha. */
function AccountLayout() {
  return (
    <div className="page-container grid gap-7 py-6 md:grid-cols-[220px_minmax(0,1fr)] md:py-8 lg:grid-cols-[310px_minmax(0,1fr)]">
      <ProfileNav />
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
