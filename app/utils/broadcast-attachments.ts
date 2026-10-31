export const BROADCAST_IMAGE_LIMIT = 3
export const BROADCAST_IMAGE_BYTES = 5 * 1024 * 1024
export const BROADCAST_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

export const normalizeImageType = (type: string) => type === 'image/jpg' ? 'image/jpeg' : type

export const imageValidationError = (file: { type: string; size: number }) => {
  if (!BROADCAST_IMAGE_TYPES.includes(normalizeImageType(file.type))) return 'Choose a PNG, JPEG, GIF, or WebP image. SVG and other file types are not supported.'
  if (file.size === 0) return 'The selected image is empty.'
  if (file.size > BROADCAST_IMAGE_BYTES) return 'Each image must be 5 MB or smaller.'
  return null
}

export const imageMatchesType = (bytes: Uint8Array, type: string) => {
  const starts = (signature: number[]) => signature.every((value, index) => bytes[index] === value)
  switch (normalizeImageType(type)) {
    case 'image/png': return starts([137, 80, 78, 71, 13, 10, 26, 10])
    case 'image/jpeg': return starts([255, 216, 255])
    case 'image/gif': return starts([71, 73, 70, 56, 55, 97]) || starts([71, 73, 70, 56, 57, 97])
    case 'image/webp': return starts([82, 73, 70, 70]) && [87, 69, 66, 80].every((value, index) => bytes[index + 8] === value)
    default: return false
  }
}
