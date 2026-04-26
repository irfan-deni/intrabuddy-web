import { useCurrentProfile } from '../composables/useCurrentProfile'
import { useCoordinatorPrivileges } from '../composables/useCoordinatorPrivileges'

type UserRole = 'student' | 'coordinator'

const redirectByRole = (role: UserRole) => {
  if (role === 'coordinator') {
    return navigateTo('/')
  }

  return navigateTo('/student')
}

export default defineNuxtRouteMiddleware(async (to) => {
  const demoAuthCookie = useCookie('intrabuddy_demo_auth')
  const demoRoleCookie = useCookie('intrabuddy_demo_role')
  const demoSuperCookie = useCookie('intrabuddy_demo_super')

  if (to.path === '/login') {
    return
  }

  if (demoAuthCookie.value === '1') {
    const demoRole = demoRoleCookie.value as UserRole
    const requiredRole = to.meta.requiredRole as UserRole | undefined
    const superCoordinatorOnly = Boolean(to.meta.superCoordinatorOnly)

    if (requiredRole && requiredRole !== demoRole) {
      return redirectByRole(demoRole)
    }

    if (superCoordinatorOnly && demoRole === 'coordinator' && demoSuperCookie.value !== '1') {
      return redirectByRole(demoRole)
    }

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
    } catch {
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
