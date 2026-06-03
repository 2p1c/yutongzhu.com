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
