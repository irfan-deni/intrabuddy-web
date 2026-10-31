import { describe, expect, it } from 'vitest'
import { isBroadcastImagePath, parseAnnouncement, safeAnnouncementImage, serializeAnnouncement } from '../app/utils/announcement-content'
import { BROADCAST_IMAGE_BYTES, imageMatchesType, imageValidationError } from '../app/utils/broadcast-attachments'

const project = 'https://example.supabase.co'
const image = `${project}/storage/v1/object/public/broadcast-media/broadcast-images/a.jpg`

describe('Announcement attachment representation', () => {
  it('preserves the legacy body format without putting HTML in editable text', () => {
    const body = serializeAnnouncement(' Meeting at 9 am. ', [image])
    expect(body).toBe(`Meeting at 9 am.\n<img src="${image}" />`)
    expect(parseAnnouncement(body, project)).toEqual({ text: 'Meeting at 9 am.', images: [image] })
  })

  it('accepts legacy single/double quotes and deduplicates images', () => {
    expect(parseAnnouncement(`<img src='${image}'>hello<img src="${image}" onerror="alert(1)">`, project)).toEqual({ text: 'hello', images: [image] })
  })

  it.each(['javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'https://tracker.example/image.jpg', `${project}/storage/v1/object/public/private/image.jpg`, 'https://example.supabase.co.evil.test/storage/v1/object/public/broadcast-media/broadcast-images/a.jpg'])('rejects unsafe or foreign image sources: %s', value => {
    expect(safeAnnouncementImage(value, project)).toBeNull()
    expect(parseAnnouncement(`<img src="${value}">`, project).images).toEqual([])
  })

  it('returns non-image content only as text, never executable HTML', () => {
    expect(parseAnnouncement('<script>alert(1)</script><b>Hello</b>', project)).toEqual({ text: '<script>alert(1)</script><b>Hello</b>', images: [] })
    expect(parseAnnouncement(null, project)).toEqual({ text: '', images: [] })
  })

  it('accepts generated storage paths and combines trusted URLs with legacy images', () => {
    expect(isBroadcastImagePath('broadcast-images/actor/12345678-1234-1234-1234-123456789abc.png')).toBe(true)
    expect(isBroadcastImagePath('broadcast-images/actor/../../private.png')).toBe(false)
    expect(isBroadcastImagePath('https://foreign.example/image.png')).toBe(false)
    expect(parseAnnouncement(`Text <img src="${image}">`, project, [image, 'https://foreign.example/image.png'])).toEqual({ text: 'Text', images: [image] })
  })
})

describe('Shared image validation', () => {
  it('limits MIME type, size, empty files, and checks binary signatures', () => {
    expect(imageValidationError({ type: 'image/svg+xml', size: 50 })).toMatch(/SVG/)
    expect(imageValidationError({ type: 'image/png', size: BROADCAST_IMAGE_BYTES + 1 })).toMatch(/5 MB/)
    expect(imageValidationError({ type: 'image/png', size: 0 })).toMatch(/empty/)
    expect(imageValidationError({ type: 'image/jpg', size: BROADCAST_IMAGE_BYTES })).toBeNull()
    expect(imageMatchesType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), 'image/png')).toBe(true)
    expect(imageMatchesType(new TextEncoder().encode('<svg>'), 'image/png')).toBe(false)
    expect(imageMatchesType(new Uint8Array([255, 216, 255]), 'image/jpeg')).toBe(true)
    expect(imageMatchesType(new TextEncoder().encode('GIF89a'), 'image/gif')).toBe(true)
    expect(imageMatchesType(new TextEncoder().encode('RIFF1234WEBP'), 'image/webp')).toBe(true)
  })
})
