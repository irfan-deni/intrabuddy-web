import { serverSupabaseClient } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    await requireCoordinator(event)
    const supabase = await serverSupabaseClient<Database>(event)
    const [faqs, categories] = await Promise.all([
      supabase.from('faqs').select('*').order('updated_at', { ascending: false }),
      supabase.from('faq_categories').select('*').order('display_order', { ascending: true })
    ])

    if (faqs.error) throw faqs.error
    if (categories.error) throw categories.error
    return { faqs: faqs.data || [], categories: categories.data || [] }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[FAQs API Error]:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch knowledge base' })
  }
})
