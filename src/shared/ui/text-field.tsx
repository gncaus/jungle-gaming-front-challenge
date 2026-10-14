import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

interface TextFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  label: string
  /** Mensagem de erro do campo; quando presente, o campo é anunciado como inválido. */
  error?: string
  /** O layout de login mostra só o placeholder; o rótulo continua existindo para leitores de tela. */
  hideLabel?: boolean
  /** Complemento do rótulo lido só por leitores de tela, como "(sem o .eth)". */
  labelHint?: string
  /** Texto fixo exibido em uma caixa antes do campo, como o sufixo ".eth" do ENS no layout. */
  adornment?: string
}

/**
 * Campo de texto com rótulo e erro associados (`aria-invalid` e `aria-describedby`).
 * Campos de senha ganham o botão de mostrar e ocultar.
 */
export function TextField({
  label,
  error,
  hideLabel = false,
  labelHint,
  adornment,
  type = 'text',
  className,
  ...props
}: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className={className}>
      <label htmlFor={id} className={cn('mb-2 block text-sm md:text-[15px]', hideLabel && 'sr-only')}>
        {label}
        {labelHint && <span className="sr-only"> {labelHint}</span>}
        {props.required && (
          <span className="text-text-coral" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative flex gap-2.5">
        {adornment && (
          <span
            aria-hidden="true"
            className="bg-background md:bg-card flex h-12 shrink-0 items-center rounded-lg border px-3 text-sm md:h-10 md:rounded-sm"
          >
            {adornment}
          </span>
        )}
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'bg-background md:bg-card placeholder:text-brand-secondary h-12 w-full min-w-0 rounded-lg border px-4 text-sm md:h-10 md:rounded-sm',
            'focus-visible:border-primary',
            error && 'border-error',
            isPassword && 'pr-12',
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-pressed={revealed}
            aria-label={`Mostrar ${label.toLowerCase()}`}
            className="text-brand-secondary hover:text-primary absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-sm transition-colors"
          >
            {revealed ? <Eye className="size-5" aria-hidden="true" /> : <EyeOff className="size-5" aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-text-coral mt-1.5 text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
