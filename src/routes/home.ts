import { Hono } from 'hono'
import { getAllPostListItems } from '../lib/post-storage.js'
import { renderLayout } from '../views/layout.js'
import { HOME_DESCRIPTION, renderHomeBody } from '../views/home.js'

const home = new Hono()

home.get('/', async (c) => {
  const posts = await getAllPostListItems()
  return c.html(renderLayout({
    title: '{yutongzhu}',
    description: HOME_DESCRIPTION,
    content: renderHomeBody(posts)
  }))
})

export default home
