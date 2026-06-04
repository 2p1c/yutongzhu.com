import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import home from './routes/home.js'
import posts from './routes/posts.js'
import admin from './routes/admin.js'

const app = new Hono()

// Serve static assets — must be before routes
app.use('/style.css', serveStatic({ root: './public' }))
app.use('/images/*', serveStatic({ root: './public' }))
app.use('/favicon.png', serveStatic({ root: './public' }))
// Serve post media files from src/posts/<slug>/media/
app.use('/posts/*', serveStatic({ root: './src' }))

app.route('/', home)
app.route('/', posts)
app.route('/', admin)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
