import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'
import { HttpError } from '@/shared/lib/http'

/**
 * Leva os erros por campo da API para os campos do formulário e foca o primeiro.
 * O que não pertence a nenhum campo vira a mensagem geral (`errors.root`).
 */
export function applyApiError<Values extends FieldValues, Output>(
  form: UseFormReturn<Values, unknown, Output>,
  error: unknown,
): void {
  const fields = error instanceof HttpError ? error.fields : undefined
  const known = Object.keys(form.getValues())
  let focused = false
  for (const [field, message] of Object.entries(fields ?? {})) {
    if (!known.includes(field)) continue
    form.setError(field as FieldPath<Values>, { message }, { shouldFocus: !focused })
    focused = true
  }
  if (!focused) {
    form.setError('root', {
      message: error instanceof Error ? error.message : 'Algo deu errado. Tente novamente.',
    })
  }
}
