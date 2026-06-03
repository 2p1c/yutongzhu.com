import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { renderMarkdown } from '../lib/markdown'
import { renderLayout } from '../views/layout'
import { renderPostBody } from '../views/post'

const posts = new Hono()

posts.get('/posts/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) {
    return c.notFound()
  }
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) {
    return c.notFound()
  }
  const contentHtml = renderMarkdown(post.content)
  return c.html(renderLayout({
    title: post.title,
    content: renderPostBody({
      title: post.title,
      contentHtml,
      createdAt: post.createdAt
    })
  }))
})

posts.get('/api/posts', async (c) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return c.json(posts)
})

posts.post('/api/posts', async (c) => {
  const body = await c.req.json()
  const newPost = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content
    }
  })
  return c.json(newPost, 201)
})

export default posts
