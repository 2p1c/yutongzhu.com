import { describe, it, expect } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('converts headings', () => {
    const result = renderMarkdown('# Hello')
    expect(result).toContain('<h1')
    expect(result).toContain('Hello')
  })

  it('converts links', () => {
    const result = renderMarkdown('[example](https://example.com)')
    expect(result).toContain('<a href="https://example.com"')
    expect(result).toContain('example</a>')
  })

  it('converts images', () => {
    const result = renderMarkdown('![alt](/images/foo.png)')
    expect(result).toContain('<img')
    expect(result).toContain('alt')
    expect(result).toContain('/images/foo.png')
  })

  it('converts code blocks', () => {
    const result = renderMarkdown('```js\nconst x = 1\n```')
    expect(result).toContain('<code')
  })

  it('converts paragraphs', () => {
    const result = renderMarkdown('A paragraph.')
    expect(result).toContain('<p>')
    expect(result).toContain('A paragraph.')
  })
})
