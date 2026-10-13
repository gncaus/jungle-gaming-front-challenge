import type { DbState, UserRecord } from '@/mocks/db/types'

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
      ensName: 'anaribeiro',
      walletNickname: 'Cofre principal',
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
      ensName: '',
      walletNickname: '',
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

/** Carteiras iniciais: Ana já tem a principal cadastrada (desconectada); Bruno não tem nenhuma. */
export function buildWalletFixtures(): DbState['wallets'] {
  return {
    usr_ana: {
      primary: {
        displayName: 'Ana Ribeiro',
        nickname: 'Cofre principal',
        network: 'ethereum',
        profileName: 'Ana Colecionadora',
        address: '0x7A42c0ffee254729296a45a3885639AC7E1019E8',
        secondaryAddress: '',
        provider: 'metamask',
        referralCode: 'KURIO-2026',
        email: 'ana@kurio.test',
        ensName: 'anaribeiro',
        connection: 'disconnected',
        updatedAt: '2026-07-01T12:00:00.000Z',
      },
    },
  }
}
