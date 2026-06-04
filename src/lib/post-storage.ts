import { readdir, readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { generateSlug } from './slug.js'

const POSTS_DIR = join(process.cwd(), 'src', 'posts')

export interface PostMeta {
  title: string
  date: string
  description?: string
  published: boolean
}

export interface Post {
  slug: string
  title: string
  content: string
  createdAt: Date
  description?: string
  published: boolean
}

export interface PostListItem {
  slug: string
  title: string
  createdAt: Date
}

function parseMeta(raw: string, slug: string): PostMeta {
  const meta = JSON.parse(raw) as PostMeta
  if (!meta.title || !meta.date) {
    throw new Error(`Invalid meta.json in post "${slug}": missing title or date`)
  }
  return meta
}

function postFromDir(slug: string, meta: PostMeta, content: string): Post {
  return {
    slug,
    title: meta.title,
    content,
    createdAt: new Date(meta.date),
    description: meta.description,
    published: meta.published,
  }
}

function postListItemFromDir(slug: string, meta: PostMeta): PostListItem {
  return {
    slug,
    title: meta.title,
    createdAt: new Date(meta.date),
  }
}

async function postDirExists(slug: string): Promise<boolean> {
  try {
    const s = await stat(join(POSTS_DIR, slug))
    return s.isDirectory()
  } catch {
    return false
  }
}

export async function getAllPostListItems(): Promise<PostListItem[]> {
  const entries = await readdir(POSTS_DIR, { withFileTypes: true })
  const items: PostListItem[] = []

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue
    const slug = entry.name
    try {
      const metaRaw = await readFile(join(POSTS_DIR, slug, 'meta.json'), 'utf-8')
      const meta = parseMeta(metaRaw, slug)
      if (meta.published) {
        items.push(postListItemFromDir(slug, meta))
      }
    } catch {
      // Skip invalid post folders silently
    }
  }

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return items
}

export async function getAllPosts(): Promise<Post[]> {
  const entries = await readdir(POSTS_DIR, { withFileTypes: true })
  const posts: Post[] = []

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue
    const slug = entry.name
    try {
      const metaRaw = await readFile(join(POSTS_DIR, slug, 'meta.json'), 'utf-8')
      const meta = parseMeta(metaRaw, slug)
      const content = await readFile(join(POSTS_DIR, slug, 'index.md'), 'utf-8')
      posts.push(postFromDir(slug, meta, content))
    } catch {
      // Skip invalid post folders silently
    }
  }

  posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return posts
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!(await postDirExists(slug))) return null

  try {
    const metaRaw = await readFile(join(POSTS_DIR, slug, 'meta.json'), 'utf-8')
    const meta = parseMeta(metaRaw, slug)
    const content = await readFile(join(POSTS_DIR, slug, 'index.md'), 'utf-8')
    return postFromDir(slug, meta, content)
  } catch {
    return null
  }
}

export async function createPost(title: string, content: string): Promise<Post> {
  const now = new Date()
  const slug = generateSlug(title, now)
  const dir = join(POSTS_DIR, slug)

  await mkdir(dir, { recursive: true })

  const meta: PostMeta = {
    title,
    date: now.toISOString().split('T')[0],
    description: '',
    published: true,
  }

  await writeFile(join(dir, 'meta.json'), JSON.stringify(meta, null, 4) + '\n', 'utf-8')
  await writeFile(join(dir, 'index.md'), content, 'utf-8')

  return postFromDir(slug, meta, content)
}

export async function updatePost(
  slug: string,
  title: string,
  content: string,
): Promise<Post> {
  const existing = await getPostBySlug(slug)
  if (!existing) throw new Error(`Post "${slug}" not found`)

  const newSlug = generateSlug(title, existing.createdAt)

  if (newSlug !== slug) {
    const oldDir = join(POSTS_DIR, slug)
    const newDir = join(POSTS_DIR, newSlug)
    if (await postDirExists(newSlug)) {
      throw new Error(`Cannot rename: target slug "${newSlug}" already exists`)
    }
    await rename(oldDir, newDir)
  }

  const meta: PostMeta = {
    title,
    date: existing.createdAt.toISOString().split('T')[0],
    description: existing.description ?? '',
    published: existing.published,
  }

  const dir = join(POSTS_DIR, newSlug)
  await writeFile(join(dir, 'meta.json'), JSON.stringify(meta, null, 4) + '\n', 'utf-8')
  await writeFile(join(dir, 'index.md'), content, 'utf-8')

  return postFromDir(newSlug, meta, content)
}
