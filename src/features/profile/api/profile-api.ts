import {
  profileSchema,
  type AvatarInput,
  type PasswordChange,
  type Profile,
  type ProfileInput,
} from '@/features/profile/schemas'
import { http } from '@/shared/lib/http'

export async function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  const { data } = await http.get<unknown>('/profile', { signal })
  return profileSchema.parse(data)
}

export async function updateProfile(input: ProfileInput): Promise<Profile> {
  const { data } = await http.patch<unknown>('/profile', input)
  return profileSchema.parse(data)
}

export async function uploadAvatar(input: AvatarInput): Promise<Profile> {
  const { data } = await http.put<unknown>('/profile/avatar', input)
  return profileSchema.parse(data)
}

export async function removeAvatar(): Promise<Profile> {
  const { data } = await http.delete<unknown>('/profile/avatar')
  return profileSchema.parse(data)
}

export async function changePassword(input: PasswordChange): Promise<void> {
  await http.put('/profile/password', input)
}
