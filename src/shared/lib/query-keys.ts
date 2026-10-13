/**
 * Raiz das chaves de dados privados. Toda consulta de dado do usuário começa por ela e pelo
 * id do dono, então o cache de um usuário nunca responde a outro.
 */
export function privateKey(userId: string, ...parts: readonly unknown[]) {
  return ['private', userId, ...parts] as const
}
