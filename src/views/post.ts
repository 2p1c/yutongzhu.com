import { html, raw } from 'hono/html'

interface PostViewProps {
  title: string
  titleEn?: string
  contentHtml: string
  contentHtmlEn?: string
  createdAt: Date
  source?: { url: string; title: string }
}

const scrollToTitleScript = `(function () {
  if (history.scrollRestoration) history.scrollRestoration = 'manual'
  function go() {
    var el = document.querySelector('.post-title')
    if (!el) return
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY)
  }
  go()
  window.addEventListener('DOMContentLoaded', go)
  window.addEventListener('load', go)
})()`

export function renderPostBody(props: PostViewProps) {
  const dateStr = new Date(props.createdAt).toISOString().split('T')[0]
  return html`<article class="post">
    <h1 class="post-title">${props.titleEn ? html`<span class="lang-zh">${props.title}</span><span class="lang-en">${props.titleEn}</span>` : props.title}</h1>
    <script>${raw(scrollToTitleScript)}</script>
    ${props.source
      ? html`<p class="post-source"><em><strong>source:</strong></em> <a href="${props.source.url}" target="_blank" rel="noopener noreferrer"><em><strong>${props.source.title}</strong></em></a></p>`
      : ''}
    <time datetime="${dateStr}" class="post-date-blog">${dateStr}</time>
    ${props.contentHtmlEn
      ? html`<div class="post-content lang-zh">${raw(props.contentHtml)}</div><div class="post-content lang-en">${raw(props.contentHtmlEn)}</div>`
      : html`<div class="post-content">${raw(props.contentHtml)}</div>`}
  </article>`
}
