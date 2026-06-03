import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authGuard } from '../lib/auth.js'
import { generateSlug } from '../lib/slug.js'
import { renderLayout } from '../views/layout.js'
import { renderAdminPage, renderEditForm } from '../views/admin.js'

const admin = new Hono()

admin.get('/admin', authGuard, async (c) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: { slug: true, title: true, createdAt: true }
  })
  return c.html(renderLayout({
    title: 'Admin',
    content: renderAdminPage(posts)
  }))
})

admin.get('/admin/edit/:slug', authGuard, async (c) => {
  const slug = c.req.param('slug')
  const post = await prisma.post.findUnique({ where: { slug } })
  if (!post) return c.notFound()
  return c.html(renderLayout({
    title: 'Edit — Admin',
    content: renderEditForm(post)
  }))
})

admin.post('/admin/edit/:slug', authGuard, async (c) => {
  const slug = c.req.param('slug')
  const body = await c.req.parseBody()
  const title = body.title as string
  const content = body.content as string
  const newSlug = generateSlug(title, new Date())
  await prisma.post.update({
    where: { slug },
    data: { title, content, slug: newSlug }
  })
  return c.redirect('/admin')
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
