import { html } from 'hono/html'

interface LayoutProps {
  title: string
  content: string
}

export function renderLayout(props: LayoutProps): string {
  return html`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title}</title>
  <link rel="stylesheet" href="/public/style.css">
</head>
<body>
  <header>
    <h1><a href="/" style="color: inherit; text-decoration: none;">{ Yutong Zhu }</a></h1>
    <p class="subtitle">developer • student • robot</p>
  </header>
  ${props.content}
</body>
</html>`
}
