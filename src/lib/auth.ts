import type { Context, Next } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

const COOKIE_NAME = 'admin_session'

export function setAuthCookie(c: Context): void {
  setCookie(c, COOKIE_NAME, 'true', {
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
  const cookie = getCookie(c, COOKIE_NAME)
  return cookie === 'true'
}

export async function authGuard(c: Context, next: Next): Promise<Response | void> {
  if (!isAuthenticated(c)) {
    return c.redirect('/admin?error=unauthorized')
  }
  await next()
}
