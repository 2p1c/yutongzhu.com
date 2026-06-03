import { html } from 'hono/html'
import { serveStatic } from '@hono/node-server/serve-static'
import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { PrismaClient } from './generated/prisma/client'

const app = new Hono()
app.use('/public/*', serveStatic({ root: './' }))
const prisma = new PrismaClient()

app.get('/', async (c) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return c.html(html`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{yutongzhu}</title>
    <link rel="stylesheet" href="/public/style.css">
    </head>
    <body>
  
       <header>
        <h1>{ Yutong Zhu }</h1>
        <p class="subtitle">developer • student • robot</p>
    </header>

     <section>
        <h2>Musings</h2>
        <ul class="post-list">
        ${
            posts.length === 0 
            ? html`<li style="color: #888; font-style: italic;">暂时还没有写随笔...</li>`
            : posts.map(post => {
                // 格式化日期为 YYYY-MM-DD
                const dateStr = new Date(post.createdAt).toISOString().split('T')[0];
                return html`
                    <li class="post-item">
                    <span class="post-date">${dateStr}</span>
                    <a class="post-title-link" href="/posts/${post.id}">${post.title}</a>
                    </li>
                `;
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
    </section>

       </body>
    </html>
  `)
})

app.get('/api/posts', async (c) => {
    const posts = await prisma.post.findMany({
        orderBy: { createdAt: 'desc'}
    })
    return c.json(posts)
})

app.post('/api/posts', async (c) => {
  const body = await c.req.json() // 解析前端传来的 JSON
  const newPost = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content
    }
  })
  return c.json(newPost, 201)
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
