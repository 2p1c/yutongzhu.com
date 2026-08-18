import { html, raw } from 'hono/html'

interface PostViewProps {
  title: string
  titleEn?: string
  contentHtml: string
  contentHtmlEn?: string
  createdAt: Date
}

export function renderPostBody(props: PostViewProps) {
  const dateStr = new Date(props.createdAt).toISOString().split('T')[0]
  return html`<article class="post">
    <h1 class="post-title">${props.titleEn ? html`<span class="lang-zh">${props.title}</span><span class="lang-en">${props.titleEn}</span>` : props.title}</h1>
    <time datetime="${dateStr}" class="post-date-blog">${dateStr}</time>
    ${props.contentHtmlEn
      ? html`<div class="post-content lang-zh">${raw(props.contentHtml)}</div><div class="post-content lang-en">${raw(props.contentHtmlEn)}</div>`
      : html`<div class="post-content">${raw(props.contentHtml)}</div>`}
  </article>`
}
