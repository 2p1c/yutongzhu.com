import { html } from 'hono/html'
import type { MediaFile } from '../lib/post-storage.js'

interface PostItem {
  slug: string
  title: string
  createdAt: Date
  published: boolean
}

export function renderAdminPage(posts: PostItem[], error?: string) {
  const today = new Date().toISOString().split('T')[0]
  return html`<section class="admin">
    <h2>Published</h2>
    ${renderPostList(posts.filter(p => p.published))}

    <h2>Drafts</h2>
    ${renderPostList(posts.filter(p => !p.published))}

    ${error ? html`<p class="admin-media-error">${error}</p>` : ''}

    <h2>New Post</h2>
    <form method="POST" action="/admin/posts" enctype="multipart/form-data">
      <input
        type="text"
        name="title"
        placeholder="Title"
        class="admin-input"
        required
        autofocus
      />
      <input
        type="date"
        name="date"
        class="admin-input"
        value="${today}"
        required
      />
      <input
        type="text"
        name="description"
        placeholder="Cover image description (alt text, optional)"
        class="admin-input"
      />
      <input
        type="file"
        name="cover"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        class="admin-file-input"
      />
      <p class="admin-media-hint">Cover image is optional (PNG, JPG, GIF, WebP, SVG)</p>
      <div class="admin-actions">
        <button type="submit" class="admin-btn">Create</button>
        <a href="/" class="admin-link">Cancel</a>
      </div>
    </form>
  </section>`
}

export function renderEditForm(
  post: { slug: string; title: string; content: string; createdAt: Date },
  mediaFiles: MediaFile[] = [],
  mediaError?: string,
) {
  const dateStr = post.createdAt.toISOString().split('T')[0]
  return html`<section class="admin">
    <h2>Edit</h2>
    <form method="POST" action="/admin/edit/${post.slug}">
      <input
        type="text"
        name="title"
        placeholder="Title"
        class="admin-input"
        value="${post.title}"
        required
        autofocus
      />
      <input
        type="date"
        name="date"
        class="admin-input"
        value="${dateStr}"
        required
      />
      <textarea
        name="content"
        placeholder="Markdown content..."
        class="admin-textarea"
        rows="25"
        required
      >${post.content}</textarea>
      <div class="admin-actions">
        <button type="submit" name="published" value="false" class="admin-btn">Save as draft</button>
        <button type="submit" name="published" value="true" class="admin-btn">Publish</button>
        <a href="/admin" class="admin-link">Cancel</a>
      </div>
    </form>
    ${renderMediaSection({ slug: post.slug }, mediaFiles, mediaError)}
    <script>
      (function () {
        const form = document.querySelector('form[action^="/admin/edit/"]')
        if (!form) return
        const slug = new URL(form.action).pathname.split('/').pop()
        const KEY = 'draft:post:' + slug
        const title = form.elements.title
        const date = form.elements.date
        const content = form.elements.content
        let timer

        function persist() {
          localStorage.setItem(KEY, JSON.stringify({
            title: title.value,
            date: date.value,
            content: content.value,
            savedAt: Date.now(),
          }))
        }
        form.addEventListener('input', () => {
          clearTimeout(timer)
          timer = setTimeout(persist, 2000)
        })

        // 进入页面时恢复上次未保存的草稿
        const raw = localStorage.getItem(KEY)
        if (raw) {
          try {
            const draft = JSON.parse(raw)
            title.value = draft.title || title.value
            date.value = draft.date || date.value
            content.value = draft.content || content.value
            const bar = document.createElement('div')
            bar.className = 'admin-draft-bar'
            const when = new Date(draft.savedAt).toLocaleTimeString()
            bar.appendChild(document.createTextNode('已恢复上次未保存的草稿（' + when + '） '))
            const discard = document.createElement('a')
            discard.href = '#'
            discard.textContent = '丢弃草稿'
            discard.onclick = (e) => {
              e.preventDefault()
              localStorage.removeItem(KEY)
              location.reload()
            }
            bar.appendChild(discard)
            form.insertBefore(bar, form.firstChild)
          } catch (e) {}
        }

        // 表单提交成功后清掉草稿
        form.addEventListener('submit', () => localStorage.removeItem(KEY))
      })()
    </script>
  </section>`
}

function renderPostList(posts: PostItem[]) {
  if (posts.length === 0) {
    return html`<p class="admin-empty">No posts yet.</p>`
  }
  return html`<ul class="admin-post-list">
    ${posts.map(p => {
      const dateStr = new Date(p.createdAt).toISOString().split('T')[0]
      return html`<li class="admin-post-item">
        <span class="admin-post-date">${dateStr}</span>
        <a class="admin-post-title" href="/posts/${p.slug}/">${p.title}</a>
        <a class="admin-post-edit" href="/admin/edit/${p.slug}">Edit</a>
      </li>`
    })}
  </ul>`
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function renderMediaSection(
  target: { slug: string } | { token: string },
  mediaFiles: MediaFile[],
  error?: string,
) {
  const allowedAccept = [
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime',
  ].join(',')

  const isToken = 'token' in target
  const uploadAction = isToken
    ? '/admin/media/upload'
    : `/admin/edit/${target.slug}/media`
  const deleteAction = isToken
    ? '/admin/media/delete'
    : `/admin/edit/${target.slug}/media/delete`
  const tokenField = isToken
    ? html`<input type="hidden" name="token" value="${target.token}" />`
    : ''

  return html`<section class="admin-media-section">
    <h2>Media</h2>

    ${error ? html`<p class="admin-media-error">${error}</p>` : ''}

    <form method="POST" action="${uploadAction}" enctype="multipart/form-data" class="admin-media-upload">
      ${tokenField}
      <div class="admin-media-upload-row">
        <input
          type="file"
          name="media"
          multiple
          accept="${allowedAccept}"
          class="admin-file-input"
        />
        <button type="submit" class="admin-btn admin-btn-small">Upload</button>
      </div>
      <p class="admin-media-hint">PNG, JPG, GIF, WebP, SVG, MP4, WebM, MOV &mdash; max 50 MB</p>
    </form>

    ${mediaFiles.length === 0
      ? html`<p class="admin-media-empty">No media files yet.</p>`
      : html`<ul class="admin-media-list">
          ${mediaFiles.map(f => html`<li class="admin-media-item">
            <span class="admin-media-preview">
              ${f.kind === 'image'
                ? html`<img src="${f.url}" alt="${f.name}" width="80" height="60" loading="lazy" />`
                : html`<span class="admin-media-badge">${f.kind === 'video' ? 'VID' : '?'}</span>`}
            </span>
            <span class="admin-media-info">
              <span class="admin-media-name">${f.name}</span>
              <span class="admin-media-size">${formatSize(f.size)}</span>
            </span>
            <form method="POST" action="${deleteAction}" class="admin-media-delete-form" onsubmit="return confirm('Delete ${f.name}?')">
              ${tokenField}
              <input type="hidden" name="filename" value="${f.name}" />
              <button type="submit" class="admin-media-delete-btn" title="Delete">Del</button>
            </form>
          </li>`)}
        </ul>`
    }
  </section>`
}
