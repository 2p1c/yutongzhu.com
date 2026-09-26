import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import sharp from 'sharp'
import { mkdtemp, rm, mkdir, writeFile, stat, utimes } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { addImageSizes, prepareMedia, type ImageSize } from './media-optimize.js'

describe('prepareMedia', () => {
  let root: string
  let src: string
  let cache: string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'media-'))
    src = join(root, 'src')
    cache = join(root, 'cache')
    await mkdir(src)
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('shrinks large images, copies other files, and reports sizes', async () => {
    const noise = Buffer.alloc(3000 * 2000 * 3)
    for (let i = 0; i < noise.length; i++) noise[i] = (i * 7919) % 256
    await sharp(noise, { raw: { width: 3000, height: 2000, channels: 3 } })
      .jpeg({ quality: 100 })
      .toFile(join(src, 'big.jpg'))
    await writeFile(join(src, 'doc.pdf'), 'pdf')

    const { files, sizes } = await prepareMedia(src, cache)

    expect(files.sort()).toEqual(['big.jpg', 'doc.pdf'])
    expect(sizes.get('big.jpg')).toEqual({ width: 1280, height: 853, opaque: true })
    expect(sizes.has('doc.pdf')).toBe(false)
    expect((await stat(join(cache, 'big.jpg'))).size).toBeLessThan((await stat(join(src, 'big.jpg'))).size)
  })

  it('reuses the cached copy until the source changes', async () => {
    await sharp({ create: { width: 10, height: 10, channels: 3, background: '#f00' } })
      .png()
      .toFile(join(src, 'a.png'))
    await prepareMedia(src, cache)
    const first = (await stat(join(cache, 'a.png'))).mtimeMs

    await prepareMedia(src, cache)
    expect((await stat(join(cache, 'a.png'))).mtimeMs).toBe(first)

    const later = new Date(first + 60_000)
    await utimes(join(src, 'a.png'), later, later)
    await prepareMedia(src, cache)
    expect((await stat(join(cache, 'a.png'))).mtimeMs).toBeGreaterThan(first)
  })

  it('returns nothing when the post has no media folder', async () => {
    const { files, sizes } = await prepareMedia(join(root, 'missing'), cache)
    expect(files).toEqual([])
    expect(sizes.size).toBe(0)
  })
})

describe('addImageSizes', () => {
  const sizes = new Map<string, ImageSize>([
    ['photo.jpg', { width: 1280, height: 960, opaque: true }],
    ['shot.png', { width: 800, height: 400, opaque: false }],
  ])

  it('adds width and aspect ratio with a placeholder for opaque images', () => {
    const html = '<img src="./media/photo.jpg" alt="a" loading="lazy" decoding="async" />'
    expect(addImageSizes(html, sizes)).toBe(
      '<img src="./media/photo.jpg" alt="a" loading="lazy" decoding="async" width="1280" style="aspect-ratio: 1280 / 960; background-color: var(--code-bg)" />',
    )
  })

  it('keeps an author-set width and skips the placeholder for transparent images', () => {
    const html = '<img src="./media/shot.png" alt="" width="70%" loading="lazy" />'
    expect(addImageSizes(html, sizes)).toBe(
      '<img src="./media/shot.png" alt="" width="70%" loading="lazy" style="aspect-ratio: 800 / 400" />',
    )
  })

  it('leaves unknown and external images alone', () => {
    const html = '<img src="./media/gone.jpg" alt="" /><img src="https://x.com/a.jpg" alt="" />'
    expect(addImageSizes(html, sizes)).toBe(html)
  })
})
