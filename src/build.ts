import { writeFile, mkdir, cp, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { getAllPostListItems, getPostBySlug } from './lib/post-storage.js'
import { renderMarkdown } from './lib/markdown.js'
import { renderLayout } from './views/layout.js'
import { renderHomeBody } from './views/home.js'
import { renderPostBody } from './views/post.js'

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, 'public')
const POSTS_SRC = join(ROOT, 'src', 'posts')

async function buildHome(): Promise<void> {
  const posts = await getAllPostListItems()
  const content = renderHomeBody(posts)
  const html = renderLayout({ title: '{yutongzhu}', content })
  await writeFile(join(OUT_DIR, 'index.html'), String(html))
  console.log('Built: public/index.html')
}

async function buildPosts(): Promise<void> {
  const slugs = await getAllPostListItems()

  for (const item of slugs) {
    const post = await getPostBySlug(item.slug)
    if (!post) continue

    const contentHtml = renderMarkdown(post.content)
    const contentHtmlEn = post.contentEn ? renderMarkdown(post.contentEn) : undefined
    const body = renderPostBody({
      title: post.title,
      titleEn: post.titleEn,
      contentHtml,
      contentHtmlEn,
      createdAt: post.createdAt,
      source:
        post.section === 'reflections' && post.sourceUrl && post.sourceTitle
          ? { url: post.sourceUrl, title: post.sourceTitle }
          : undefined,
    })
    const html = renderLayout({ title: post.title, content: body })

    const outDir = join(OUT_DIR, 'posts', post.slug)
    await mkdir(outDir, { recursive: true })
    await writeFile(join(outDir, 'index.html'), String(html))
    console.log(`Built: public/posts/${post.slug}/index.html`)

    // Copy media files if they exist
    const mediaSrc = join(POSTS_SRC, post.slug, 'media')
    if (existsSync(mediaSrc)) {
      const files = await readdir(mediaSrc)
      if (files.length > 0) {
        await cp(mediaSrc, join(outDir, 'media'), { recursive: true })
        console.log(`  └─ Copied ${files.length} media file(s)`)
      }
    }
  }
}

async function build(): Promise<void> {
  // Clean previous build output (but keep style.css, images, etc.)
  await rm(join(OUT_DIR, 'posts'), { recursive: true, force: true })
  await rm(join(OUT_DIR, 'index.html'), { force: true })

  await buildHome()
  console.log('')
  await buildPosts()

  console.log(`\n✅ Build complete — ${join(OUT_DIR)}`)
}

build().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
