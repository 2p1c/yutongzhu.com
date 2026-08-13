import { html, raw } from 'hono/html'

interface PostViewProps {
  title: string
  titleZh?: string
  contentHtml: string
  contentHtmlZh?: string
  createdAt: Date
}

export function renderPostBody(props: PostViewProps) {
  const dateStr = new Date(props.createdAt).toISOString().split('T')[0]
  return html`<article class="post">
    <h1 class="post-title">${props.titleZh ? html`<span class="lang-en">${props.title}</span><span class="lang-zh">${props.titleZh}</span>` : props.title}</h1>
    <time datetime="${dateStr}" class="post-date-blog">${dateStr}</time>
    ${props.contentHtmlZh
      ? html`<div class="post-content lang-en">${raw(props.contentHtml)}</div><div class="post-content lang-zh">${raw(props.contentHtmlZh)}</div>`
      : html`<div class="post-content">${raw(props.contentHtml)}</div>`}
  </article>`
}
