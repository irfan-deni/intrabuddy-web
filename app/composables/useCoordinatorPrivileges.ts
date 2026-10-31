export function useCoordinatorPrivileges() {
  const { role } = useCurrentProfile()
  const superCoordinator = useState<boolean>('current-super-coordinator', () => false)

  // Display capability only. Every privileged server action reauthorizes the actor.
  const isSuperCoordinator = computed(() => role.value === 'coordinator' && superCoordinator.value)
  return { isSuperCoordinator }
}
