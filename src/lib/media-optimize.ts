import sharp, { type Sharp } from 'sharp'
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

export interface ImageSize {
  width: number
  height: number
  opaque: boolean
}

export interface PreparedMedia {
  files: string[]
  sizes: Map<string, ImageSize>
}

// 正文栏最宽 640px，按 2 倍屏留够。
const MAX_EDGE = 1280

// GIF 可能是动图，SVG 是矢量，都原样复制。
const ENCODERS: Partial<Record<string, (image: Sharp) => Sharp>> = {
  '.jpg': (image) => image.jpeg({ quality: 80, mozjpeg: true }),
  '.jpeg': (image) => image.jpeg({ quality: 80, mozjpeg: true }),
  '.png': (image) => image.png({ palette: true, quality: 85, compressionLevel: 9 }),
  '.webp': (image) => image.webp({ quality: 80 }),
}

async function isFresh(cached: string, sourceMtimeMs: number): Promise<boolean> {
  try {
    return (await stat(cached)).mtimeMs >= sourceMtimeMs
  } catch {
    return false
  }
}

// 把 srcDir 里的媒体准备到 cacheDir：图片缩到 MAX_EDGE 以内并重新压缩，其余文件原样复制。
// 缓存比源文件新就跳过，所以每次重建只有新上传或改过的图片要花时间。文件名不变，Markdown 不用改。
// 返回这次准备好的文件名（缓存里可能残留源目录已删掉的旧文件，调用方只该复制这些），
// 以及每张图压缩后的宽高，页面据此提前留出位置。
export async function prepareMedia(
  srcDir: string,
  cacheDir: string,
): Promise<PreparedMedia> {
  const prepared: PreparedMedia = { files: [], sizes: new Map() }
  let names: string[]
  try {
    names = await readdir(srcDir)
  } catch {
    return prepared
  }
  await mkdir(cacheDir, { recursive: true })

  for (const name of names) {
    if (name.startsWith('.')) continue
    const src = join(srcDir, name)
    const cached = join(cacheDir, name)
    const source = await stat(src)
    if (!source.isFile()) continue

    const encodeAs = ENCODERS[extname(name).toLowerCase()]
    if (!(await isFresh(cached, source.mtimeMs))) {
      if (encodeAs) {
        const resized = sharp(src)
          .autoOrient()
          .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        const out = await encodeAs(resized).toBuffer()
        // 本来就很小的图，重新编码反而可能变大。
        if (out.length < source.size) await writeFile(cached, out)
        else await copyFile(src, cached)
      } else {
        await copyFile(src, cached)
      }
    }

    prepared.files.push(name)
    if (encodeAs) {
      const meta = await sharp(cached).metadata()
      prepared.sizes.set(name, {
        width: meta.autoOrient.width,
        height: meta.autoOrient.height,
        opaque: !meta.hasAlpha,
      })
    }
  }
  return prepared
}

// 给指向 ./media/ 的 <img> 补上比例和宽度，图片下载完之前浏览器就按比例留好位置，不再从 0 高度撑开。
// 不透明的图加一层浅底色当占位；透明图不加，否则底色会一直透出来。
export function addImageSizes(html: string, sizes: Map<string, ImageSize>): string {
  return html.replace(/<img src="\.\/media\/([^"]+)"([^>]*?)\s*\/>/g, (tag, file: string, rest: string) => {
    const size = sizes.get(decodeURIComponent(file))
    if (!size) return tag
    const width = /\swidth="/.test(rest) ? '' : ` width="${size.width}"`
    const background = size.opaque ? '; background-color: var(--code-bg)' : ''
    return `<img src="./media/${file}"${rest}${width} style="aspect-ratio: ${size.width} / ${size.height}${background}" />`
  })
}
