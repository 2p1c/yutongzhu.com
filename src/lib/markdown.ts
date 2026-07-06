import { marked } from 'marked'

marked.use({
  renderer: {
    image({ href, title, text }) {
      const titleAttr = title ? ` title="${title}"` : ''
      const img = `<img src="${href}" alt="${text}"${titleAttr} />`
      if (text) {
        return `<figure class="post-figure">${img}<figcaption class="post-figcaption">${text}</figcaption></figure>`
      }
      return img
    },
  },
})

export function renderMarkdown(content: string): string {
  return marked.parse(content) as string
}
