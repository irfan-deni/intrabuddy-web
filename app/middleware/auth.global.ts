import { useCurrentProfile } from '../composables/useCurrentProfile'
import { useCoordinatorPrivileges } from '../composables/useCoordinatorPrivileges'
import type { UserRole } from '~/constants/domain'

const redirectByRole = (role: UserRole) => {
  console.log('Redirecting by role:', role)
  if (role === 'coordinator') {
    return navigateTo('/')
  }

  return navigateTo('/student')
}

export default defineNuxtRouteMiddleware(async (to) => {
  console.log('Auth middleware running for path:', to.path)
  
  if (to.path === '/login') {
    console.log('On login page, skipping middleware')
    return
  }

  const user = useSupabaseUser()
  if (!user.value) {
    console.log('No user found, redirecting to /login')
    return navigateTo('/login')
  }

  console.log('User found:', user.value.id)

  const { role, loadProfile, clearProfile } = useCurrentProfile()
  if (!role.value) {
    console.log('No role in state, attempting to load profile...')
    try {
      const profile = await loadProfile()
      console.log('Profile loaded successfully, role:', role.value)
    } catch (err) {
      console.error('Error loading profile in middleware:', err)
      clearProfile()
      return navigateTo('/login')
    }
  }

  if (!role.value) {
    console.warn('Role still missing after load attempt, redirecting to /login')
    return navigateTo('/login')
  }

  const requiredRole = to.meta.requiredRole as UserRole | undefined
  console.log('Path required role:', requiredRole, 'Current role:', role.value)
  
  if (!requiredRole) {
    const superCoordinatorOnly = Boolean(to.meta.superCoordinatorOnly)
    if (!superCoordinatorOnly) {
      console.log('No specific requirements for this route, allowing access')
      return
    }
  }

  if (requiredRole && role.value !== requiredRole) {
    console.log('Role mismatch, redirecting...')
    return redirectByRole(role.value)
  }

  const superCoordinatorOnly = Boolean(to.meta.superCoordinatorOnly)
  if (superCoordinatorOnly && role.value === 'coordinator') {
    console.log('Super coordinator check triggered')
    const { isSuperCoordinator } = useCoordinatorPrivileges()
    if (!isSuperCoordinator.value) {
      console.log('Not a super coordinator, redirecting...')
      return redirectByRole(role.value)
    }
  }
  
  console.log('Access granted to:', to.path)
})

