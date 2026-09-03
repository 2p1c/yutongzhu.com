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
    <p><span class="lang-en">I'm a student who want to find inner peace. Build my own identity outside the rules dictated by the world. Learning, building, dreaming, never give up.</span><span class="lang-zh">我是一个想找到内心平静的学生。努力尝试在被社会告知的规则之外建立自己的身份。学习，构建，幻想，永不放弃。</span></p>  
    <p><span class="lang-en">My primary technical expertise is lies in eat, sleep, dream a lot and computer games</span><span class="lang-zh">我的主要技术专长在于吃、睡、做很多梦，以及电脑游戏。</span></p>
  </section>

  <section>
    <h2 class="bio-title">
      <span class="bio-title-text">Chat with me<a href="/posts/2026-08-25-mmagent-my-minimal-agent/" class="bio-title-link" aria-label="mmagent(my-minimal-agent)" title="mmagent(my-minimal-agent)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/></svg>
        </a></span>
    </h2>
    <p class="chat-desc"><span class="lang-zh"><a href="https://chat.yutongzhu.site/" target="_blank" rel="noopener">chat.yutongzhu.site</a> 是一个我用来练习的 AI web 应用层项目，通过Resend邮箱验证做了用户鉴权和会话管理，使用 RAG 库实现持久记忆，背后接入了一个我订阅的大模型API，能够通过 tool call 调用一些工具，还在持续集成，我会实现一些炫酷的功能。我承诺不会收集对话信息用于任何目的。</span><span class="lang-en"><a href="https://chat.yutongzhu.site/" target="_blank" rel="noopener">chat.yutongzhu.site</a>is an AI web application layer project I'm using for practice. It uses Resend email verification for user authentication and session management, and employs a RAG library to implement persistent memory. Behind the scenes, it connects to a large model API that I've subscribed to, and supports tool calling via function calls—I'm still actively integrating this, with plans to implement features like modifying your browser styles and some other cool functionalities. Say whatever you'd like—I promise I won't collect any conversation data for any purpose.</span></p>
  </section>

  <section>
    <h2>Get in touch</h2>
    <p class="get-in-touch">email: <a href="mailto:ytzhu@tju.edu.cn" class="get-in-touch-link">akidforseven@gmail.com</a></p>
    <p class="get-in-touch">github: <a href="https://github.com/2p1c" class="get-in-touch-link">2p1c</a></p>
    <p class="get-in-touch">phone: <a href="tek:+8618617715681" class="get-in-touch-link">18617715681</a></p>
  </section>`
}
