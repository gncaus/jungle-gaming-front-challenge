import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  value: number
  /** Maior quantidade permitida; 0 desabilita o controle. */
  max: number
  onChange: (value: number) => void
  /** Descreve o que está sendo contado, para leitores de tela (ex.: "Quantidade de Emerald Ape"). */
  label: string
  disabled?: boolean
}

const buttonClass =
  'bg-primary text-primary-foreground hover:bg-primary-light flex h-12 w-8 items-center justify-center rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-primary'

/** Quantidade inteira entre 1 e `max`, com botões de menos e mais. */
export function QuantityStepper({ value, max, onChange, label, disabled = false }: QuantityStepperProps) {
  const locked = disabled || max < 1

  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value - 1)}
        disabled={locked || value <= 1}
        aria-label="Diminuir quantidade"
      >
        <Minus className="size-5" aria-hidden="true" />
      </button>
      <output aria-live="polite" className="min-w-8 text-center text-lg">
        {value}
      </output>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value + 1)}
        disabled={locked || value >= max}
        aria-label="Aumentar quantidade"
      >
        <Plus className="size-5" aria-hidden="true" />
      </button>
    </div>
  )
}
