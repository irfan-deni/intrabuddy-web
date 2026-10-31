import type { UserRole } from '~/constants/domain'
import type { Database } from '~/types/supabase'

type CurrentProfile = Database['public']['Tables']['users']['Row']

export function useCurrentProfile() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const profile = useState<CurrentProfile | null>('current-profile', () => null)
  const role = useState<UserRole | null>('current-role', () => null)
  const isLoading = useState<boolean>('current-profile-loading', () => false)
  const superCoordinator = useState<boolean>('current-super-coordinator', () => false)
  const requestFetch = useRequestFetch()
  const pageCache = usePageCache()

  const loadProfile = async (authenticatedUserId?: string, accessToken?: string) => {
    const userId = authenticatedUserId || (user.value ? getUserId(user.value) : null)
    if (!userId) {
      profile.value = null
      role.value = null
      superCoordinator.value = false
      return null
    }

    isLoading.value = true
    superCoordinator.value = false

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, student_id, phone_number, avatar_url, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        throw new Error('Unable to load your account profile. Please try again or contact your administrator.')
      }

      if (!data) {
        throw new Error('Your account profile is missing or inaccessible. Please contact your administrator.')
      }

      profile.value = data
      role.value = data.role as UserRole
      if (data.role === 'coordinator') {
        try {
          const privileges = await requestFetch('/api/auth/privileges', {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
          })
          superCoordinator.value = privileges.isSuperCoordinator
        } catch {
          throw new Error('Unable to verify coordinator access. Please try again or contact your administrator.')
        }
      }
      return profile.value
    } catch (error) {
      clearProfile()
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const clearProfile = () => {
    pageCache.clear()
    profile.value = null
    role.value = null
    superCoordinator.value = false
  }

  return {
    profile,
    role,
    isLoading,
    loadProfile,
    clearProfile
  }
}
