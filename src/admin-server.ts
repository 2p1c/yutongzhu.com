import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import admin from './routes/admin.js'

const app = new Hono()
app.route('/', admin)

const port = Number(process.env.PORT) || 3000
const hostname = process.env.HOST || '127.0.0.1'

serve({ fetch: app.fetch, port, hostname }, (info) => {
  console.log(`Admin server listening on http://${info.address}:${info.port}`)
})
