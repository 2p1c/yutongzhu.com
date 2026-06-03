# Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor single-file Hono app into layered modules, add post detail pages with Markdown rendering, and add a password-protected admin panel for publishing.

**Architecture:** Hono SSR with module layering — `routes/` for HTTP handlers, `lib/` for business logic (Prisma, Markdown, auth), `views/` for HTML templates. All pages are server-rendered HTML with no client JavaScript. Existing homepage design preserved verbatim.

**Tech Stack:** Hono, Prisma + SQLite, marked, TypeScript, vitest (for lib tests)

---

### Task 1: Install new dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install marked**

```bash
npm install marked
```

- [ ] **Step 2: Verify install**

```bash
node -e "const { marked } = require('marked'); console.log('marked OK:', typeof marked.parse)"
```

Expected: `marked OK: function`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add marked for Markdown rendering"
```

---

### Task 2: Create Prisma singleton

**Files:**
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Write the module**

```typescript
import { PrismaClient } from '../generated/prisma/client'

export const prisma = new PrismaClient()
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/prisma.ts
git commit -m "feat: extract PrismaClient singleton to lib/prisma"
```

---

### Task 3: Create Markdown renderer (TDD)

**Files:**
- Create: `src/lib/markdown.ts`
- Create: `src/lib/markdown.test.ts`

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

Edit `package.json`:

```
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "test": "vitest run"
},
```

- [ ] **Step 3: Write the failing test**

```typescript
// src/lib/markdown.test.ts
import { describe, it, expect } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('converts headings', () => {
    const result = renderMarkdown('# Hello')
    expect(result).toContain('<h1')
    expect(result).toContain('Hello')
  })

  it('converts links', () => {
    const result = renderMarkdown('[example](https://example.com)')
    expect(result).toContain('<a href="https://example.com"')
    expect(result).toContain('example</a>')
  })

  it('converts images', () => {
    const result = renderMarkdown('![alt](/images/foo.png)')
    expect(result).toContain('<img')
    expect(result).toContain('alt')
    expect(result).toContain('/images/foo.png')
  })

  it('converts code blocks', () => {
    const result = renderMarkdown('```js\nconst x = 1\n```')
    expect(result).toContain('<code')
  })

  it('converts paragraphs', () => {
    const result = renderMarkdown('A paragraph.')
    expect(result).toContain('<p>')
    expect(result).toContain('A paragraph.')
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

```bash
npx vitest run src/lib/markdown.test.ts
```

Expected: FAIL — `renderMarkdown is not defined` or module not found.

- [ ] **Step 5: Write minimal implementation**

```typescript
// src/lib/markdown.ts
import { marked } from 'marked'

export function renderMarkdown(content: string): string {
  return marked.parse(content) as string
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run src/lib/markdown.test.ts
```

Expected: 5 tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/markdown.ts src/lib/markdown.test.ts package.json package-lock.json
git commit -m "feat: add Markdown to HTML renderer with tests"
```

---

### Task 4: Create auth module

**Files:**
- Create: `src/lib/auth.ts`

- [ ] **Step 1: Write the auth module**

```typescript
import type { Context, Next } from 'hono'
import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie'

const COOKIE_NAME = 'admin_session'
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'change-me-in-production'

export function setAuthCookie(c: Context): void {
  setSignedCookie(c, COOKIE_NAME, 'true', COOKIE_SECRET, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
  })
}

export function clearAuthCookie(c: Context): void {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
}

export function isAuthenticated(c: Context): boolean {
  const cookie = getSignedCookie(c, COOKIE_SECRET, COOKIE_NAME)
  return cookie === 'true'
}

export async function authGuard(c: Context, next: Next): Promise<Response | void> {
  if (!isAuthenticated(c)) {
    return c.redirect('/admin?error=unauthorized')
  }
  await next()
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add auth module with signed cookie session and guard middleware"
```

---

### Task 5: Create layout view (HTML shell)

**Files:**
- Create: `src/views/layout.ts`

- [ ] **Step 1: Write the layout**

```typescript
import { html } from 'hono/html'

interface LayoutProps {
  title: string
  content: string
}

export function renderLayout(props: LayoutProps): string {
  return html`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title}</title>
  <link rel="stylesheet" href="/public/style.css">
</head>
<body>
  <header>
    <h1><a href="/" style="color: inherit; text-decoration: none;">{ Yutong Zhu }</a></h1>
    <p class="subtitle">developer • student • robot</p>
  </header>
  ${props.content}
</body>
</html>`
}
```

Note: The header is lifted from the existing `src/index.ts` lines 29-32. The `${props.content}` placeholder receives the page body HTML from each view function. Using `hono/html`'s `html` tagged template, nested HtmlEscapedString values are automatically handled (not double-escaped).

- [ ] **Step 2: Commit**

```bash
git add src/views/layout.ts
git commit -m "feat: add layout view with shared HTML shell and header"
```

---

### Task 6: Extract homepage view from existing index.ts

**Files:**
- Create: `src/views/home.ts`
- Read: `src/index.ts:13-67` (the existing `GET /` handler)

- [ ] **Step 1: Extract the homepage body into a view function**

Copy the three `<section>` blocks (Musings, bio, Get in touch) from the existing index.ts handler, extract them into a function that receives posts and returns just the body HTML.

```typescript
// src/views/home.ts
import { html } from 'hono/html'
import type { PostModel } from '../generated/prisma/models/Post'

export function renderHomeBody(posts: PostModel[]): string {
  return html`<section>
    <h2>Musings</h2>
    <ul class="post-list">
    ${
        posts.length === 0
        ? html`<li style="color: #888; font-style: italic;">暂时还没有写随笔...</li>`
        : posts.map(post => {
            const dateStr = new Date(post.createdAt).toISOString().split('T')[0]
            return html`
                <li class="post-item">
                <span class="post-date">${dateStr}</span>
                <a class="post-title-link" href="/posts/${post.id}">${post.title}</a>
                </li>
            `
            })
    }
    </ul>
  </section>

  <section class="bio">
    <h2>Who I am</h2>
    <p>Hono + SQLite + CSS ，no Cookie。</p>
  </section>

  <section>
    <h2>Get in touch</h2>
    <p style="color: #444;">Email: <a href="mailto:akidforseven@gmail.com" class="post-title-link">akidforseven@gmail.com</a></p>
  </section>`
}
```

This is a verbatim extraction from `src/index.ts` lines 34-62. No logic changes — the `posts.map(...)` loop, empty state message, date formatting, link targets, and section structure are all identical.

- [ ] **Step 2: Commit**

```bash
git add src/views/home.ts
git commit -m "feat: extract homepage body to views/home"
```

---

### Task 7: Create post detail view

**Files:**
- Create: `src/views/post.ts`

- [ ] **Step 1: Write the post detail view**

```typescript
// src/views/post.ts
import { html, raw } from 'hono/html'

interface PostViewProps {
  title: string
  contentHtml: string
  createdAt: Date
}

export function renderPostBody(props: PostViewProps): string {
  const dateStr = new Date(props.createdAt).toISOString().split('T')[0]
  return html`<article class="post">
    <h2 class="post-title">${props.title}</h2>
    <time datetime="${dateStr}" class="post-date">${dateStr}</time>
    <div class="post-content">${raw(props.contentHtml)}</div>
    <p class="back-link"><a class="post-title-link" href="/">← Back</a></p>
  </article>`
}
```

Important: `raw()` from `hono/html` is used to inject the Markdown-rendered HTML without escaping. Without `raw()`, the `<p>`, `<code>`, `<img>` etc. tags in the Markdown output would appear as literal text instead of rendered HTML.

- [ ] **Step 2: Commit**

```bash
git add src/views/post.ts
git commit -m "feat: add post detail view with Markdown content rendering"
```

---

### Task 8: Create admin views (login + publish form)

**Files:**
- Create: `src/views/admin.ts`

- [ ] **Step 1: Write the admin views**

```typescript
// src/views/admin.ts
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
```

Two pure functions returning HtmlEscapedString. The login form takes an optional `error` string — `undefined` means first visit (no error), a string means wrong password. Form actions POST to `/admin/login` and `/admin/posts` respectively. No client JavaScript — plain `<form method="POST">`.

- [ ] **Step 2: Commit**

```bash
git add src/views/admin.ts
git commit -m "feat: add admin login and publish form views"
```

---

### Task 9: Create home route

**Files:**
- Create: `src/routes/home.ts`

- [ ] **Step 1: Write the home route**

```typescript
// src/routes/home.ts
import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { renderLayout } from '../views/layout'
import { renderHomeBody } from '../views/home'

const home = new Hono()

home.get('/', async (c) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return c.html(renderLayout({
    title: '{yutongzhu}',
    content: renderHomeBody(posts)
  }))
})

export default home
```

The behavior is identical to the existing `GET /` handler in `src/index.ts:13-67` — query all posts in descending order, render with the homepage body, wrap in the shared layout.

- [ ] **Step 2: Commit**

```bash
git add src/routes/home.ts
git commit -m "feat: add home route with extracted view"
```

---

### Task 10: Create posts route

**Files:**
- Create: `src/routes/posts.ts`

- [ ] **Step 1: Write the posts route**

```typescript
// src/routes/posts.ts
import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { renderMarkdown } from '../lib/markdown'
import { renderLayout } from '../views/layout'
import { renderPostBody } from '../views/post'

const posts = new Hono()

posts.get('/posts/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) {
    return c.notFound()
  }
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) {
    return c.notFound()
  }
  const contentHtml = renderMarkdown(post.content)
  return c.html(renderLayout({
    title: post.title,
    content: renderPostBody({
      title: post.title,
      contentHtml,
      createdAt: post.createdAt
    })
  }))
})

posts.get('/api/posts', async (c) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return c.json(posts)
})

posts.post('/api/posts', async (c) => {
  const body = await c.req.json()
  const newPost = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content
    }
  })
  return c.json(newPost, 201)
})

export default posts
```

The `GET /api/posts` and `POST /api/posts` handlers are preserved verbatim from the existing `src/index.ts:69-85`. The new `GET /posts/:id` handler does: parse ID → not found check for NaN and missing rows → Markdown to HTML → render with layout.

- [ ] **Step 2: Commit**

```bash
git add src/routes/posts.ts
git commit -m "feat: add posts route with detail page and API endpoints"
```

---

### Task 11: Create admin route

**Files:**
- Create: `src/routes/admin.ts`

- [ ] **Step 1: Write the admin route**

```typescript
// src/routes/admin.ts
import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { setAuthCookie, isAuthenticated, authGuard } from '../lib/auth'
import { renderLayout } from '../views/layout'
import { renderLoginForm, renderPublishForm } from '../views/admin'

const admin = new Hono()

admin.get('/admin', async (c) => {
  if (isAuthenticated(c)) {
    return c.html(renderLayout({
      title: 'New Post — Admin',
      content: renderPublishForm()
    }))
  }
  const error = c.req.query('error')
  const message = error === 'unauthorized'
    ? 'Please log in first.'
    : error === 'wrong_password'
      ? 'Incorrect password.'
      : undefined
  return c.html(renderLayout({
    title: 'Login — Admin',
    content: renderLoginForm(message)
  }))
})

admin.post('/admin/login', async (c) => {
  const body = await c.req.parseBody()
  const password = body.password as string
  if (password === process.env.ADMIN_PASSWORD) {
    setAuthCookie(c)
    return c.redirect('/admin')
  }
  return c.redirect('/admin?error=wrong_password')
})

admin.post('/admin/posts', authGuard, async (c) => {
  const body = await c.req.parseBody()
  const title = body.title as string
  const content = body.content as string
  const post = await prisma.post.create({
    data: { title, content }
  })
  return c.redirect(`/posts/${post.id}`)
})

export default admin
```

Auth flow:
1. `GET /admin` — inline check (no middleware so we can show login form). Authenticated → publish form. Not authenticated → login form, with optional error message from query string.
2. `POST /admin/login` — validate against `ADMIN_PASSWORD` env var. Success → set signed cookie, redirect to `/admin`. Failure → redirect with `?error=wrong_password`.
3. `POST /admin/posts` — `authGuard` middleware protects this. Create post → redirect to the new post detail page.

- [ ] **Step 2: Commit**

```bash
git add src/routes/admin.ts
git commit -m "feat: add admin routes with password auth and post publishing"
```

---

### Task 12: Refactor index.ts to entry point

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Replace index.ts**

```typescript
import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import home from './routes/home'
import posts from './routes/posts'
import admin from './routes/admin'

const app = new Hono()

app.use('/public/*', serveStatic({ root: './' }))

app.route('/', home)
app.route('/', posts)
app.route('/', admin)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
```

Changes from original:
- Removed unused `cors` import (was never called as middleware)
- Removed inline `GET /`, `GET /api/posts`, `POST /api/posts` handlers (now in route modules)
- Removed inline `PrismaClient` instantiation (now in lib/prisma.ts)
- Removed `hono/html` import (now used only in views)
- Replaced with `app.route()` calls to the three route modules
- Static file serving unchanged

- [ ] **Step 2: Verify the app starts and homepage works**

```bash
npm run dev
```

Open `http://localhost:3000` — the homepage should render identically to before the refactor. All existing post links, bio, and contact sections should be present and styled correctly.

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "refactor: slim down index.ts to entry point, delegate to route modules"
```

---

### Task 13: Add styles for Markdown content and admin forms

**Files:**
- Modify: `public/style.css`

- [ ] **Step 1: Append styles to style.css**

Add these rules to the end of `public/style.css`:

```css
/* ── Post detail ── */
.post {
  margin-top: 0;
}

.post-title {
  margin-bottom: 4px;
}

.post-content {
  margin-top: 24px;
}

.post-content h1,
.post-content h2,
.post-content h3 {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  margin-top: 32px;
  margin-bottom: 12px;
}

.post-content h2 {
  font-size: 1.2rem;
}

.post-content p {
  margin-bottom: 16px;
}

.post-content img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 24px 0;
}

.post-content a {
  color: #0066cc;
  text-decoration: none;
}

.post-content a:hover {
  text-decoration: underline;
}

.post-content pre {
  background: #f5f5f5;
  padding: 16px;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 16px 0;
}

.post-content code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875em;
}

.post-content pre code {
  font-size: 0.875rem;
}

.post-content blockquote {
  border-left: 3px solid #ddd;
  margin: 16px 0;
  padding-left: 16px;
  color: #555;
}

.post-content ul,
.post-content ol {
  margin: 16px 0;
  padding-left: 24px;
}

.post-content li {
  margin-bottom: 8px;
}

.back-link {
  margin-top: 40px;
}

/* ── Admin forms ── */
.admin {
  margin-top: 20px;
}

.admin h2 {
  margin-top: 20px;
}

.admin-error {
  color: #cc0000;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.admin-input {
  display: block;
  width: 100%;
  padding: 8px 12px;
  font-size: 0.95rem;
  border: 1px solid #ccc;
  margin-bottom: 12px;
  font-family: inherit;
  box-sizing: border-box;
}

.admin-textarea {
  display: block;
  width: 100%;
  padding: 12px;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
}

.admin-btn {
  padding: 8px 24px;
  font-size: 0.95rem;
  cursor: pointer;
  background: #1a1a1a;
  color: #fff;
  border: none;
  font-family: inherit;
}

.admin-btn:hover {
  background: #333;
}

.admin-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
}

.admin-link {
  color: #888;
  text-decoration: none;
  font-size: 0.9rem;
}

.admin-link:hover {
  text-decoration: underline;
}
```

- [ ] **Step 2: Verify styling**

Start the server, visit `/posts/1` (assuming a post exists) — Markdown-rendered content should be readable with proper spacing. Visit `/admin` — login form should be clean and centered. Publish a test post with `# heading`, `[link](url)`, `![img](url)`, `code` — all should render correctly.

- [ ] **Step 3: Commit**

```bash
git add public/style.css
git commit -m "style: add Markdown content and admin form styles"
```

---

### Task 14: Final cleanup — package.json and .env

**Files:**
- Modify: `package.json`
- Create/Modify: `.env`

- [ ] **Step 1: Rename package.json**

Change `"name"` from `"backend"` to `"yutongzhu.com"`:

```
"name": "yutongzhu.com",
```

- [ ] **Step 2: Add environment variables to .env**

If `.env` doesn't exist, create it. If it exists, add the missing keys:

```
ADMIN_PASSWORD=change-me
COOKIE_SECRET=a-random-string-change-in-production
```

Note: `DATABASE_URL` should already be present from the Prisma setup. Only add the two new variables.

- [ ] **Step 3: Verify .gitignore covers .env**

```bash
cat .gitignore | grep .env
```

Expected: `.env` is listed. If not, add it.

- [ ] **Step 4: Final integration test**

```bash
npm run dev
```

Manual verification checklist:
1. `http://localhost:3000` — homepage renders, post links point to `/posts/:id`
2. `http://localhost:3000/posts/1` — post detail renders Markdown correctly
3. `http://localhost:3000/api/posts` — JSON array returned
4. `http://localhost:3000/admin` — login form appears
5. Enter wrong password — redirected with error message
6. Enter correct password (`ADMIN_PASSWORD` value) — publish form appears
7. Fill title + Markdown content, click Publish — redirected to new post page
8. New post appears on homepage

- [ ] **Step 5: Commit**

```bash
git add package.json .env .gitignore
git commit -m "chore: rename package, add auth env vars, ensure .env is gitignored"
```
