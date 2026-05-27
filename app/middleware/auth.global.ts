import { useCurrentProfile } from '../composables/useCurrentProfile'
import { useCoordinatorPrivileges } from '../composables/useCoordinatorPrivileges'
import type { UserRole } from '~/constants/domain'

const redirectByRole = (role: UserRole) => {
  if (role === 'coordinator') {
    return navigateTo('/')
  }

  return navigateTo('/student')
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') {
    return
  }

  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/login')
  }

  const { role, loadProfile, clearProfile } = useCurrentProfile()
  if (!role.value) {
    try {
      await loadProfile()
    } catch (err) {
      console.error('Failed to load profile in middleware:', err)
      clearProfile()
      return navigateTo('/login')
    }
  }

  if (!role.value) {
    return navigateTo('/login')
  }

  const requiredRole = to.meta.requiredRole as UserRole | undefined

  if (!requiredRole) {
    const superCoordinatorOnly = Boolean(to.meta.superCoordinatorOnly)
    if (!superCoordinatorOnly) {
      return
    }
  }

  if (requiredRole && role.value !== requiredRole) {
    return redirectByRole(role.value)
  }

  const superCoordinatorOnly = Boolean(to.meta.superCoordinatorOnly)
  if (superCoordinatorOnly && role.value === 'coordinator') {
    const { isSuperCoordinator } = useCoordinatorPrivileges()
    if (!isSuperCoordinator.value) {
      return redirectByRole(role.value)
    }
  }
})

