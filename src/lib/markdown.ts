import { marked } from 'marked'

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
  },
})

export function renderMarkdown(content: string): string {
  return marked.parse(content) as string
}
