import { ChevronDown } from 'lucide-react'
import { useId, type ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

interface SelectFieldProps extends Omit<ComponentProps<'select'>, 'id'> {
  label: string
  placeholder: string
  options: { value: string; label: string }[]
  error?: string
}

/** Lista de opções nativa, com rótulo e erro associados como em `TextField`. */
export function SelectField({ label, placeholder, options, error, className, ...props }: SelectFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm">
        {label}
        {props.required && (
          <span className="text-text-coral" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'bg-background md:bg-card h-12 w-full cursor-pointer appearance-none rounded-lg border pr-10 pl-4 text-sm md:h-10 md:rounded-sm',
            'focus-visible:border-primary',
            error && 'border-error',
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="text-brand-secondary pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p id={errorId} className="text-text-coral mt-1.5 text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
