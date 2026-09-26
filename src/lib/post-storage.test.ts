import { describe, it, expect } from 'vitest'
import { validateMediaFile, mediaEmbedMarkdown, postDescription } from './post-storage.js'

describe('postDescription', () => {
  it('prefers the written description', () => {
    expect(postDescription({ description: ' 手写摘要 ', content: '正文' })).toBe('手写摘要')
  })

  it('falls back to plain text from the body', () => {
    const content = [
      '<div align="center">',
      '',
      '![封面](./media/a.jpg)',
      '',
      '</div>',
      '',
      '## 标题',
      '',
      '这是**第一段**，有一个[链接](https://x.com)。',
      '',
      '```ts',
      'const secret = 1',
      '```',
    ].join('\n')
    expect(postDescription({ description: '', content })).toBe('标题 这是第一段，有一个链接。')
  })

  it('truncates long bodies', () => {
    const result = postDescription({ content: '字'.repeat(200) })
    expect(result).toHaveLength(121)
    expect(result.endsWith('…')).toBe(true)
  })
})

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
