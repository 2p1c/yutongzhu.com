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
        ? html`<li style="color: #888; font-style: italic;">Rolling out the red carpet...</li>`
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
    <p>I'm a student who want to find inner peace. Keep learning, keep building, keep dreaming, never give up.</p>
    <p>My primary technical expertise is lies in eat, sleep, dream a lot and computer games</p>
  </section>

  <section>
    <h2>Get in touch</h2>
    <p class="get-in-touch" style="color: #444;">Email: <a href="mailto:ytzhu@tju.edu.cn" class="get-in-touch-link">akidforseven@gmail.com</a></p>
    <p class="get-in-touch" style="color: #444;">Github: <a href="https://github.com/2p1c" class="get-in-touch-link">2p1c</a></p>
    <p class="get-in-touch" style="color: #444;">Phone: <a href="tek:+8618617715681" class="get-in-touch-link">18617715681</a></p>
  </section>`
}
