import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import { fetchProfile } from '@/features/profile/api/profile-api'
import { privateKey } from '@/shared/lib/query-keys'

export const profileKeys = {
  detail: (userId: string) => privateKey(userId, 'profile'),
}

/** Perfil do usuário da sessão. Só consulta depois de saber de quem é a sessão. */
export function useProfile() {
  const { user } = useSession()
  return useQuery({
    queryKey: profileKeys.detail(user?.id ?? ''),
    queryFn: ({ signal }) => fetchProfile(signal),
    enabled: user !== null,
  })
}
