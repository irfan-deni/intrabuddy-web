import { useCurrentProfile } from '../composables/useCurrentProfile'
import { useCoordinatorPrivileges } from '../composables/useCoordinatorPrivileges'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const user = useSupabaseUser()
  const { profile, role, loadProfile, clearProfile } = useCurrentProfile()
  // The reactive user can lag behind a successful password sign-in.
  let userId = user.value ? getUserId(user.value) : null
  if (!userId) {
    const { data, error } = await useSupabaseClient().auth.getUser()
    if (!error) userId = data.user?.id || null
  }
  if (!userId) {
    clearProfile()
    return navigateTo('/login')
  }

  if (!role.value || profile.value?.id !== userId) {
    try {
      await loadProfile(userId)
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
})
