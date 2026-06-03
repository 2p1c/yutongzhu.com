import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { renderLayout } from '../views/layout.js'
import { renderHomeBody } from '../views/home.js'

const home = new Hono()

home.get('/', async (c) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return c.html(renderLayout({
    title: '{yutongzhu}',
    content: renderHomeBody(posts)
  }))
})

export default home
