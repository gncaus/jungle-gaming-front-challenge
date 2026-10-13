import type { UseMutationResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { useLogin, useRegister } from '@/features/auth/hooks/use-session'
import {
  loginInputSchema,
  registerInputSchema,
  type LoginInput,
  type RegisterInput,
} from '@/features/auth/schemas'
import { applyApiError } from '@/shared/lib/form-errors'
import { zodResolver } from '@/shared/lib/zod-resolver'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'

function FormError({ message }: { message?: string }) {
  return (
    <p role="alert" className="text-text-coral text-center text-sm empty:hidden">
      {message}
    </p>
  )
}

type AuthMutation<Input> = UseMutationResult<unknown, Error, Input>

function submitWith<Values extends FieldValues>(form: UseFormReturn<Values>, mutation: AuthMutation<Values>) {
  return form.handleSubmit((values) => {
    if (mutation.isPending) return
    mutation.mutate(values, { onError: (error) => applyApiError(form, error) })
  })
}

interface LoginFormProps {
  /** Conteúdo entre o campo de senha e o botão (no layout, "Esqueceu a senha?"). */
  afterPassword?: ReactNode
}

export function LoginForm({ afterPassword }: LoginFormProps) {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: '', password: '' },
  })
  const login = useLogin()
  const { errors } = form.formState

  return (
    <form onSubmit={submitWith(form, login)} noValidate className="flex flex-col gap-3">
      <FormError message={errors.root?.message} />
      <TextField
        label="E-mail"
        hideLabel
        type="email"
        placeholder="contato@email.com"
        autoComplete="email"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <TextField
        label="Senha"
        hideLabel
        type="password"
        placeholder="Senha"
        autoComplete="current-password"
        error={errors.password?.message}
        {...form.register('password')}
      />
      {afterPassword}
      <Button type="submit" size="lg" className="mt-4 h-[60px] w-full rounded-xl md:mt-3 md:h-[45px] md:rounded-sm" disabled={login.isPending}>
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

export function RegisterForm() {
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })
  const register = useRegister()
  const { errors } = form.formState

  return (
    <form onSubmit={submitWith(form, register)} noValidate className="flex flex-col gap-3">
      <FormError message={errors.root?.message} />
      <TextField
        label="Nome de usuário"
        hideLabel
        placeholder="Nome de usuário"
        autoComplete="username"
        error={errors.username?.message}
        {...form.register('username')}
      />
      <TextField
        label="E-mail"
        hideLabel
        type="email"
        placeholder="Digite seu e-mail"
        autoComplete="email"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <TextField
        label="Senha"
        hideLabel
        type="password"
        placeholder="Senha"
        autoComplete="new-password"
        error={errors.password?.message}
        {...form.register('password')}
      />
      <TextField
        label="Confirmar senha"
        hideLabel
        type="password"
        placeholder="Confirmar senha"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...form.register('confirmPassword')}
      />
      <Button type="submit" size="lg" className="mt-7 h-[60px] w-full rounded-xl md:mt-6 md:h-[45px] md:rounded-sm" disabled={register.isPending}>
        {register.isPending ? 'Criando…' : 'Criar conta'}
      </Button>
    </form>
  )
}
