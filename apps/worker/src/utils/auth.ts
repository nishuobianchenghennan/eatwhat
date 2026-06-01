export interface Env {
  DB: D1Database
  ADMIN_TOKEN: string
}

export function requireAdmin(request: Request, env: Env) {
  const authorization = request.headers.get('Authorization') ?? ''
  const token = authorization.replace(/^Bearer\s+/i, '').trim()

  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    throw new Error('未授权访问')
  }
}
