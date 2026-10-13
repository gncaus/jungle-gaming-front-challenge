import { redirect, type ParsedLocation } from '@tanstack/react-router'
import { z } from 'zod'
import { getToken } from '@/shared/lib/credentials'

export const authModes = ['entrar', 'criar-conta'] as const
export type AuthMode = (typeof authModes)[number]

/**
 * Parâmetros de URL do diálogo de login e cadastro, válidos em qualquer rota.
 * Como ficam na URL, o diálogo sobrevive a refresh e fecha com o botão voltar.
 */
export const authSearchSchema = z.object({
  auth: z.enum(authModes).optional().catch(undefined),
  /** Endereço interno para onde ir depois de entrar. */
  redirect: z.string().optional().catch(undefined),
  /** O diálogo abriu porque a sessão expirou. */
  expired: z.boolean().optional().catch(undefined),
})

/** Só caminhos internos são aceitos como destino, para o parâmetro não virar redirecionamento aberto. */
export function safeRedirect(target: string | undefined): string | null {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : null
}

/**
 * Para o `beforeLoad` de rotas privadas: sem sessão, leva à página inicial com o login
 * aberto e o endereço de retorno.
 */
export function requireSession({ location }: { location: ParsedLocation }): void {
  if (!getToken()) {
    throw redirect({ to: '/', search: { auth: 'entrar', redirect: location.href } })
  }
}
