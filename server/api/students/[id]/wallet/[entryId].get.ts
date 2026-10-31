import type { Database } from '~/types/supabase'
import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'

export default defineEventHandler(async (event) => {
  await requireCoordinator(event)
  const studentId = getRouterParam(event, 'id')
  if (!studentId) throw createError({ statusCode: 400, statusMessage: 'Student ID required' })
  const itemId = positiveId(getRouterParam(event, 'entryId'), 'document ID')
  await requireStudentTarget(event, studentId)

  const db = serverSupabaseServiceRole<Database>(event)
  const { data: item, error } = await db.from('digital_wallet_items')
    .select('file_path, file_type').eq('id', itemId).eq('student_id', studentId).maybeSingle()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to find document' })
  if (!item || !item.file_path.startsWith(`${studentId}/`) || item.file_path.split('/').some(part => part === '..' || part === '.')) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  const types: Record<string, string> = {
    pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', gif: 'image/gif',
    'application/pdf': 'application/pdf', 'image/jpeg': 'image/jpeg', 'image/png': 'image/png',
    'image/webp': 'image/webp', 'image/gif': 'image/gif'
  }
  const contentType = types[(item.file_type || item.file_path.split('.').pop() || '').toLowerCase()]
  if (!contentType) throw createError({ statusCode: 415, statusMessage: 'This document type cannot be previewed' })
  const { data, error: storageError } = await db.storage.from('student-documents').download(item.file_path)
  if (storageError || !data) throw createError({ statusCode: 404, statusMessage: 'Document unavailable' })

  setResponseHeaders(event, {
    'Content-Type': contentType,
    'Content-Disposition': 'inline',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  })
  return new Uint8Array(await data.arrayBuffer())
})
