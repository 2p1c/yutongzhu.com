// src/views/home.ts
import { html } from 'hono/html'

interface PostListItem {
  slug: string
  title: string
  createdAt: Date
}

export function renderHomeBody(posts: PostListItem[]): string {
  return html`<section>
    <h2>Musings</h2>
    <ul class="post-list">
    ${
        posts.length === 0
        ? html`<li style="color: #888; font-style: italic;">暂时还没有写随笔...</li>`
        : posts.map(post => {
            const dateStr = new Date(post.createdAt).toISOString().split('T')[0]
            return html`
                <li class="post-item">
                <a class="post-title-link" href="/posts/${post.slug}">
                  <span class="post-date">${dateStr}</span>
                  ${post.title}
                </a>
                </li>
            `
            })
    }
    </ul>
  </section>

  <section class="bio">
    <h2>Who I am</h2>
    <p>Hono + SQLite + CSS ，no Cookie。</p>
  </section>

  <section>
    <h2>Get in touch</h2>
    <p style="color: #444;">Email: <a href="mailto:akidforseven@gmail.com" class="post-title-link">akidforseven@gmail.com</a></p>
  </section>`
}
