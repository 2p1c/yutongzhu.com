import { html, raw } from 'hono/html'
import { themeScript } from '../lib/theme.js'
import { langScript } from '../lib/lang.js'

interface LayoutProps {
  title: string
  showTranslate?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
}

export function renderLayout(props: LayoutProps) {
  return html`<!DOCTYPE html>
<html lang="en" data-lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>${raw(themeScript)}</script>
  <script>${raw(langScript)}</script>
  <link rel="icon" type="image/ico" href="/images/favicon.ico" />
  <title>${props.title}</title>
  <link rel="preload" as="image" href="/images/home.jpg">
  <link rel="preload" as="image" href="/images/home2.jpg">
  <link rel="preload" as="image" href="/images/home3.jpg">
  <link rel="preload" as="image" href="/images/home4.jpg">
  <link rel="preload" as="image" href="/images/home5.jpg">
  <link rel="preload" as="image" href="/images/home6.jpg">
  <link rel="preload" as="image" href="/images/home7.jpg">
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header>
    <h1><a href="/" style="color: inherit; text-decoration: none;">{ Yutong Zhu }</a></h1>
    <span class="subtitle">developer • student • robot</span>
    <div class="header-actions">
    <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Toggle theme" title="Toggle light / dark mode">
      <svg class="theme-icon theme-icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
      <svg class="theme-icon theme-icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>
    </button>
      ${props.showTranslate === false ? '' : html`<button id="lang-toggle" class="lang-toggle" type="button" aria-label="Toggle language" title="English / 中文">
        <svg class="translate-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286zm1.634-.736L5.5 3.956h-.049l-.679 2.022z"/><path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm7.138 9.995q.289.451.63.846c-.748.575-1.673 1.001-2.768 1.292.178.217.451.635.555.867 1.125-.359 2.08-.844 2.886-1.494.777.665 1.739 1.165 2.93 1.472.133-.254.414-.673.629-.89-1.125-.253-2.057-.694-2.82-1.284.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6 6 0 0 1-.415-.492 2 2 0 0 1-.94.31"/></svg>
      </button>`}
    </div>
  <img id="home-photo" src="/images/home.jpg" alt="photo" class="home-photo" width="150" height="130" fetchpriority="high" />
  <script>
    const homePhotos = ['/images/home.jpg', '/images/home2.jpg', '/images/home3.jpg', '/images/home4.jpg', '/images/home5.jpg', '/images/home6.jpg', '/images/home7.jpg']
    document.getElementById('home-photo').src = homePhotos[Math.floor(Math.random() * homePhotos.length)]
  </script>
  </header>
  ${props.content}
  <footer class="site-footer">
    <p>Thanks to <a href="https://mariozechner.at/">Mario Zechner</a>, a fantastic developer with truly inspiring blog! I basically copy his website style. </p>
    <p>This site uses no cookies or tracking technologies and collects no personal information.</p>
    <p>© Copyright ${new Date().getFullYear()} by Yutong Zhu.</p>
  </footer>
</body>
</html>`
}
