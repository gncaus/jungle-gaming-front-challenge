import { useForm } from 'react-hook-form'
import { useChangePassword } from '@/features/profile/hooks/use-profile'
import { passwordChangeSchema, type PasswordChange } from '@/features/profile/schemas'
import { announce } from '@/shared/lib/announce'
import { applyApiError } from '@/shared/lib/form-errors'
import { zodResolver } from '@/shared/lib/zod-resolver'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'

const emptyValues: PasswordChange = { currentPassword: '', newPassword: '', confirmPassword: '' }

/** Troca de senha. A sessão atual continua; a API encerra as demais sessões da conta. */
export function PasswordForm() {
  const change = useChangePassword()
  const form = useForm<PasswordChange>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: emptyValues,
  })
  const { errors } = form.formState

  const submit = form.handleSubmit((input) => {
    if (change.isPending) return
    change.mutate(input, {
      onSuccess: () => {
        form.reset(emptyValues)
        announce('Senha alterada.')
      },
      onError: (error) => applyApiError(form, error),
    })
  })

  return (
    <form onSubmit={submit} noValidate aria-labelledby="password-title" className="flex max-w-[417px] flex-col gap-5">
      <h2 id="password-title" className="text-base font-bold">
        Alterar senha
      </h2>
      <p role="alert" className="text-text-coral text-sm empty:hidden">
        {errors.root?.message}
      </p>
      <TextField
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...form.register('currentPassword')}
      />
      <TextField
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...form.register('newPassword')}
      />
      <TextField
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...form.register('confirmPassword')}
      />
      <div>
        <Button type="submit" disabled={change.isPending}>
          {change.isPending ? 'Alterando…' : 'Alterar senha'}
        </Button>
      </div>
    </form>
  )
}
