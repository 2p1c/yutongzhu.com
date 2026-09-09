import { describe, it, expect } from 'vitest'
import { validateMediaFile, mediaEmbedMarkdown } from './post-storage.js'

describe('validateMediaFile', () => {
  it('allows pdf by mime type', () => {
    expect(validateMediaFile({ name: 'notes.pdf', type: 'application/pdf', size: 100 }).ok).toBe(true)
  })

  it('allows pdf by extension when mime is empty', () => {
    expect(validateMediaFile({ name: 'notes.pdf', type: '', size: 100 }).ok).toBe(true)
  })

  it('allows video', () => {
    expect(validateMediaFile({ name: 'clip.mp4', type: 'video/mp4', size: 100 }).ok).toBe(true)
  })

  it('rejects disallowed types', () => {
    const result = validateMediaFile({ name: 'x.exe', type: 'application/x-msdownload', size: 100 })
    expect(result.ok).toBe(false)
  })
})

describe('mediaEmbedMarkdown', () => {
  it('wraps images like the existing cover snippet', () => {
    expect(mediaEmbedMarkdown({ name: 'a.png', kind: 'image' }, 'hello')).toContain(
      '![hello](./media/a.png)',
    )
  })

  it('emits a video tag', () => {
    expect(mediaEmbedMarkdown({ name: 'a.mp4', kind: 'video' })).toContain(
      '<video controls src="./media/a.mp4"></video>',
    )
  })

  it('emits a pdf iframe with the same caption pattern as images', () => {
    const md = mediaEmbedMarkdown({ name: 'doc.pdf', kind: 'pdf' }, 'hello')
    expect(md).toContain('class="post-pdf"')
    expect(md).toContain('src="./media/doc.pdf"')
    expect(md).toContain('<figcaption class="post-figcaption">hello</figcaption>')
  })

  it('uses a placeholder caption for pdf when none is given', () => {
    expect(mediaEmbedMarkdown({ name: 'doc.pdf', kind: 'pdf' })).toContain(
      '<figcaption class="post-figcaption">图片描述</figcaption>',
    )
  })
})
