import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { AvatarField } from '@/features/profile/components/avatar-field'
import { useUpdateProfile } from '@/features/profile/hooks/use-profile'
import { profileInputSchema, type Profile, type ProfileInput } from '@/features/profile/schemas'
import { announce } from '@/shared/lib/announce'
import { applyApiError } from '@/shared/lib/form-errors'
import { zodResolver } from '@/shared/lib/zod-resolver'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'

type ProfileValues = z.output<typeof profileInputSchema>

function toValues({ displayName, username, email, ensName, walletNickname }: Profile): ProfileInput {
  return { displayName, username, email, ensName, walletNickname }
}

/** Dados do colecionador. Os campos e as regras são os do contrato da API. */
export function ProfileForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const form = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileInputSchema),
    defaultValues: toValues(profile),
  })
  const { errors } = form.formState

  const submit = form.handleSubmit((input) => {
    if (update.isPending) return
    update.mutate(input, {
      onSuccess: (saved) => {
        form.reset(toValues(saved))
        announce('Perfil salvo.')
      },
      onError: (error) => applyApiError(form, error),
    })
  })

  return (
    <form onSubmit={submit} noValidate aria-labelledby="profile-title" className="grid gap-x-7 gap-y-5 md:grid-cols-2">
      <p role="alert" className="text-text-coral text-sm empty:hidden md:col-span-2">
        {errors.root?.message}
      </p>
      <TextField
        label="Nome de exibição"
        required
        autoComplete="name"
        error={errors.displayName?.message}
        {...form.register('displayName')}
      />
      <TextField
        label="Nome de usuário"
        required
        autoComplete="username"
        spellCheck={false}
        error={errors.username?.message}
        {...form.register('username')}
      />
      <TextField
        label="E-mail"
        required
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <TextField
        label="Nome ENS (sem o .eth)"
        required
        autoComplete="off"
        spellCheck={false}
        error={errors.ensName?.message}
        {...form.register('ensName')}
      />
      <TextField
        label="Apelido da carteira"
        required
        autoComplete="off"
        error={errors.walletNickname?.message}
        {...form.register('walletNickname')}
      />
      <AvatarField avatarUrl={profile.avatarUrl} />
      <div className="md:col-span-2">
        <Button type="submit" className="min-w-[131px]" disabled={update.isPending}>
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
