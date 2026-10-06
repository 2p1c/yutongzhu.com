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
      // lazy：屏幕外的图不和首屏抢带宽；另一种语言的正文是 display:none，里面的图也不会下载。
      const img = `<img src="${href}" alt="${text}"${widthAttr}${titleAttr} loading="lazy" decoding="async" />`
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

// 高亮是同步的，会占住事件循环。同一份正文的渲染结果可以复用；
// 正文一变，key 就变了，不需要单独失效。容量按文章篇数留了余量。
const RENDER_CACHE_MAX = 64
const renderedMarkdown = new Map<string, string>()

export function renderMarkdown(content: string): string {
  const hit = renderedMarkdown.get(content)
  if (hit !== undefined) {
    renderedMarkdown.delete(content)
    renderedMarkdown.set(content, hit)
    return hit
  }

  const html = marked.parse(content) as string
  if (renderedMarkdown.size >= RENDER_CACHE_MAX) {
    const oldest = renderedMarkdown.keys().next().value
    if (oldest !== undefined) renderedMarkdown.delete(oldest)
  }
  renderedMarkdown.set(content, html)
  return html
}

/** HTML for the edit-page preview. `./media/` is rewritten so files resolve on `/admin/edit/:slug`. */
export function previewMarkdown(content: string, slug: string): string {
  const base = `/posts/${slug}/media/`
  const pairs = [
    ['src="./media/', `src="${base}`],
    ["src='./media/", `src='${base}`],
    ['href="./media/', `href="${base}`],
    ["href='./media/", `href='${base}`],
  ]
  // 草稿每次输入都不同，走缓存只会把已发布文章的渲染结果挤出去。
  const html = marked.parse(content) as string
  return pairs.reduce((out, [from, to]) => out.split(from).join(to), html)
}
