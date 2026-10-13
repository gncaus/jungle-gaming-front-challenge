import Decimal from 'decimal.js'
import { z } from 'zod'

/** Valor em ETH como string decimal, sem expoente e com até 18 casas. Nunca `number`. */
export const ethAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,18})?$/, 'Valor em ETH inválido')

export type EthAmount = z.infer<typeof ethAmountSchema>

export function eth(value: EthAmount): Decimal {
  return new Decimal(value)
}

export function toEthAmount(value: Decimal): EthAmount {
  return value.toFixed()
}
