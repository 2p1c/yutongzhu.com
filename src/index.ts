import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import home from './routes/home'
import posts from './routes/posts'
import admin from './routes/admin'

const app = new Hono()

app.use('/public/*', serveStatic({ root: './' }))

app.route('/', home)
app.route('/', posts)
app.route('/', admin)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
