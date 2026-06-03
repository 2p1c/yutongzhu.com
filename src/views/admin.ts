import { html } from 'hono/html'

export function renderPublishForm() {
  return html`<section class="admin">
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
        rows="30"
        required
      ></textarea>
      <div class="admin-actions">
        <button type="submit" class="admin-btn">Publish</button>
        <a href="/" class="admin-link">Cancel</a>
      </div>
    </form>
  </section>`
}
