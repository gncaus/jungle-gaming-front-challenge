import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession, useToken } from '@/features/auth/hooks/use-session'
import { sessionKey } from '@/features/auth/session'
import {
  changePassword,
  fetchProfile,
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from '@/features/profile/api/profile-api'
import type { Profile } from '@/features/profile/schemas'
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

/** Toda mutation de perfil responde com o perfil atualizado, que vai direto para o cache. */
function useProfileMutation<Input>(mutationFn: (input: Input) => Promise<Profile>) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const token = useToken()

  return useMutation({
    mutationFn,
    onSuccess: (profile) => {
      if (user) queryClient.setQueryData(profileKeys.detail(user.id), profile)
      // O cabeçalho mostra o nome que vem da sessão.
      if (token) void queryClient.invalidateQueries({ queryKey: sessionKey(token) })
    },
  })
}

export function useUpdateProfile() {
  return useProfileMutation(updateProfile)
}

export function useUploadAvatar() {
  return useProfileMutation(uploadAvatar)
}

export function useRemoveAvatar() {
  return useProfileMutation(removeAvatar)
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}
