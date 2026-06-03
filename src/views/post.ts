import { html, raw } from 'hono/html'

interface PostViewProps {
  title: string
  contentHtml: string
  createdAt: Date
}

export function renderPostBody(props: PostViewProps): string {
  const dateStr = new Date(props.createdAt).toISOString().split('T')[0]
  return html`<article class="post">
    <h1 class="post-title">${props.title}</h1>
    <time datetime="${dateStr}" class="post-date">${dateStr}</time>
    <div class="post-content">${raw(props.contentHtml)}</div>
  </article>`
}
