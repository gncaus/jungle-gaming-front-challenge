import {
  authResultSchema,
  sessionSchema,
  type AuthResult,
  type LoginInput,
  type RegisterInput,
  type Session,
} from '@/features/auth/schemas'
import { http } from '@/shared/lib/http'

export async function register(input: RegisterInput): Promise<AuthResult> {
  const { data } = await http.post<unknown>('/auth/register', input)
  return authResultSchema.parse(data)
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const { data } = await http.post<unknown>('/auth/login', input)
  return authResultSchema.parse(data)
}

export async function fetchSession(signal?: AbortSignal): Promise<Session> {
  const { data } = await http.get<unknown>('/auth/session', { signal })
  return sessionSchema.parse(data)
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout')
}
