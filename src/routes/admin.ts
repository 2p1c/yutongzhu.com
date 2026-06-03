import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { setAuthCookie, isAuthenticated, authGuard } from '../lib/auth.js'
import { generateSlug } from '../lib/slug.js'
import { renderLayout } from '../views/layout.js'
import { renderLoginForm, renderPublishForm } from '../views/admin.js'

const admin = new Hono()

admin.get('/admin', async (c) => {
  if (isAuthenticated(c)) {
    return c.html(renderLayout({
      title: 'New Post — Admin',
      content: renderPublishForm()
    }))
  }
  const error = c.req.query('error')
  const message = error === 'unauthorized'
    ? 'Please log in first.'
    : error === 'wrong_password'
      ? 'Incorrect password.'
      : undefined
  return c.html(renderLayout({
    title: 'Login — Admin',
    content: renderLoginForm(message)
  }))
})

admin.post('/admin/login', async (c) => {
  const body = await c.req.parseBody()
  const password = body.password as string
  if (password === process.env.ADMIN_PASSWORD) {
    setAuthCookie(c)
    return c.redirect('/admin')
  }
  return c.redirect('/admin?error=wrong_password')
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
