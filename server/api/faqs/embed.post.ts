import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

const EMBEDDING_SIZE = 1536

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

const deterministicEmbedding = (text: string, size: number) => {
  const values = new Array<number>(size).fill(0)

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index)
    const bucket = index % size
    const normalized = (code % 127) / 63.5 - 1
    values[bucket] = (values[bucket] || 0) + normalized
  }

  return values.map((value) => {
    return clamp(value / 8, -1, 1)
  })
}

const toPgVectorLiteral = (embedding: number[]) => {
  return `[${embedding.map((value) => value.toFixed(6)).join(',')}]`
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<{ faqId?: string; text?: string }>(event)
  if (!body.faqId || !body.text) {
    throw createError({ statusCode: 400, statusMessage: 'faqId and text are required' })
  }

  const supabase = await serverSupabaseClient(event)
  const embedding = deterministicEmbedding(body.text, EMBEDDING_SIZE)
  const embeddingLiteral = toPgVectorLiteral(embedding)

  const { error } = await supabase
    .from('faqs')
    .update({
      embedding: embeddingLiteral,
      updated_at: new Date().toISOString(),
      last_updated_by: user.id
    })
    .eq('id', body.faqId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    ok: true,
    dimensions: EMBEDDING_SIZE
  }
})
