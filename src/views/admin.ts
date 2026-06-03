import { html } from 'hono/html'

export function renderLoginForm(error?: string): string {
  return html`<section class="admin">
    <h2>Login</h2>
    ${error ? html`<p class="admin-error">${error}</p>` : ''}
    <form method="POST" action="/admin/login">
      <input
        type="password"
        name="password"
        placeholder="Password"
        class="admin-input"
        autofocus
      />
      <button type="submit" class="admin-btn">Login</button>
    </form>
  </section>`
}

export function renderPublishForm(): string {
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
