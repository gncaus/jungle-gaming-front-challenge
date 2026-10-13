import type { UserRecord } from '@/mocks/db/types'

/**
 * Usuários fictícios. As senhas estão documentadas no README e aqui só existe o hash
 * (PBKDF2-SHA256, 100.000 iterações), gerado com os mesmos parâmetros de domain/password.ts.
 */
export function buildUserFixtures(): UserRecord[] {
  return [
    {
      id: 'usr_ana',
      username: 'ana.colecionadora',
      email: 'ana@kurio.test',
      displayName: 'Ana Ribeiro',
      avatarUrl: null,
      password: {
        salt: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
        hash: '30aa52db9c6fff275874708675dc210911e6c819f3f98be1857aee4039135ba5',
        iterations: 100_000,
      },
    },
    {
      id: 'usr_bruno',
      username: 'bruno.nft',
      email: 'bruno@kurio.test',
      displayName: 'Bruno Tavares',
      avatarUrl: null,
      password: {
        salt: '0f1e2d3c4b5a69788796a5b4c3d2e1f0',
        hash: '4f11f253cf79294e3a61fb39feddd09ca9d9f6f104282aeb38a6fe5343814d10',
        iterations: 100_000,
      },
    },
  ]
}

/** Favoritos iniciais, por id de usuário. */
export function buildFavoriteFixtures(): Record<string, string[]> {
  return {
    usr_ana: ['neon-vessel-552', 'royal-emerald-003'],
  }
}
