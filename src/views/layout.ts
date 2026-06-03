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
  <link rel="icon" type="image/ico" href="/public/images/favicon.ico" />
  <title>${props.title}</title>
  <link rel="stylesheet" href="/public/style.css">
</head>
<body>
  <header>
    <h1><a href="/" style="color: inherit; text-decoration: none;">{ Yutong Zhu }</a></h1>
    <span class="subtitle">developer • student • robot</span>
    <img src="/public/images/home.jpg" alt="photo" class="home-photo" />
  </header>
  ${props.content}
</body>
</html>`
}
