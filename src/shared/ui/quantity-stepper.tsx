import { Minus, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface QuantityStepperProps {
  value: number
  /** Maior quantidade permitida; 0 desabilita o controle. */
  max: number
  onChange: (value: number) => void
  /** Descreve o que está sendo contado, para leitores de tela (ex.: "Quantidade de Emerald Ape"). */
  label: string
  disabled?: boolean
  /** `sm` é o controle compacto das linhas do carrinho. */
  size?: 'md' | 'sm'
}

const buttonClass =
  'bg-primary text-primary-foreground hover:bg-primary-light flex items-center justify-center transition-colors disabled:opacity-40 disabled:hover:bg-primary'

const sizes = {
  md: { button: 'h-12 w-8 rounded-xl', icon: 'size-5', value: 'min-w-8 text-lg' },
  // No mobile, as linhas do carrinho usam círculos discretos, como no layout.
  sm: {
    button:
      'size-7 rounded-full max-md:border max-md:border-border-soft max-md:bg-surface-raised max-md:text-foreground max-md:hover:bg-surface-dark max-md:disabled:hover:bg-surface-raised',
    icon: 'size-4',
    value: 'min-w-7 text-base',
  },
}

/** Quantidade inteira entre 1 e `max`, com botões de menos e mais. */
export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  disabled = false,
  size = 'md',
}: QuantityStepperProps) {
  const locked = disabled || max < 1
  const style = sizes[size]

  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      <button
        type="button"
        className={cn(buttonClass, style.button)}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Diminuir quantidade"
      >
        <Minus className={style.icon} aria-hidden="true" />
      </button>
      <output aria-live="polite" className={cn('text-center', style.value)}>
        {value}
      </output>
      <button
        type="button"
        className={cn(buttonClass, style.button)}
        onClick={() => onChange(value + 1)}
        disabled={locked || value >= max}
        aria-label="Aumentar quantidade"
      >
        <Plus className={style.icon} aria-hidden="true" />
      </button>
    </div>
  )
}
