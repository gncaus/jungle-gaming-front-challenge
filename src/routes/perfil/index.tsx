import { createFileRoute } from '@tanstack/react-router'
import { PasswordForm } from '@/features/profile/components/password-form'
import { ProfileForm } from '@/features/profile/components/profile-form'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export const Route = createFileRoute('/perfil/')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: profile, error, isPending, refetch } = useProfile()

  return (
    <section aria-labelledby="profile-title">
      <h1 id="profile-title" className="mb-6 text-base font-bold">
        Perfil do colecionador
      </h1>

      {isPending && (
        <div className="grid gap-x-7 gap-y-5 md:grid-cols-2" aria-busy="true">
          <p role="status" className="sr-only">
            Carregando perfil…
          </p>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-[76px] md:h-[68px]" />
          ))}
        </div>
      )}

      {error && !profile && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-sm">Não foi possível carregar o perfil. {error.message}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {profile && (
        <div className="flex flex-col gap-10">
          <ProfileForm profile={profile} />
          <PasswordForm />
        </div>
      )}
    </section>
  )
}
