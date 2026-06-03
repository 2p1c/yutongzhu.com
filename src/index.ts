import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import home from './routes/home.js'
import posts from './routes/posts.js'
import admin from './routes/admin.js'

const app = new Hono()

app.use('/public/*', serveStatic({ root: './' }))
app.get('/favicon.ico', (c) => c.redirect('/public/favicon.png'))

app.route('/', home)
app.route('/', posts)
app.route('/', admin)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
