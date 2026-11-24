import type { UserRole } from '~/constants/domain'
import type { Database } from '~/types/supabase'

type CurrentProfile = Database['public']['Tables']['users']['Row']

export function useCurrentProfile() {
  const user = useSupabaseUser()

  const profile = useState<CurrentProfile | null>('current-profile', () => null)
  const role = useState<UserRole | null>('current-role', () => null)
  const isLoading = useState<boolean>('current-profile-loading', () => false)
  const superCoordinator = useState<boolean>('current-super-coordinator', () => false)
  const requestFetch = useRequestFetch()
  const pageCache = usePageCache()
  const activeSemesterName = useState<string | null>('active-semester-name', () => null)

  const loadProfile = async (authenticatedUserId?: string, accessToken?: string) => {
    const userId = authenticatedUserId || (user.value ? getUserId(user.value) : null)
    isLoading.value = true

    try {
      const context = await requestFetch('/api/auth/session-context', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        cache: 'no-store',
        retry: 0
      }).catch(() => {
        throw new Error('Unable to verify coordinator access. Please try again or contact your administrator.')
      })

      if (!context.profile || (userId && context.profile.id !== userId)) {
        throw new Error('Your account profile is missing or inaccessible. Please contact your administrator.')
      }

      if (profile.value?.id !== context.profile.id) {
        pageCache.clear()
        activeSemesterName.value = null
      }
      profile.value = context.profile
      role.value = context.profile.role
      superCoordinator.value = context.isSuperCoordinator
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
    activeSemesterName.value = null
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
