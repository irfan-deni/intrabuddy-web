import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import { getHeader, createError } from 'h3'
import type { H3Event } from 'h3'

export const serverSupabaseClient = <T = any>(event: H3Event) => {
  if (!event.context._supabaseClient) {
    const config = useRuntimeConfig(event)
    const url = config.public.supabase.url as string
    const key = config.public.supabase.key as string
    const allCookies = parseCookieHeader(getHeader(event, 'cookie') ?? '')
    event.context._supabaseClient = createServerClient(url, key, {
      cookies: {
        getAll: () => allCookies.filter((c): c is { name: string; value: string } => c.value !== undefined),
        setAll: () => {}
      }
    })
  }
  return event.context._supabaseClient as unknown as SupabaseClient<T>
}

export const serverSupabaseServiceRole = <T = any>(event: H3Event) => {
  if (!event.context._supabaseServiceRole) {
    const config = useRuntimeConfig(event)
    const url = config.public.supabase.url as string
    const key = (config.supabase.secretKey as string | undefined) || (config.supabase.serviceKey as string | undefined)
    if (!key) {
      throw new Error('Missing server key. Set NUXT_SUPABASE_SECRET_KEY in your environment variables.')
    }
    event.context._supabaseServiceRole = createClient(url, key, {
      auth: { detectSessionInUrl: false, persistSession: false, autoRefreshToken: false }
    })
  }
  return event.context._supabaseServiceRole as unknown as SupabaseClient<T>
}

export const serverSupabaseUser = async (event: H3Event) => {
  const client = serverSupabaseClient(event)
  const { data, error } = await client.auth.getUser()
  if (error) {
    throw createError({ statusMessage: error?.message })
  }
  return data?.user ?? null
}
