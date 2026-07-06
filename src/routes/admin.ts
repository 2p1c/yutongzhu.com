import { Hono } from 'hono'
import { getAllPostListItems, getPostBySlug, createPost, updatePost, getMediaFiles, saveMediaFile, deleteMediaFile, validateMediaFile, generateUploadToken, getTempMediaFiles, saveTempMediaFile, deleteTempMediaFile, migrateTempMedia } from '../lib/post-storage.js'
import { authGuard } from '../lib/auth.js'
import { renderLayout } from '../views/layout.js'
import { renderAdminPage, renderEditForm } from '../views/admin.js'

const admin = new Hono()

admin.get('/admin', authGuard, async (c) => {
  const posts = await getAllPostListItems()
  const token = generateUploadToken()
  const mediaFiles = await getTempMediaFiles(token)
  const error = c.req.query('error') ?? undefined
  return c.html(renderLayout({
    title: 'Admin',
    content: renderAdminPage(posts, token, mediaFiles, error),
  }))
})

admin.get('/admin/edit/:slug', authGuard, async (c) => {
  const slug = c.req.param('slug')!
  const post = await getPostBySlug(slug)
  if (!post) return c.notFound()
  const mediaFiles = await getMediaFiles(slug)
  const error = c.req.query('error') ?? undefined
  return c.html(renderLayout({
    title: 'Edit — Admin',
    content: renderEditForm(post, mediaFiles, error),
  }))
})

admin.post('/admin/edit/:slug', authGuard, async (c) => {
  const slug = c.req.param('slug')!
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
  const token = body.upload_token as string | undefined
  const post = await createPost(title, content)
  if (token) await migrateTempMedia(token, post.slug)
  return c.redirect(`/admin/edit/${post.slug}`)
})

admin.post('/admin/edit/:slug/media', authGuard, async (c) => {
  const slug = c.req.param('slug')!
  const body = await c.req.parseBody()
  const raw = body.media

  // parseBody may return a single File or an array of Files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries: any[] = raw ? (Array.isArray(raw) ? raw : [raw]) : []

  if (entries.length === 0) {
    return c.redirect(`/admin/edit/${slug}?error=${encodeURIComponent('No files selected')}`)
  }

  const files = entries.map((e) => ({
    name: String(e.name ?? ''),
    type: String(e.type ?? ''),
    size: Number(e.size ?? 0),
    arrayBuffer: () =>
      typeof e.arrayBuffer === 'function'
        ? (e.arrayBuffer() as Promise<ArrayBuffer>)
        : Promise.resolve(new ArrayBuffer(0)),
  }))

  for (const file of files) {
    const validation = validateMediaFile(file)
    if (!validation.ok) {
      return c.redirect(`/admin/edit/${slug}?error=${encodeURIComponent(validation.error)}`)
    }
  }

  for (const file of files) {
    const buffer = await file.arrayBuffer()
    await saveMediaFile(slug, { ...file, buffer })
  }

  return c.redirect(`/admin/edit/${slug}`)
})

admin.post('/admin/edit/:slug/media/delete', authGuard, async (c) => {
  const slug = c.req.param('slug')!
  const body = await c.req.parseBody()
  const filename = body.filename as string | undefined

  if (!filename || typeof filename !== 'string') {
    return c.redirect(`/admin/edit/${slug}`)
  }

  const ok = await deleteMediaFile(slug, filename)
  const query = ok ? '' : `?error=${encodeURIComponent('Failed to delete file')}`
  return c.redirect(`/admin/edit/${slug}${query}`)
})

admin.post('/admin/media/upload', authGuard, async (c) => {
  const body = await c.req.parseBody()
  const token = body.token as string | undefined

  if (!token) {
    return c.redirect('/admin?error=' + encodeURIComponent('Missing upload token'))
  }

  const raw = body.media
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries: any[] = raw ? (Array.isArray(raw) ? raw : [raw]) : []

  if (entries.length === 0) {
    return c.redirect(`/admin?error=${encodeURIComponent('No files selected')}`)
  }

  const files = entries.map((e) => ({
    name: String(e.name ?? ''),
    type: String(e.type ?? ''),
    size: Number(e.size ?? 0),
    arrayBuffer: () =>
      typeof e.arrayBuffer === 'function'
        ? (e.arrayBuffer() as Promise<ArrayBuffer>)
        : Promise.resolve(new ArrayBuffer(0)),
  }))

  for (const file of files) {
    const validation = validateMediaFile(file)
    if (!validation.ok) {
      return c.redirect(`/admin?error=${encodeURIComponent(validation.error)}`)
    }
  }

  for (const file of files) {
    const buffer = await file.arrayBuffer()
    await saveTempMediaFile(token, { ...file, buffer })
  }

  return c.redirect('/admin')
})

admin.post('/admin/media/delete', authGuard, async (c) => {
  const body = await c.req.parseBody()
  const token = body.token as string | undefined
  const filename = body.filename as string | undefined

  if (!token || !filename) {
    return c.redirect('/admin')
  }

  const ok = await deleteTempMediaFile(token, filename)
  const query = ok ? '' : '?error=' + encodeURIComponent('Failed to delete file')
  return c.redirect(`/admin${query}`)
})

export default admin
