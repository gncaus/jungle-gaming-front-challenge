import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { LoginForm, RegisterForm } from '@/features/auth/components/auth-forms'
import { safeRedirect, type AuthMode } from '@/features/auth/search'
import { cn } from '@/shared/lib/utils'
import { FacebookIcon, GoogleIcon } from '@/shared/ui/brand-icons'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

const copy: Record<AuthMode, { title: string; description: string }> = {
  entrar: {
    title: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  },
  'criar-conta': {
    title: 'Criar perfil de colecionador',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
  },
}

const tabs: { mode: AuthMode; label: string }[] = [
  { mode: 'entrar', label: 'Entrar' },
  { mode: 'criar-conta', label: 'Criar conta' },
]

/** Ações do layout que estão fora do escopo da entrega: respondem com um aviso, sem simular sucesso. */
const unavailable = {
  google: 'Entrar com o Google não está disponível nesta demonstração.',
  facebook: 'Entrar com o Facebook não está disponível nesta demonstração.',
  password: 'A recuperação de senha não está disponível nesta demonstração.',
}

const socialButtonClass =
  'text-text-secondary hover:border-primary flex h-10 w-full items-center justify-center gap-3 rounded-sm border text-[13px] font-medium transition-colors'

interface AuthDialogProps {
  mode: AuthMode
  /** Endereço interno para onde ir depois de entrar; sem ele, o diálogo só fecha. */
  redirect?: string
  /** O diálogo abriu porque a sessão expirou. */
  expired?: boolean
}

/**
 * Login e cadastro. O estado vem da URL (`?auth=`), então o diálogo sobrevive a refresh
 * e fecha com o botão voltar. No mobile ocupa a tela inteira, como nos frames.
 */
export function AuthDialog({ mode, redirect, expired = false }: AuthDialogProps) {
  const navigate = useNavigate()
  const router = useRouter()
  const [notice, setNotice] = useState('')

  function close() {
    void navigate({
      to: '.',
      search: (previous) => ({ ...previous, auth: undefined, redirect: undefined, expired: undefined }),
      replace: true,
      resetScroll: false,
    })
  }

  function finish() {
    const target = safeRedirect(redirect)
    if (target) {
      router.history.replace(target)
    } else {
      close()
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="md:border-primary px-7 pt-28 pb-10 md:border-b-[10px] md:px-20 md:pt-12 md:pb-16">
        <p className="mb-24 text-center text-[32px] font-bold tracking-widest md:hidden" aria-hidden="true">
          KURIO
        </p>

        <nav aria-label="Entrar ou criar conta" className="hidden justify-center text-xl md:flex">
          {tabs.map((tab, index) => (
            <Link
              key={tab.mode}
              to="."
              search={(previous) => ({ ...previous, auth: tab.mode })}
              replace
              resetScroll={false}
              aria-current={tab.mode === mode ? 'page' : undefined}
              className={cn(
                'hover:text-primary-light px-2 leading-5 transition-colors',
                index > 0 && 'border-primary border-l',
                tab.mode === mode && 'text-text-accent',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <DialogTitle className="text-center text-lg md:sr-only">{copy[mode].title}</DialogTitle>
        <div className="md:-mx-10 md:mt-9">
          <DialogDescription className="sr-only text-center md:not-sr-only">
            {copy[mode].description}
          </DialogDescription>
        </div>

        {expired && (
          <p role="status" className="text-text-accent mt-4 text-center text-sm">
            Sua sessão expirou. Entre novamente para continuar.
          </p>
        )}

        <div className="mt-6 md:mt-4">
          {mode === 'entrar' ? (
            <LoginForm
              onSuccess={finish}
              afterPassword={
                <button
                  type="button"
                  onClick={() => setNotice(unavailable.password)}
                  className="text-text-accent hover:text-primary-light self-end rounded-sm text-sm md:text-[13px]"
                >
                  Esqueceu a senha?
                </button>
              }
            />
          ) : (
            <RegisterForm onSuccess={finish} />
          )}
        </div>

        <p className="before:bg-border after:bg-border mt-8 flex items-center gap-3 text-[13px] before:h-px before:flex-1 after:h-px after:flex-1 md:-mx-20 md:mt-7">
          Ou continue com
        </p>
        <div className="mt-3 flex flex-col gap-3">
          <button type="button" className={socialButtonClass} onClick={() => setNotice(unavailable.google)}>
            <GoogleIcon className="size-5" />
            Continuar com Google
          </button>
          <button type="button" className={socialButtonClass} onClick={() => setNotice(unavailable.facebook)}>
            <FacebookIcon className="size-5 text-[#4267b2]" />
            Continuar com Facebook
          </button>
        </div>
        <p role="status" className="text-text-accent mt-3 min-h-5 text-center text-xs">
          {notice}
        </p>

        <p className="text-brand-secondary mt-8 text-center text-sm md:hidden">
          {mode === 'entrar' ? 'Novo na Kurio? ' : 'Já tem uma conta? '}
          <Link
            to="."
            search={(previous) => ({ ...previous, auth: mode === 'entrar' ? 'criar-conta' : 'entrar' })}
            replace
            resetScroll={false}
            className="hover:text-primary-light underline underline-offset-4"
          >
            {mode === 'entrar' ? 'Crie uma conta' : 'Entre'}
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  )
}
