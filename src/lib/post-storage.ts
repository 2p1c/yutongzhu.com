import { readdir, readFile, writeFile, mkdir, rename, stat, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { generateSlug } from './slug.js'

const POSTS_DIR = join(process.cwd(), 'src', 'posts')
const UPLOADS_DIR = join(POSTS_DIR, '_uploads')

const ALLOWED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
])
const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
])
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export type PostSection = 'musings' | 'reflections'

export interface PostSource {
  url: string
  title: string
}

export function normalizeSection(value: unknown): PostSection {
  return value === 'reflections' ? 'reflections' : 'musings'
}

export function parseSource(url: unknown, title: unknown): PostSource | undefined {
  const sourceTitle = typeof title === 'string' ? title.trim() : ''
  const rawUrl = typeof url === 'string' ? url.trim() : ''
  if (!sourceTitle || !rawUrl) return undefined
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined
    return { url: parsed.href, title: sourceTitle }
  } catch {
    return undefined
  }
}

export interface PostMeta {
  title: string
  titleEn?: string
  date: string
  description?: string
  published: boolean
  section?: PostSection
  sourceUrl?: string
  sourceTitle?: string
}

export interface Post {
  slug: string
  title: string
  titleEn?: string
  content: string
  contentEn?: string
  createdAt: Date
  description?: string
  published: boolean
  section: PostSection
  sourceUrl?: string
  sourceTitle?: string
}

export interface PostListItem {
  slug: string
  title: string
  titleEn?: string
  createdAt: Date
  published: boolean
  section: PostSection
  sourceUrl?: string
  sourceTitle?: string
}

export interface MediaFile {
  name: string
  size: number
  mimeType: string
  kind: 'image' | 'video' | 'other'
  url: string // relative URL, e.g., /posts/<slug>/media/<name>
}

function parseMeta(raw: string, slug: string): PostMeta {
  const meta = JSON.parse(raw) as PostMeta
  if (!meta.title || !meta.date) {
    throw new Error(`Invalid meta.json in post "${slug}": missing title or date`)
  }
  meta.section = normalizeSection(meta.section)
  return meta
}

function postFromDir(slug: string, meta: PostMeta, content: string, contentEn?: string): Post {
  return {
    slug,
    title: meta.title,
    titleEn: meta.titleEn,
    content,
    contentEn,
    createdAt: new Date(meta.date),
    description: meta.description,
    published: meta.published,
    section: normalizeSection(meta.section),
    sourceUrl: meta.sourceUrl,
    sourceTitle: meta.sourceTitle,
  }
}

function applySource(meta: PostMeta, source?: PostSource): void {
  if (!source) return
  meta.sourceUrl = source.url
  meta.sourceTitle = source.title
}

function postListItemFromDir(slug: string, meta: PostMeta): PostListItem {
  return {
    slug,
    title: meta.title,
    titleEn: meta.titleEn,
    createdAt: new Date(meta.date),
    published: meta.published,
    section: normalizeSection(meta.section),
    sourceUrl: meta.sourceUrl,
    sourceTitle: meta.sourceTitle,
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

export async function getAllPostListItems(
  options: { includeUnpublished?: boolean } = {},
): Promise<PostListItem[]> {
  const entries = await readdir(POSTS_DIR, { withFileTypes: true })
  const items: PostListItem[] = []

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue
    const slug = entry.name
    try {
      const metaRaw = await readFile(join(POSTS_DIR, slug, 'meta.json'), 'utf-8')
      const meta = parseMeta(metaRaw, slug)
      if (options.includeUnpublished || meta.published) {
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
    let contentEn: string | undefined
    try {
      contentEn = await readFile(join(POSTS_DIR, slug, 'index_en.md'), 'utf-8')
    } catch {
      contentEn = undefined
    }
    return postFromDir(slug, meta, content, contentEn)
  } catch {
    return null
  }
}

export async function createPost(
  title: string,
  content: string,
  date?: string,
  published: boolean = true,
  section: PostSection = 'musings',
  source?: PostSource,
): Promise<Post> {
  const now = date ? new Date(date) : new Date()
  const slug = generateSlug(title, now)
  const dir = join(POSTS_DIR, slug)

  await mkdir(dir, { recursive: true })

  const meta: PostMeta = {
    title,
    date: now.toISOString().split('T')[0],
    description: '',
    published,
    section: normalizeSection(section),
  }
  applySource(meta, source)

  await writeFile(join(dir, 'meta.json'), JSON.stringify(meta, null, 4) + '\n', 'utf-8')
  await writeFile(join(dir, 'index.md'), content, 'utf-8')

  return postFromDir(slug, meta, content)
}

export async function updatePost(
  slug: string,
  title: string,
  content: string,
  date?: string,
  published?: boolean,
  section?: PostSection,
  source?: PostSource,
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

  let dateValue: string
  if (date) {
    const parsedDate = new Date(date)
    if (!isNaN(parsedDate.getTime())) {
      dateValue = parsedDate.toISOString().split('T')[0]
    } else {
      console.warn(`Invalid date: ${date}, using existing createdAt`)
      dateValue = existing.createdAt.toISOString().split('T')[0]
    }
  } else {
    dateValue = existing.createdAt.toISOString().split('T')[0]
  }

  const meta: PostMeta = {
    title,
    titleEn: existing.titleEn,
    date: dateValue,
    description: existing.description ?? '',
    published: published ?? existing.published,
    section: section ? normalizeSection(section) : existing.section,
  }
  applySource(
    meta,
    source ??
      (existing.sourceUrl && existing.sourceTitle
        ? { url: existing.sourceUrl, title: existing.sourceTitle }
        : undefined),
  )

  const dir = join(POSTS_DIR, newSlug)
  await writeFile(join(dir, 'meta.json'), JSON.stringify(meta, null, 4) + '\n', 'utf-8')
  await writeFile(join(dir, 'index.md'), content, 'utf-8')

  return postFromDir(newSlug, meta, content)
}

export async function saveTranslation(
  slug: string,
  titleEn: string,
  contentEn: string,
): Promise<void> {
  const dir = join(POSTS_DIR, slug)
  await writeFile(join(dir, 'index_en.md'), contentEn, 'utf-8')
  const meta = JSON.parse(await readFile(join(dir, 'meta.json'), 'utf-8')) as PostMeta
  meta.titleEn = titleEn
  await writeFile(join(dir, 'meta.json'), JSON.stringify(meta, null, 4) + '\n', 'utf-8')
}

// ── Media helpers ──

function classifyKind(mimeType: string): MediaFile['kind'] {
  if (ALLOWED_IMAGE_MIME.has(mimeType)) return 'image'
  if (ALLOWED_VIDEO_MIME.has(mimeType)) return 'video'
  return 'other'
}

function guessMime(name: string): string {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
  }
  return map[ext] ?? 'application/octet-stream'
}

export function sanitizeFilename(raw: string): string {
  const dotIdx = raw.lastIndexOf('.')
  const ext = dotIdx >= 0 ? raw.slice(dotIdx).toLowerCase() : ''
  const base = dotIdx >= 0 ? raw.slice(0, dotIdx) : raw
  const cleaned = base
    .replace(/[^a-zA-Z0-9_\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
    .replace(/^-|-$/g, '')
  const safe = cleaned || 'file'
  return safe + ext
}

export function validateMediaFile(
  file: { name: string; type: string; size: number },
): { ok: true } | { ok: false; error: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      error: `File "${file.name}" exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB limit`,
    }
  }
  if (
    !ALLOWED_IMAGE_MIME.has(file.type) &&
    !ALLOWED_VIDEO_MIME.has(file.type)
  ) {
    return { ok: false, error: `File type "${file.type}" is not allowed` }
  }
  const name = file.name.replace(/\\/g, '/')
  if (name.includes('/') || name.includes('..')) {
    return { ok: false, error: `Invalid filename: "${file.name}"` }
  }
  return { ok: true }
}

export async function getMediaFiles(slug: string): Promise<MediaFile[]> {
  const mediaDir = join(POSTS_DIR, slug, 'media')
  try {
    const entries = await readdir(mediaDir, { withFileTypes: true })
    const files: MediaFile[] = []
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const st = await stat(join(mediaDir, entry.name))
      const mimeType = guessMime(entry.name)
      files.push({
        name: entry.name,
        size: st.size,
        mimeType,
        kind: classifyKind(mimeType),
        url: `/posts/${slug}/media/${entry.name}`,
      })
    }
    files.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'image' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return files
  } catch {
    return []
  }
}

export async function saveMediaFile(
  slug: string,
  file: { name: string; type: string; size: number; buffer: ArrayBuffer },
): Promise<MediaFile> {
  const dir = join(POSTS_DIR, slug, 'media')
  await mkdir(dir, { recursive: true })
  const safeName = sanitizeFilename(file.name)
  const dest = join(dir, safeName)
  await writeFile(dest, Buffer.from(file.buffer))
  return {
    name: safeName,
    size: file.size,
    mimeType: file.type,
    kind: classifyKind(file.type),
    url: `/posts/${slug}/media/${safeName}`,
  }
}

export async function deleteMediaFile(
  slug: string,
  filename: string,
): Promise<boolean> {
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return false
  }
  const filePath = join(POSTS_DIR, slug, 'media', filename)
  try {
    await rm(filePath)
    return true
  } catch {
    return false
  }
}

// ── Temp upload helpers (for new post page) ──

export function generateUploadToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 16; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

export async function getTempMediaFiles(token: string): Promise<MediaFile[]> {
  const dir = join(UPLOADS_DIR, token)
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const files: MediaFile[] = []
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const st = await stat(join(dir, entry.name))
      const mimeType = guessMime(entry.name)
      files.push({
        name: entry.name,
        size: st.size,
        mimeType,
        kind: classifyKind(mimeType),
        url: `/posts/_uploads/${token}/${entry.name}`,
      })
    }
    files.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'image' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return files
  } catch {
    return []
  }
}

export async function saveTempMediaFile(
  token: string,
  file: { name: string; type: string; size: number; buffer: ArrayBuffer },
): Promise<MediaFile> {
  const dir = join(UPLOADS_DIR, token)
  await mkdir(dir, { recursive: true })
  const safeName = sanitizeFilename(file.name)
  const dest = join(dir, safeName)
  await writeFile(dest, Buffer.from(file.buffer))
  return {
    name: safeName,
    size: file.size,
    mimeType: file.type,
    kind: classifyKind(file.type),
    url: `/posts/_uploads/${token}/${safeName}`,
  }
}

export async function deleteTempMediaFile(
  token: string,
  filename: string,
): Promise<boolean> {
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return false
  }
  const filePath = join(UPLOADS_DIR, token, filename)
  try {
    await rm(filePath)
    return true
  } catch {
    return false
  }
}

export async function migrateTempMedia(
  token: string,
  slug: string,
): Promise<void> {
  const srcDir = join(UPLOADS_DIR, token)
  try {
    await stat(srcDir)
  } catch {
    return // no temp files to migrate
  }

  const destDir = join(POSTS_DIR, slug, 'media')
  await mkdir(destDir, { recursive: true })

  const entries = await readdir(srcDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    await rename(join(srcDir, entry.name), join(destDir, entry.name))
  }

  // Clean up the now-empty temp directory
  await rm(srcDir, { recursive: true, force: true })
}
