import { Hono } from 'hono'
import { getAllPosts, getPostBySlug, createPost } from '../lib/post-storage.js'
import { renderMarkdown } from '../lib/markdown.js'
import { renderLayout } from '../views/layout.js'
import { renderPostBody } from '../views/post.js'

const posts = new Hono()

async function servePost(c: any, slug: string) {
  const post = await getPostBySlug(slug)
  if (!post) {
    return c.notFound()
  }
  const contentHtml = renderMarkdown(post.content)
  const contentHtmlEn = post.contentEn ? renderMarkdown(post.contentEn) : undefined
  return c.html(renderLayout({
    title: post.title,
    content: renderPostBody({
      title: post.title,
      titleEn: post.titleEn,
      contentHtml,
      contentHtmlEn,
      createdAt: post.createdAt
    })
  }))
}

posts.get('/posts/:slug', async (c) => {
  const slug = c.req.param('slug')
  return servePost(c, slug)
})

posts.get('/posts/:slug/', async (c) => {
  const slug = c.req.param('slug')
  return servePost(c, slug)
})

posts.get('/api/posts', async (c) => {
  const allPosts = await getAllPosts()
  return c.json(allPosts)
})

posts.post('/api/posts', async (c) => {
  const body = await c.req.json()
  const newPost = await createPost(body.title, body.content)
  return c.json(newPost, 201)
})

export default posts
