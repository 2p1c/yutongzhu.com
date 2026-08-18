import { Hono } from 'hono'
import { getAllPostListItems, getPostBySlug, createPost, updatePost, getMediaFiles, saveMediaFile, deleteMediaFile, validateMediaFile } from '../lib/post-storage.js'
import { authGuard } from '../lib/auth.js'
import { translateAndSave } from '../lib/model.js'
import { renderLayout } from '../views/layout.js'
import { renderAdminPage, renderEditForm } from '../views/admin.js'

const admin = new Hono()

admin.get('/admin', authGuard, async (c) => {
  const posts = await getAllPostListItems()
  const error = c.req.query('error') ?? undefined
  return c.html(renderLayout({
    title: 'Admin',
    showTranslate: false,
    content: renderAdminPage(posts, error),
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
    showTranslate: false,
    content: renderEditForm(post, mediaFiles, error),
  }))
})

admin.post('/admin/edit/:slug', authGuard, async (c) => {
  const slug = c.req.param('slug')!
  const body = await c.req.parseBody()
  const title = body.title as string
  const content = body.content as string
  const updated = await updatePost(slug, title, content)
  await translateAndSave(updated.slug, title, content)
  return c.redirect('/admin')
})

admin.post('/admin/posts', authGuard, async (c) => {
  const body = await c.req.parseBody()
  const title = body.title as string
  const description = ((body.description as string) ?? '').trim() || title

  // Optional cover image: validate before creating the post so a bad upload
  // never leaves behind an empty post directory.
  const raw = body.cover
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries: any[] = raw ? (Array.isArray(raw) ? raw : [raw]) : []
  const coverEntry = entries[0]
  let coverFile: { name: string; type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> } | undefined
  if (coverEntry && Number(coverEntry.size ?? 0) > 0) {
    coverFile = {
      name: String(coverEntry.name ?? ''),
      type: String(coverEntry.type ?? ''),
      size: Number(coverEntry.size ?? 0),
      arrayBuffer: () =>
        typeof coverEntry.arrayBuffer === 'function'
          ? (coverEntry.arrayBuffer() as Promise<ArrayBuffer>)
          : Promise.resolve(new ArrayBuffer(0)),
    }
    const validation = validateMediaFile(coverFile)
    if (!validation.ok) {
      return c.redirect(`/admin?error=${encodeURIComponent(validation.error)}`)
    }
  }

  const post = await createPost(title, '')

  if (coverFile) {
    const buffer = await coverFile.arrayBuffer()
    const saved = await saveMediaFile(post.slug, { ...coverFile, buffer })
    const content = `<div align="center">\n\n![${description}](./media/${saved.name})\n\n</div>\n`
    await updatePost(post.slug, title, content)
    await translateAndSave(post.slug, title, content)
  }

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

export default admin
