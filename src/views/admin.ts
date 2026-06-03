import { html } from 'hono/html'

interface PostItem {
  slug: string
  title: string
  createdAt: Date
}

export function renderAdminPage(posts: PostItem[]) {
  return html`<section class="admin">
    <h2>Posts</h2>
    ${posts.length === 0
      ? html`<p class="admin-empty">No posts yet.</p>`
      : html`<ul class="admin-post-list">
          ${posts.map(p => {
            const dateStr = new Date(p.createdAt).toISOString().split('T')[0]
            return html`<li class="admin-post-item">
              <span class="admin-post-date">${dateStr}</span>
              <a class="admin-post-title" href="/posts/${p.slug}">${p.title}</a>
              <a class="admin-post-edit" href="/admin/edit/${p.slug}">Edit</a>
            </li>`
          })}
        </ul>`
    }

    <h2>New Post</h2>
    <form method="POST" action="/admin/posts">
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
  </section>`
}

export function renderEditForm(post: { slug: string; title: string; content: string }) {
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
  </section>`
}
