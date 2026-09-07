import { html } from 'hono/html'
import type { MediaFile, PostSection } from '../lib/post-storage.js'

function sectionOption(value: PostSection, label: string, selected: PostSection) {
  if (value === selected) {
    return html`<option value="${value}" selected>${label}</option>`
  }
  return html`<option value="${value}">${label}</option>`
}

function renderSectionSelect(selected: PostSection = 'musings') {
  return html`<select name="section" class="admin-input" required>
    ${sectionOption('musings', 'Musings', selected)}
    ${sectionOption('reflections', 'Reflections', selected)}
    ${sectionOption('notes', 'Notes', selected)}
  </select>`
}

function renderSourceFields(source?: { url?: string; title?: string }) {
  return html`<div class="admin-source-fields" hidden>
    <input
      type="url"
      name="sourceUrl"
      placeholder="Source article URL"
      class="admin-input"
      value="${source?.url ?? ''}"
    />
    <input
      type="text"
      name="sourceTitle"
      placeholder="Source article title"
      class="admin-input"
      value="${source?.title ?? ''}"
    />
  </div>`
}

function sourceFieldsScript() {
  return html`<script>
    (function () {
      const section = document.querySelector('select[name="section"]')
      const box = document.querySelector('.admin-source-fields')
      if (!section || !box) return
      const url = box.querySelector('input[name="sourceUrl"]')
      const title = box.querySelector('input[name="sourceTitle"]')
      function sync() {
        const show = section.value === 'reflections' || section.value === 'notes'
        const required = section.value === 'reflections'
        box.hidden = !show
        if (url) url.required = required
        if (title) title.required = required
      }
      section.addEventListener('change', sync)
      sync()
    })()
  </script>`
}

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
      ${renderSectionSelect()}
      ${renderSourceFields()}
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
      <img id="cover-preview" class="admin-cover-preview" alt="" hidden />
      <p class="admin-media-hint">Cover image is optional. Click to choose, or paste from clipboard (PNG, JPG, GIF, WebP, SVG)</p>
      <div class="admin-actions">
        <button type="submit" class="admin-btn">Create</button>
        <a href="/" class="admin-link">Cancel</a>
      </div>
    </form>
    ${sourceFieldsScript()}
    <script>
      (function () {
        const input = document.querySelector('input[name="cover"]')
        const preview = document.getElementById('cover-preview')
        if (!input || !preview) return

        function showPreview(file) {
          if (preview.src && preview.src.startsWith('blob:')) URL.revokeObjectURL(preview.src)
          if (file && file.type.indexOf('image/') === 0) {
            preview.src = URL.createObjectURL(file)
            preview.hidden = false
          } else {
            preview.removeAttribute('src')
            preview.hidden = true
          }
        }

        function setCover(file) {
          const dt = new DataTransfer()
          dt.items.add(file)
          input.files = dt.files
          showPreview(file)
        }

        document.addEventListener('paste', function (e) {
          const items = e.clipboardData && e.clipboardData.items
          if (!items) return
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image/') !== 0) continue
            const file = items[i].getAsFile()
            if (!file) continue
            e.preventDefault()
            setCover(file)
            break
          }
        })

        input.addEventListener('change', function () {
          showPreview(input.files && input.files[0])
        })
      })()
    </script>
  </section>`
}

export function renderEditForm(
  post: {
    slug: string
    title: string
    content: string
    createdAt: Date
    section: PostSection
    sourceUrl?: string
    sourceTitle?: string
  },
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
      ${renderSectionSelect(post.section)}
      ${renderSourceFields({ url: post.sourceUrl, title: post.sourceTitle })}
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
    ${sourceFieldsScript()}
    ${renderMediaSection({ slug: post.slug }, mediaFiles, mediaError)}
    <script>
      (function () {
        const form = document.querySelector('form[action^="/admin/edit/"]')
        if (!form) return
        const slug = new URL(form.action).pathname.split('/').pop()
        const KEY = 'draft:post:' + slug
        const title = form.elements.title
        const date = form.elements.date
        const section = form.elements.section
        const sourceUrl = form.elements.sourceUrl
        const sourceTitle = form.elements.sourceTitle
        const content = form.elements.content
        let timer

        function persist() {
          localStorage.setItem(KEY, JSON.stringify({
            title: title.value,
            date: date.value,
            section: section.value,
            sourceUrl: sourceUrl && sourceUrl.value,
            sourceTitle: sourceTitle && sourceTitle.value,
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
            if (draft.section) section.value = draft.section
            if (sourceUrl && draft.sourceUrl) sourceUrl.value = draft.sourceUrl
            if (sourceTitle && draft.sourceTitle) sourceTitle.value = draft.sourceTitle
            section.dispatchEvent(new Event('change'))
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
      <p class="admin-media-hint">PNG, JPG, GIF, WebP, SVG, MP4, WebM, MOV &mdash; max 50 MB. Paste an image into the article to upload and insert it.</p>
    </form>
    <script>
      (function () {
        const form = document.querySelector('.admin-media-upload')
        const textarea = document.querySelector('.admin-textarea')
        if (!form || !textarea) return

        const EXT = {
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp',
          'image/svg+xml': '.svg',
        }

        function namedFile(file, i) {
          const ext = EXT[file.type] || '.png'
          return new File([file], 'paste-' + Date.now() + '-' + i + ext, { type: file.type })
        }

        function insertAtCursor(snippet) {
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const before = textarea.value.slice(0, start)
          const after = textarea.value.slice(end)
          const lead = before && !before.endsWith('\\n') ? '\\n\\n' : (before.endsWith('\\n') && !before.endsWith('\\n\\n') ? '\\n' : '')
          const trail = after && !after.startsWith('\\n') ? '\\n\\n' : (after.startsWith('\\n') && !after.startsWith('\\n\\n') ? '\\n' : '')
          const text = lead + snippet + trail
          textarea.value = before + text + after
          const pos = (before + lead + snippet).length
          textarea.selectionStart = textarea.selectionEnd = pos
          textarea.focus()
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
        }

        document.addEventListener('paste', function (e) {
          const items = e.clipboardData && e.clipboardData.items
          if (!items) return
          const files = []
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image/') !== 0) continue
            const file = items[i].getAsFile()
            if (file) files.push(file)
          }
          if (files.length === 0) return
          e.preventDefault()

          files.forEach(function (raw, i) {
            const file = namedFile(raw, i)
            const fd = new FormData()
            fd.append('media', file)
            const token = form.querySelector('input[name="token"]')
            if (token) fd.append('token', token.value)
            fetch(form.action, { method: 'POST', body: fd }).then(function (res) {
              if (!res.ok || res.url.indexOf('error=') !== -1) return
              insertAtCursor('<div align="center">\\n\\n![图片描述](./media/' + file.name + ')\\n\\n</div>')
            })
          })
        })
      })()
    </script>

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
