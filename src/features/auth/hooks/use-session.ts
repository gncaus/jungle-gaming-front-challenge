import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { fetchSession, login, logout, register } from '@/features/auth/api/auth-api'
import type { SessionUser } from '@/features/auth/schemas'
import { endSession, sessionKey, startSession } from '@/features/auth/session'
import { getToken, subscribeToToken } from '@/shared/lib/credentials'

export function useToken(): string | null {
  return useSyncExternalStore(subscribeToToken, getToken)
}

export type SessionState =
  | { status: 'anonymous'; user: null }
  /** Há um token guardado e a API ainda não confirmou de quem é. */
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: SessionUser }

/** Sessão atual. Recuperada do token guardado quando a página é recarregada. */
export function useSession(): SessionState {
  const token = useToken()
  const { data } = useQuery({
    queryKey: sessionKey(token ?? ''),
    queryFn: ({ signal }) => fetchSession(signal),
    enabled: token !== null,
    staleTime: 5 * 60_000,
  })

  if (!token) return { status: 'anonymous', user: null }
  return data ? { status: 'authenticated', user: data.user } : { status: 'loading', user: null }
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (result) => startSession(queryClient, result),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: register,
    onSuccess: (result) => startSession(queryClient, result),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    // A sessão local termina mesmo se o aviso ao servidor falhar: o usuário pediu para sair.
    onSettled: () => endSession(queryClient),
  })
}
