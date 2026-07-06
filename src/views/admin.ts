import { html } from 'hono/html'
import type { MediaFile } from '../lib/post-storage.js'

interface PostItem {
  slug: string
  title: string
  createdAt: Date
}

export function renderAdminPage(
  posts: PostItem[],
  uploadToken?: string,
  tempMediaFiles: MediaFile[] = [],
  mediaError?: string,
) {
  return html`<section class="admin">
    <h2>Posts</h2>
    ${posts.length === 0
      ? html`<p class="admin-empty">No posts yet.</p>`
      : html`<ul class="admin-post-list">
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

    <h2>New Post</h2>
    <form method="POST" action="/admin/posts">
      ${uploadToken ? html`<input type="hidden" name="upload_token" value="${uploadToken}" />` : ''}
      <input
        type="text"
        name="title"
        placeholder="Title"
        class="admin-input"
        required
        autofocus
      />
      <textarea
        name="content"
        placeholder="Markdown content..."
        class="admin-textarea"
        rows="20"
        required
      ></textarea>
      <div class="admin-actions">
        <button type="submit" class="admin-btn">Publish</button>
        <a href="/" class="admin-link">Cancel</a>
      </div>
    </form>
    ${uploadToken ? renderMediaSection({ token: uploadToken }, tempMediaFiles, mediaError) : ''}
  </section>`
}

export function renderEditForm(
  post: { slug: string; title: string; content: string },
  mediaFiles: MediaFile[] = [],
  mediaError?: string,
) {
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
      <textarea
        name="content"
        placeholder="Markdown content..."
        class="admin-textarea"
        rows="25"
        required
      >${post.content}</textarea>
      <div class="admin-actions">
        <button type="submit" class="admin-btn">Save</button>
        <a href="/admin" class="admin-link">Cancel</a>
      </div>
    </form>
    ${renderMediaSection({ slug: post.slug }, mediaFiles, mediaError)}
  </section>`
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
