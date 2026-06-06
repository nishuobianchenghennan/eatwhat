import type { PublicOverviewStats } from '@eatwhat/shared'
import type { Env } from '../utils/auth'
import { fail, json } from '../utils/response'

/**
 * 公开统计接口
 *
 * 只返回首页需要展示的公开汇总数据，不包含待审核数量或管理信息。
 */
export async function statsRoutes(request: Request, env: Env) {
  const url = new URL(request.url)

  if (url.pathname !== '/api/stats/overview') {
    return fail('接口不存在', 404, 404)
  }

  if (request.method !== 'GET') {
    return fail('不支持的请求方法', 405, 405)
  }

  const [approvedPeople, approvedFoods, todayDraws] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS count FROM people WHERE status = 'approved'`).first<{ count: number }>(),
    env.DB.prepare(`SELECT COUNT(*) AS count FROM foods WHERE status = 'approved'`).first<{ count: number }>(),
    env.DB.prepare(`SELECT COUNT(*) AS count FROM spin_logs WHERE DATE(created_at) = DATE('now')`).first<{ count: number }>()
  ])

  const stats: PublicOverviewStats = {
    approvedPeople: approvedPeople?.count ?? 0,
    approvedFoods: approvedFoods?.count ?? 0,
    todayDraws: todayDraws?.count ?? 0
  }

  return json(stats)
}
