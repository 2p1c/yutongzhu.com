import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authGuard } from '../lib/auth.js'
import { generateSlug } from '../lib/slug.js'
import { renderLayout } from '../views/layout.js'
import { renderPublishForm } from '../views/admin.js'

const admin = new Hono()

admin.get('/admin', authGuard, async (c) => {
  return c.html(renderLayout({
    title: 'New Post — Admin',
    content: renderPublishForm()
  }))
})

admin.post('/admin/posts', authGuard, async (c) => {
  const body = await c.req.parseBody()
  const title = body.title as string
  const content = body.content as string
  const now = new Date()
  const slug = generateSlug(title, now)
  await prisma.post.create({
    data: { title, content, slug, createdAt: now }
  })
  return c.redirect(`/posts/${slug}`)
})

export default admin
