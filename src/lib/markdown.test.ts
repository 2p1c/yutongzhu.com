import { describe, it, expect } from 'vitest'
import { renderMarkdown } from './markdown.js'

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

  it('converts code blocks with highlighting and copy button', () => {
    const result = renderMarkdown('```js\nconst x = 1\n```')
    expect(result).toContain('class="code-block"')
    expect(result).toContain('class="code-copy"')
    expect(result).toContain('language-javascript')
    expect(result).toContain('<span class="hljs-keyword">const</span>')
    expect(result).toContain('<span class="hljs-number">1</span>')
  })

  it('normalizes language aliases like Typescript and curl', () => {
    const ts = renderMarkdown('```Typescript\nconst x = 1\n```')
    expect(ts).toContain('language-typescript')
    expect(ts).toContain('<span class="code-block-lang">typescript</span>')

    const curl = renderMarkdown('``` curl\ncurl https://example.com\n```')
    expect(curl).toContain('language-bash')
    expect(curl).toContain('<span class="code-block-lang">bash</span>')
  })

  it('renders unlabeled code blocks without highlighting', () => {
    const result = renderMarkdown('```\nplain text\n```')
    expect(result).toContain('class="code-block"')
    expect(result).toContain('class="code-copy"')
    expect(result).toContain('<span class="code-block-lang">text</span>')
    expect(result).not.toContain('language-')
    expect(result).toContain('plain text')
  })

  it('applies pixel width from title slot', () => {
    const result = renderMarkdown('![alt](/x.png "width=300")')
    expect(result).toContain('<img src="/x.png" alt="alt" width="300"')
  })

  it('applies percentage width from title slot', () => {
    const result = renderMarkdown('![alt](/x.png "width=50%")')
    expect(result).toContain('width="50%"')
  })

  it('keeps ordinary title attribute as-is', () => {
    const result = renderMarkdown('![alt](/x.png "some title")')
    expect(result).toContain('title="some title"')
  })

  it('converts paragraphs', () => {
    const result = renderMarkdown('A paragraph.')
    expect(result).toContain('<p>')
    expect(result).toContain('A paragraph.')
  })

  it('passes through video and pdf html embeds', () => {
    const video = renderMarkdown('<video controls src="./media/a.mp4"></video>')
    expect(video).toContain('<video controls src="./media/a.mp4"></video>')

    const pdf = renderMarkdown(
      '<figure class="post-figure"><iframe class="post-pdf" src="./media/a.pdf" title="hello"></iframe><figcaption class="post-figcaption">hello</figcaption></figure>',
    )
    expect(pdf).toContain('class="post-pdf"')
    expect(pdf).toContain('./media/a.pdf')
    expect(pdf).toContain('<figcaption class="post-figcaption">hello</figcaption>')
  })
})
