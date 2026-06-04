import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'

const app = new Hono()

// Redirect /posts/<slug> → /posts/<slug>/ for correct static index.html resolution
app.get('/posts/:slug', (c) => {
  return c.redirect(`/posts/${c.req.param('slug')}/`)
})

app.use('/*', serveStatic({ root: './public' }))

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Static server running at http://localhost:${info.port}`)
})
