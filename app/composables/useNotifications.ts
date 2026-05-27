import type { Database } from '~/types/supabase'

export function useNotifications() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const unreadCount = useState<number>('notifications-unread-count', () => 0)
  let channel: ReturnType<typeof supabase.channel> | null = null

  const fetchInitialCount = async () => {
    if (!user.value) return
    const userId = getUserId(user.value)
    if (!userId) return

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)

    unreadCount.value = count ?? 0
  }

  const setupRealtimeListener = () => {
    if (!user.value) return
    const userId = getUserId(user.value)
    if (!userId) return

    channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        () => {
          unreadCount.value++
        }
      )
      .subscribe()
  }

  const decrementCount = () => {
    if (unreadCount.value > 0) unreadCount.value--
  }

  const cleanup = () => {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  return {
    unreadCount,
    fetchInitialCount,
    setupRealtimeListener,
    decrementCount,
    cleanup
  }
}
