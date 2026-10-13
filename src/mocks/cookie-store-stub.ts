/**
 * Substituto vazio da biblioteca `tough-cookie`, usado só pelo MSW (ver `resolve.alias`
 * em vite.config.ts).
 *
 * O MSW usa essa biblioteca para guardar cookies de respostas simuladas. A API deste
 * projeto não usa cookies (a sessão trafega em header), mas a biblioteca traz embutida
 * a lista pública de sufixos de domínio: com ela, o JavaScript do mock no carregamento
 * inicial tinha 175 KB comprimidos; sem ela, 54 KB. O que está abaixo é só o que o MSW chama.
 */
export const Cookie = {
  fromJSON: (): undefined => undefined,
}

export class MemoryCookieStore {
  idx: Record<string, never> = {}
}

export class CookieJar {
  getCookiesSync(): never[] {
    return []
  }

  async setCookie(): Promise<void> {}
}
