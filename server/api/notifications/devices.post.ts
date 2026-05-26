import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

type RegisterDeviceBody = {
  deviceToken?: string
  platform?: 'android' | 'ios' | 'web'
  appVersion?: string
}

const isMissingRelationError = (message: string) => {
  const normalized = message.toLowerCase()
  return normalized.includes('relation') && normalized.includes('does not exist')
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<RegisterDeviceBody>(event)
  if (!body.deviceToken || !body.platform) {
    throw createError({ statusCode: 400, statusMessage: 'deviceToken and platform are required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw createError({ statusCode: 500, statusMessage: profileError.message })
  }

  if (!profile || profile.role !== 'student') {
    throw createError({ statusCode: 403, statusMessage: 'Only students can register mobile devices.' })
  }

  const now = new Date().toISOString()
  const { error: upsertError } = await (supabase
    .from('mobile_device_tokens') as any)
    .upsert({
      user_id: user.id,
      device_token: body.deviceToken,
      platform: body.platform,
      app_version: body.appVersion || null,
      is_active: true,
      last_seen_at: now
    }, {
      onConflict: 'user_id,device_token'
    })

  if (upsertError) {
    if (isMissingRelationError(upsertError.message)) {
      return {
        ok: false,
        requiresSetup: true,
        message: 'mobile_device_tokens table is missing. Apply docs/mobile-notifications-setup.sql first.'
      }
    }

    throw createError({ statusCode: 500, statusMessage: upsertError.message })
  }

  return {
    ok: true,
    userId: user.id,
    registeredAt: now
  }
})