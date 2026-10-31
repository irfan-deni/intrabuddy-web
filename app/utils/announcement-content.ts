const imageTags = /<img\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi

export const safeAnnouncementImage = (value: string, projectUrl: string): string | null => {
  try {
    const url = new URL(value)
    const project = new URL(projectUrl)
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== project.origin || url.username || url.password) return null
    if (!url.pathname.startsWith('/storage/v1/object/public/broadcast-media/broadcast-images/')) return null
    return url.href
  } catch { return null }
}

export const isBroadcastImagePath = (path: string) =>
  /^broadcast-images\/[^/]+\/[0-9a-f-]{36}\.(png|jpg|gif|webp)$/i.test(path)

export const parseAnnouncement = (body: string | null | undefined, projectUrl: string, imageUrls: string[] = []) => {
  const images: string[] = []
  const text = (body || '').replace(imageTags, tag => {
    // Only extract a quoted src attribute. No HTML, handlers, or other attributes
    // are ever passed through to the DOM.
    const source = tag.match(/\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
    const url = source && safeAnnouncementImage(source[1] ?? source[2] ?? '', projectUrl)
    if (url && !images.includes(url) && images.length < 3) images.push(url)
    return ''
  }).trim()
  for (const source of imageUrls) {
    const url = safeAnnouncementImage(source, projectUrl)
    if (url && !images.includes(url) && images.length < 3) images.push(url)
  }
  return { text, images }
}

// Preserve the existing body format for consumers outside this repository.
// This is a transport representation, never the editable textarea value.
export const serializeAnnouncement = (text: string, images: string[]) =>
  [text.trim(), ...images.map(url => `<img src="${url}" />`)].filter(Boolean).join('\n')
