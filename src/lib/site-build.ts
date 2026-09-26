import { writeFile, mkdir, copyFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { getAllPostListItems, getPostBySlug, postDescription, visiblePostSource, type PostListItem } from './post-storage.js'
import { renderMarkdown } from './markdown.js'
import { addImageSizes, prepareMedia, type PreparedMedia } from './media-optimize.js'
import { renderLayout } from '../views/layout.js'
import { HOME_DESCRIPTION, renderHomeBody } from '../views/home.js'
import { renderPostBody } from '../views/post.js'

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, 'public')
const POSTS_SRC = join(ROOT, 'src', 'posts')
const MEDIA_CACHE = join(ROOT, 'node_modules', '.cache', 'post-media')

async function buildHome(posts: PostListItem[]): Promise<void> {
  const content = renderHomeBody(posts)
  const html = renderLayout({ title: '{yutongzhu}', description: HOME_DESCRIPTION, content })
  await writeFile(join(OUT_DIR, 'index.html'), String(html))
  console.log('Built: public/index.html')
}

async function buildPosts(items: PostListItem[], media: Map<string, PreparedMedia>): Promise<void> {
  for (const item of items) {
    const post = await getPostBySlug(item.slug)
    if (!post) continue

    const prepared = media.get(post.slug) ?? { files: [], sizes: new Map() }
    const contentHtml = addImageSizes(renderMarkdown(post.content), prepared.sizes)
    const contentHtmlEn = post.contentEn
      ? addImageSizes(renderMarkdown(post.contentEn), prepared.sizes)
      : undefined
    const body = renderPostBody({
      title: post.title,
      titleEn: post.titleEn,
      contentHtml,
      contentHtmlEn,
      createdAt: post.createdAt,
      source: visiblePostSource(post),
    })
    const html = renderLayout({ title: post.title, description: postDescription(post), content: body })

    const outDir = join(OUT_DIR, 'posts', post.slug)
    await mkdir(outDir, { recursive: true })
    await writeFile(join(outDir, 'index.html'), String(html))
    console.log(`Built: public/posts/${post.slug}/index.html`)

    if (prepared.files.length > 0) {
      const mediaOut = join(outDir, 'media')
      await mkdir(mediaOut, { recursive: true })
      for (const file of prepared.files) {
        await copyFile(join(MEDIA_CACHE, post.slug, file), join(mediaOut, file))
      }
      console.log(`  └─ Copied ${prepared.files.length} media file(s)`)
    }
  }
}

export async function buildSite(): Promise<void> {
  const items = await getAllPostListItems()

  // 图片压缩是重建里最慢的一步，放在删除旧产物之前做完；删除之后只剩写 HTML 和复制文件，
  // 公开页 404 的窗口不会因为压缩而变长。
  const media = new Map<string, PreparedMedia>()
  for (const item of items) {
    media.set(item.slug, await prepareMedia(join(POSTS_SRC, item.slug, 'media'), join(MEDIA_CACHE, item.slug)))
  }

  await rm(join(OUT_DIR, 'posts'), { recursive: true, force: true })
  await rm(join(OUT_DIR, 'index.html'), { force: true })

  await buildHome(items)
  console.log('')
  await buildPosts(items, media)

  console.log(`\n✅ Build complete — ${join(OUT_DIR)}`)
}
