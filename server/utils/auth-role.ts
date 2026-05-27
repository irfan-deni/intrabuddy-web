import { createClient } from '@supabase/supabase-js'
import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import { getHeader } from 'h3'
import type { Database } from '~/types/supabase'
import type { H3Event } from 'h3'

const getServerClient = (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const url = config.public.supabase.url as string
  const key = config.public.supabase.key as string
  const allCookies = parseCookieHeader(getHeader(event, 'cookie') ?? '')
  return createServerClient(url, key, {
    cookies: {
      getAll: () => allCookies.filter((c): c is { name: string; value: string } => c.value !== undefined),
      setAll: () => {}
    }
  })
}

const getServiceRoleClient = (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const url = config.public.supabase.url as string
  const key = (config.supabase.secretKey as string | undefined) || (config.supabase.serviceKey as string | undefined)
  if (!key) throw createError({ statusCode: 500, statusMessage: 'Service key missing' })
  return createClient(url, key)
}

export const requireCoordinator = async (event: H3Event) => {
  const client = getServerClient(event)
  const { data: { user } } = await client.auth.getUser()
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: actor } = await getServiceRoleClient(event)
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!actor || actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return user
}
