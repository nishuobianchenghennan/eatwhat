import { json, fail, preflight } from './utils/response'
import type { Env } from './utils/auth'
import { peopleRoutes } from './routes/people'
import { foodsRoutes } from './routes/foods'
import { submissionRoutes } from './routes/submissions'
import { adminRoutes } from './routes/admin'
import { drawRoutes } from './routes/draw'
import { statsRoutes } from './routes/stats'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return preflight()
    }

    if (url.pathname === '/api/health') {
      return json({ ok: true, timestamp: new Date().toISOString() })
    }

    try {
      if (url.pathname.startsWith('/api/people')) {
        return peopleRoutes(request, env)
      }

      if (url.pathname.startsWith('/api/foods')) {
        return foodsRoutes(request, env)
      }

      if (url.pathname.startsWith('/api/submissions')) {
        return submissionRoutes(request, env)
      }

      if (url.pathname.startsWith('/api/admin')) {
        return adminRoutes(request, env)
      }

      if (url.pathname.startsWith('/api/stats')) {
        return statsRoutes(request, env)
      }

      if (url.pathname.startsWith('/api/draw')) {
        return drawRoutes(request, env)
      }

      return fail('接口不存在', 404, 404)
    } catch (error) {
      const message = error instanceof Error ? error.message : '服务器异常'
      return fail(message, 50001, 400)
    }
  }
}
