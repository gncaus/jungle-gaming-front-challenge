import { profileSchema, type Profile } from '@/features/profile/schemas'
import { http } from '@/shared/lib/http'

export async function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  const { data } = await http.get<unknown>('/profile', { signal })
  return profileSchema.parse(data)
}
