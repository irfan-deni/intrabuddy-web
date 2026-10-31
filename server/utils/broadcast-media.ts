import { createError, getHeader, getRequestWebStream, type H3Event } from 'h3'
import type { Database } from '~/types/supabase'
import { BROADCAST_IMAGE_BYTES, BROADCAST_IMAGE_LIMIT, imageMatchesType, imageValidationError, normalizeImageType } from '~/utils/broadcast-attachments'
import { serverSupabaseServiceRole } from './supabase-server'

export type BroadcastImage = { type: string; data: Uint8Array }

export const readLimitedBroadcastBody = async (stream: ReadableStream<Uint8Array>, limit: number) => {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) {
        await reader.cancel()
        throw createError({ statusCode: 413, statusMessage: 'Announcement attachments are too large.' })
      }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return bytes
}

export const parseBroadcastForm = async (form: FormData) => {
  const allowed = ['title', 'body', 'target_roles', 'images']
  for (const key of form.keys()) if (!allowed.includes(key)) throw createError({ statusCode: 400, statusMessage: 'Unexpected announcement field.' })
  for (const field of ['title', 'body', 'target_roles']) {
    if (form.getAll(field).length !== 1 || typeof form.get(field) !== 'string') throw createError({ statusCode: 400, statusMessage: 'Invalid announcement fields.' })
  }
  const parts = form.getAll('images')
  if (parts.length > BROADCAST_IMAGE_LIMIT) throw createError({ statusCode: 400, statusMessage: 'Attach at most 3 images.' })
  const images: BroadcastImage[] = []
  for (const part of parts) {
    if (typeof part === 'string') throw createError({ statusCode: 400, statusMessage: 'Invalid image attachment.' })
    const validationError = imageValidationError(part)
    if (validationError) throw createError({ statusCode: 400, statusMessage: validationError })
    const data = new Uint8Array(await part.arrayBuffer())
    if (!imageMatchesType(data, part.type)) throw createError({ statusCode: 400, statusMessage: 'An attachment is not a valid supported image.' })
    images.push({ type: normalizeImageType(part.type), data })
  }
  let targetRoles: unknown
  try { targetRoles = JSON.parse(form.get('target_roles') as string) } catch { throw createError({ statusCode: 400, statusMessage: 'Invalid target audience.' }) }
  return { title: form.get('title') as string, body: form.get('body') as string, target_roles: targetRoles, images }
}

export const readBroadcastRequest = async (event: H3Event) => {
  const contentType = getHeader(event, 'content-type') || ''
  const multipart = contentType.toLowerCase().startsWith('multipart/form-data')
  const limit = multipart ? BROADCAST_IMAGE_LIMIT * BROADCAST_IMAGE_BYTES + 64 * 1024 : 128 * 1024
  const declared = Number(getHeader(event, 'content-length'))
  if (declared > limit) throw createError({ statusCode: 413, statusMessage: 'Announcement request is too large.' })
  const stream = getRequestWebStream(event)
  if (!stream) throw createError({ statusCode: 400, statusMessage: 'Announcement request body is required.' })
  const bytes = await readLimitedBroadcastBody(stream, limit)
  try {
    if (multipart) return await parseBroadcastForm(await new Response(bytes, { headers: { 'content-type': contentType } }).formData())
    const body = JSON.parse(new TextDecoder().decode(bytes))
    return { ...body, images: [] as BroadcastImage[] }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 400, statusMessage: 'Invalid announcement request.' })
  }
}

export const cleanupBroadcastImages = async (event: H3Event, paths: string[]) => {
  if (!paths.length) return
  try {
    const { error } = await serverSupabaseServiceRole<Database>(event).storage.from('broadcast-media').remove(paths)
    if (error) console.error('[Announcement media] Unsent image cleanup failed', { count: paths.length })
  } catch { console.error('[Announcement media] Unsent image cleanup failed', { count: paths.length }) }
}

export const uploadBroadcastImages = async (event: H3Event, actorId: string, images: BroadcastImage[]) => {
  const bucket = serverSupabaseServiceRole<Database>(event).storage.from('broadcast-media')
  const paths: string[] = []
  const urls: string[] = []
  const extensions: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' }
  try {
    for (const image of images) {
      const extension = extensions[image.type]
      if (!extension) throw new Error('Unsupported image type')
      const path = `broadcast-images/${actorId}/${crypto.randomUUID()}.${extension}`
      paths.push(path)
      const { error } = await bucket.upload(path, image.data, { contentType: image.type, upsert: false })
      if (error) throw error
      const { data } = bucket.getPublicUrl(path)
      if (!data?.publicUrl) throw new Error('Missing image URL')
      urls.push(data.publicUrl)
    }
    return { paths, urls }
  } catch {
    await cleanupBroadcastImages(event, paths)
    throw createError({ statusCode: 502, statusMessage: 'Images could not be uploaded. No announcement was sent. Your draft is unchanged; please try again.' })
  }
}
