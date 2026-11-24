import { useCurrentProfile } from '../composables/useCurrentProfile'
import { useCoordinatorPrivileges } from '../composables/useCoordinatorPrivileges'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const user = useSupabaseUser()
  const { profile, role, loadProfile, clearProfile } = useCurrentProfile()
  const pageCache = usePageCache()
  const session = useSupabaseSession()
  // Session state can be ready before the reactive user updates after sign-in.
  const userId = (import.meta.client ? session.value?.user?.id : undefined) || (user.value && getUserId(user.value))

  if (!userId || !role.value || profile.value?.id !== userId) {
    try {
      await loadProfile(userId || undefined)
    } catch {
      clearProfile()
      return navigateTo('/login')
    }
  }

  if (role.value !== 'coordinator') {
    // Local sign-out leaves the student's mobile session intact.
    await useSupabaseClient().auth.signOut({ scope: 'local' })
    clearProfile()
    return navigateTo('/login?reason=mobile-only')
  }

  if (to.meta.superCoordinatorOnly) {
    const { isSuperCoordinator } = useCoordinatorPrivileges()
    if (!isSuperCoordinator.value) return navigateTo('/')
  }

  // The page shares this in-flight request. Don't block navigation or fetch on SSR.
  if (import.meta.client && to.path === '/') {
    void pageCache.fetch('/api/dashboard').catch(() => {})
  }
})
