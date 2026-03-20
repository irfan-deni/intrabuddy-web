import { useCurrentProfile } from '../composables/useCurrentProfile'

type UserRole = 'student' | 'coordinator'

export default defineNuxtRouteMiddleware(async (to) => {
  const demoAuthCookie = useCookie('intrabuddy_demo_auth')
  const demoRoleCookie = useCookie('intrabuddy_demo_role')

  if (to.path === '/login') {
    return
  }

  if (demoAuthCookie.value === '1') {
    const requiredRole = to.meta.requiredRole as UserRole | undefined
    if (!requiredRole || requiredRole === (demoRoleCookie.value as UserRole)) {
      return
    }

    if (demoRoleCookie.value === 'coordinator') {
      return navigateTo('/')
    }

    return navigateTo('/student')
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
    return
  }

  if (role.value !== requiredRole) {
    if (role.value === 'coordinator') {
      return navigateTo('/')
    }

    return navigateTo('/student')
  }
})
