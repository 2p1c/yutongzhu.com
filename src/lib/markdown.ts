import { marked } from 'marked'
import hljs from 'highlight.js'

const LANG_ALIASES: Record<string, string> = {
  curl: 'bash',
  js: 'javascript',
  sh: 'bash',
  shell: 'bash',
  ts: 'typescript',
  tsx: 'typescript',
  yml: 'yaml',
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeLang(lang?: string): string | undefined {
  if (!lang) return undefined
  const normalized = lang.trim().toLowerCase()
  return LANG_ALIASES[normalized] ?? normalized
}

function highlightCode(code: string, lang?: string): { html: string; language: string | undefined } {
  const normalized = normalizeLang(lang)
  if (normalized && hljs.getLanguage(normalized)) {
    const result = hljs.highlight(code, { language: normalized })
    return { html: result.value, language: normalized }
  }
  return { html: escapeHtml(code), language: normalized }
}

function renderCodeBlock(code: string, lang?: string): string {
  const { html, language } = highlightCode(code, lang)
  const langLabel = language ?? 'text'
  const langClass = language ? `hljs language-${language}` : 'hljs'
  const highlighted = language ? ` class="${langClass}"` : ''
  return `<div class="code-block"><div class="code-block-bar"><span class="code-block-lang">${langLabel}</span><button type="button" class="code-copy" aria-label="Copy code">Copy</button></div><pre><code${highlighted}>${html}</code></pre></div>`
}

marked.use({
  renderer: {
    image({ href, title, text }) {
      // title 槽位支持 `width=300` 或 `width=50%` 控制图片尺寸;否则作为 title 属性原样输出。
      let widthAttr = ''
      let titleAttr = ''
      if (title) {
        const m = title.match(/^width=(\d+(?:\.\d+)?%?)$/i)
        if (m) {
          widthAttr = ` width="${m[1]}"`
        } else {
          titleAttr = ` title="${title}"`
        }
      }
      const img = `<img src="${href}" alt="${text}"${widthAttr}${titleAttr} />`
      if (text) {
        return `<figure class="post-figure">${img}<figcaption class="post-figcaption">${text}</figcaption></figure>`
      }
      return img
    },
    code({ text, lang }) {
      return renderCodeBlock(text, lang)
    },
  },
})

export function renderMarkdown(content: string): string {
  return marked.parse(content) as string
}
