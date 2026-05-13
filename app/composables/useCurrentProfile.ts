import type { UserRole } from '~/constants/domain'
import type { Database } from '~/types/supabase'

type CurrentProfile = Database['public']['Tables']['users']['Row']

export function useCurrentProfile() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const profile = useState<CurrentProfile | null>('current-profile', () => null)
  const role = useState<UserRole | null>('current-role', () => null)
  const isLoading = useState<boolean>('current-profile-loading', () => false)

  const loadProfile = async () => {
    if (!user.value) {
      profile.value = null
      role.value = null
      return null
    }

    isLoading.value = true

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, student_id, phone_number, avatar_url')
        .eq('id', user.value.id || (user.value as any).sub)
        .single()

      if (error) {
        throw error
      }

      profile.value = data
      role.value = data.role as UserRole
      return profile.value
    } finally {
      isLoading.value = false
    }
  }

  const clearProfile = () => {
    profile.value = null
    role.value = null
  }

  return {
    profile,
    role,
    isLoading,
    loadProfile,
    clearProfile
  }
}
