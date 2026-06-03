import type { Context, Next } from 'hono'

const AUTH_REALM = 'Admin'

export function checkBasicAuth(c: Context): boolean {
  const auth = c.req.header('Authorization')
  if (!auth || !auth.startsWith('Basic ')) {
    return false
  }
  const decoded = atob(auth.slice(6))
  const [user, pass] = decoded.split(':')
  return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD
}

function unauthorized(c: Context): Response {
  c.header('WWW-Authenticate', `Basic realm="${AUTH_REALM}"`)
  return c.text('Unauthorized', 401)
}

export async function authGuard(c: Context, next: Next): Promise<Response | void> {
  if (!checkBasicAuth(c)) {
    return unauthorized(c)
  }
  await next()
}
