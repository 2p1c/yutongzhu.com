// src/views/home.ts
import { html } from 'hono/html'

interface PostListItem {
  slug: string
  title: string
  titleEn?: string
  createdAt: Date
}

export function renderHomeBody(posts: PostListItem[]) {
  return html`<section>
    <h2>Musings</h2>
    <ul class="post-list">
    ${
        posts.length === 0
        ? html`<li style="color: var(--dimmed-text-color); font-style: italic;">Rolling out the red carpet...</li>`
        : posts.map(post => {
            const dateStr = new Date(post.createdAt).toISOString().split('T')[0]
            return html`
                <li class="post-item">
                <a class="post-title-link" href="/posts/${post.slug}/">
                  <span class="post-date">${dateStr}</span>
                  ${post.titleEn ? html`<span class="lang-zh">${post.title}</span><span class="lang-en">${post.titleEn}</span>` : post.title}
                </a>
                </li>
            `
            })
    }
    </ul>
  </section>

  <section class="bio">
    <h2 class="bio-title">
      <span class="bio-title-text">Who I am<a href="/about/" class="bio-title-link" aria-label="About me" title="About me">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h8"/><path d="M7 12h10"/><path d="M7 16h6"/></svg>
        </a></span>
    </h2>
    <p><span class="lang-en">I'm a student who want to find inner peace. Keep learning, keep building, keep dreaming, never give up.</span><span class="lang-zh">我是一个想找到内心平静的学生。保持学习，保持构建，保持梦想，永不放弃。</span></p>
    <p><span class="lang-en">My primary technical expertise is lies in eat, sleep, dream a lot and computer games</span><span class="lang-zh">我的主要技术专长在于吃、睡、做很多梦，以及电脑游戏。</span></p>
  </section>

  <section>
    <h2 class="bio-title">
      <span class="bio-title-text">Chat with me<a href="/agent/" class="bio-title-link" aria-label="Chat with me" title="Chat with me">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/></svg>
        </a></span>
    </h2>
    <p class="chat-desc"><span class="lang-zh"><a href="https://chat.yutongzhu.site/" target="_blank" rel="noopener">chat.yutongzhu.site</a> 是一个我用来练习的 AI web 应用层项目，使用 RAG 库集成了所有博文信息，能够通过 tool call 修改你的浏览器样式以及实现一些炫酷的功能。说你想说的，我承诺不会收集对话信息用于任何目的。</span><span class="lang-en"><a href="https://chat.yutongzhu.site/" target="_blank" rel="noopener">chat.yutongzhu.site</a> is an AI web-app project I built to practice. It uses a RAG library to index all my blog posts, and can tweak your browser's styling through tool calls to do some cool tricks. Say whatever you want — I promise I won't collect your conversation for any purpose.</span></p>
  </section>

  <section>
    <h2>Get in touch</h2>
    <p class="get-in-touch">email: <a href="mailto:ytzhu@tju.edu.cn" class="get-in-touch-link">akidforseven@gmail.com</a></p>
    <p class="get-in-touch">github: <a href="https://github.com/2p1c" class="get-in-touch-link">2p1c</a></p>
    <p class="get-in-touch">phone: <a href="tek:+8618617715681" class="get-in-touch-link">18617715681</a></p>
  </section>`
}
