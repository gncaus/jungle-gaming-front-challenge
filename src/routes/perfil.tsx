import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLogout } from '@/features/auth/hooks/use-session'
import { requireSession } from '@/features/auth/search'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export const Route = createFileRoute('/perfil')({
  staticData: { requiresAuth: true },
  beforeLoad: requireSession,
  component: ProfilePage,
})

function ProfilePage() {
  const navigate = useNavigate()
  const { data: profile, error, isPending, refetch } = useProfile()
  const logout = useLogout()

  function leave() {
    logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })
  }

  return (
    <section className="page-container py-10" aria-labelledby="profile-title">
      <h1 id="profile-title" className="text-heading-sm font-bold">
        Perfil do colecionador
      </h1>

      {isPending && (
        <div className="mt-6 flex flex-col gap-3" aria-busy="true">
          <p role="status" className="sr-only">
            Carregando perfil…
          </p>
          <Skeleton className="h-6 w-64 max-w-full" />
          <Skeleton className="h-6 w-56 max-w-full" />
          <Skeleton className="h-6 w-72 max-w-full" />
        </div>
      )}

      {error && (
        <div role="alert" className="mt-6 flex flex-col items-start gap-3">
          <p className="text-sm">Não foi possível carregar o perfil. {error.message}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {profile && (
        <dl className="mt-6 grid max-w-xl gap-x-6 gap-y-3 text-sm sm:grid-cols-[180px_1fr]">
          <dt className="text-text-secondary">Nome de exibição</dt>
          <dd>{profile.displayName}</dd>
          <dt className="text-text-secondary">Nome de usuário</dt>
          <dd>{profile.username}</dd>
          <dt className="text-text-secondary">E-mail</dt>
          <dd>{profile.email}</dd>
        </dl>
      )}

      <Button variant="outline" className="mt-8" onClick={leave} disabled={logout.isPending}>
        {logout.isPending ? 'Saindo…' : 'Sair'}
      </Button>
    </section>
  )
}
