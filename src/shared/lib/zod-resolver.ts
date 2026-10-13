import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import type { z } from 'zod'

/**
 * Liga um schema zod ao react-hook-form: o mesmo schema que valida o contrato da API
 * valida o formulário, e cada erro vai para o campo de origem.
 */
export function zodResolver<Schema extends z.ZodType<FieldValues, FieldValues>>(
  schema: Schema,
): Resolver<z.input<Schema>, unknown, z.output<Schema>> {
  return (values) => {
    const result = schema.safeParse(values)
    if (result.success) {
      return { values: result.data, errors: {} }
    }
    const errors: Record<string, { type: string; message: string }> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      errors[field] ??= { type: issue.code, message: issue.message }
    }
    return { values: {}, errors: errors as FieldErrors<z.input<Schema>> }
  }
}
