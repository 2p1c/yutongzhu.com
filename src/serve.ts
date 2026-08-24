import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'

const app = new Hono()

// Redirect /posts/<slug> → /posts/<slug>/ for correct static index.html resolution
app.get('/posts/:slug', (c) => {
  return c.redirect(`/posts/${c.req.param('slug')}/`)
})

// Redirect /about → /about/ for correct static index.html resolution
app.get('/about', (c) => {
  return c.redirect('/about/')
})

// Redirect /agent → /agent/ for correct static index.html resolution
app.get('/agent', (c) => {
  return c.redirect('/agent/')
})

app.use('/*', serveStatic({ root: './public' }))

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Static server running at http://localhost:${info.port}`)
})
