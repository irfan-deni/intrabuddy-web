import { createError } from 'h3'

export const positiveId = (value: unknown, label = 'ID'): number => {
  if ((typeof value !== 'string' && typeof value !== 'number') || !/^[1-9]\d*$/.test(String(value))) {
    throw createError({ statusCode: 400, statusMessage: `Invalid ${label}` })
  }
  const id = Number(value)
  if (!Number.isSafeInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid ${label}` })
  }
  return id
}
