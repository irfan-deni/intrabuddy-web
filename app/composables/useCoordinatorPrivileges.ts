import type { UserRole } from '~/constants/domain'

const parseSuperCoordinatorEmails = (value: string | undefined) => {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)
}

export function useCoordinatorPrivileges() {
  const { role } = useCurrentProfile()
  const user = useSupabaseUser()
  const runtimeConfig = useRuntimeConfig()

  const superCoordinatorEmails = computed(() => {
    return parseSuperCoordinatorEmails(runtimeConfig.public.superCoordinatorEmails)
  })

  const isSuperCoordinator = computed(() => {
    if ((role.value as UserRole | null) !== 'coordinator') {
      return false
    }

    const email = user.value?.email?.trim().toLowerCase()
    if (!email) {
      return false
    }

    return superCoordinatorEmails.value.includes(email)
  })

  return {
    isSuperCoordinator,
    superCoordinatorEmails
  }
}
