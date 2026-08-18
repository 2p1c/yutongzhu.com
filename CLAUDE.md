# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server with hot reload on port 3000
npm run build        # Static site generation (renders all posts to public/)
npm run start        # Production static server (serves public/ on port 3000)
npm test             # Run Vitest tests once
./new-post.sh "Title" "slug"  # Scaffold a new post directory
```

There is no lint or format script. TypeScript strict mode is enforced at build/dev time by `tsx`.

## Architecture

This is **yutongzhu.com** — a single-author blog with server-side rendering and file-based storage. Client-side JavaScript is limited to a single tiny inline script for the light/dark theme toggle. Admin forms use plain HTML `<form method="POST">`.

### Two modes

| Mode | Entry | Purpose |
|------|-------|---------|
| Dev | `src/index.ts` | Hono app with routes for homepage, posts, API, and admin. Static middleware serves CSS, images, and post media from disk. |
| Production | `src/build.ts` → `src/serve.ts` | `build.ts` pre-renders all HTML to `public/`, copying media alongside. `serve.ts` serves `public/` as static files with a trailing-slash redirect for `/posts/:slug`. |

### Route structure

- **`src/routes/home.ts`** — `GET /` renders post list + bio + contact
- **`src/routes/posts.ts`** — `GET /posts/:slug` (single post), `GET /api/posts` (list all), `POST /api/posts` (create/update with basic auth)
- **`src/routes/admin.ts`** — `GET /admin` (dashboard), `POST /admin/posts`, media upload/delete

### View composition

Views live in `src/views/` and are TypeScript functions returning Hono `html` tagged template literals. `layout.ts` wraps every page: `renderLayout(title)` returns the HTML shell, and page bodies are passed as children.

### File-based storage (no database)

Posts are directories under `src/posts/<date>-<slug>/` containing:
- `meta.json` — `{ title, titleEn, date, description, published }`
- `index.md` — Markdown body (Chinese, the default language)
- `index_en.md` — optional English translation
- `media/` — images and videos referenced in the post

`index_en.md` / `titleEn` are auto-generated on publish/save by `src/lib/model.ts`, which translates `index.md` via an OpenAI-compatible endpoint configured with `TRANSLATE_BASE_URL` / `TRANSLATE_API_KEY` / `TRANSLATE_MODEL` in `.env`.

`src/lib/post-storage.ts` provides the full CRUD API. There is a temp-upload workflow for media attached to unpublished posts: files land under `/tmp/` using upload tokens, then migrate to the post directory on publish.

### Auth

HTTP Basic Auth via `src/lib/auth.ts`. Credentials from `.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD`). The `authGuard` middleware is applied to admin and write API routes. Media upload requires auth.

## Post format

Slug is derived from the post title (lowercase, non-alphanumeric → hyphens). Post directory names use the pattern `<YYYY-MM-DD>-<slug>`. The `new-post.sh` script enforces this convention.

## Deployment

GitHub Actions deploys on push to `main`: SSH into VPS → `git pull` → `npm install` → `npm run build` → `systemctl restart yutongzhu`. The process is defined in `.github/workflows/deploy.yml`.

## Tests

Tests use Vitest. Currently only `src/lib/markdown.test.ts` exists — it tests the custom image renderer (captions, centering via `?center` query param).
