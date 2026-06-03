# Blog Design Spec

2026-06-03

## Overview

Personal blog for Yutong Zhu. Single author, minimalist style (reference: mariozechner.at). Author writes posts locally in Markdown, pastes into a web admin panel to publish. SQLite storage via Prisma, Hono SSR for all pages, no client-side JavaScript except optional admin editor enhancement.

## Pages

| Route | Auth | Description |
|---|---|---|
| `GET /` | No | Homepage. Post list (chronological) + bio + contact. Preserve existing design exactly. |
| `GET /posts/:id` | No | Post detail. Render Markdown content to HTML, wrap in same layout as homepage. |
| `GET /api/posts` | No | JSON list of all posts (existing, unchanged). |
| `POST /api/posts` | No | JSON create post (existing, unchanged). |
| `GET /admin` | Yes | If not logged in, show login form. If logged in, show publish form. |
| `POST /admin/login` | No | Validate password, set signed cookie, redirect to `/admin`. |
| `POST /admin/posts` | Yes | Create post from form body, redirect to `/posts/:id`. |

`/public/*` static file serving unchanged.

## Code Structure

```
src/
├── index.ts          ← Entry point: create Hono app, mount routes, start server
├── routes/
│   ├── home.ts       ← GET /
│   ├── posts.ts      ← GET /posts/:id, GET /api/posts, POST /api/posts
│   └── admin.ts      ← GET /admin, POST /admin/login, POST /admin/posts
├── lib/
│   ├── prisma.ts     ← PrismaClient singleton
│   ├── markdown.ts   ← Markdown to HTML (using `marked`)
│   └── auth.ts       ← Password verification, session helpers, auth middleware
└── views/
    ├── layout.ts     ← HTML shell (<!DOCTYPE html> through </html>)
    ├── home.ts       ← Homepage template (extracted from current index.ts verbatim)
    ├── post.ts       ← Post detail template
    └── admin.ts      ← Login and publish form templates
```

## Authentication

- Password stored in `.env` as `ADMIN_PASSWORD`
- Login: `POST /admin/login` with `password` field, set Hono signed cookie on success
- Auth middleware: check cookie on protected routes (`GET /admin`, `POST /admin/posts`)
- No username, no registration, no JWT, no database table needed

## Markdown

- Library: `marked`
- Images: store in `/public/images/`, reference in Markdown as `![alt](/public/images/foo.png)`
- Links, images, code blocks, headings — all standard Markdown, handled by `marked`
- Styling: extend `public/style.css` with rules for rendered Markdown elements (code blocks, headings, paragraphs, images)

## Constraints

- No client-side JavaScript (admin forms use plain HTML `<form method="POST">`)
- All pages SSR via Hono `html` tagged templates
- Preserve existing homepage HTML and CSS exactly
- `package.json` name updated from `"backend"` to a project-appropriate name
