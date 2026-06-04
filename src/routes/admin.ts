import { Hono } from 'hono'
import { getAllPostListItems, getPostBySlug, createPost, updatePost } from '../lib/post-storage.js'
import { authGuard } from '../lib/auth.js'
import { renderLayout } from '../views/layout.js'
import { renderAdminPage, renderEditForm } from '../views/admin.js'

const admin = new Hono()

admin.get('/admin', authGuard, async (c) => {
  const posts = await getAllPostListItems()
  return c.html(renderLayout({
    title: 'Admin',
    content: renderAdminPage(posts)
  }))
})

admin.get('/admin/edit/:slug', authGuard, async (c) => {
  const slug = c.req.param('slug')
  const post = await getPostBySlug(slug)
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
  const updated = await updatePost(slug, title, content)
  return c.redirect('/admin')
})

admin.post('/admin/posts', authGuard, async (c) => {
  const body = await c.req.parseBody()
  const title = body.title as string
  const content = body.content as string
  const post = await createPost(title, content)
  return c.redirect(`/posts/${post.slug}`)
})

export default admin
