import type { Env } from '../utils/auth'
import { requireAdmin } from '../utils/auth'
import { json, fail } from '../utils/response'
import { assertSafeText, cleanText, nowIso } from '../utils/validation'

export async function adminRoutes(request: Request, env: Env) {
  const url = new URL(request.url)

  if (url.pathname === '/api/admin/login' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const token = cleanText(body.token)
    if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
      return fail('管理员口令错误', 401, 401)
    }
    return json({ token: env.ADMIN_TOKEN })
  }

  requireAdmin(request, env)

  if (url.pathname === '/api/admin/stats' && request.method === 'GET') {
    const [approvedPeople, pendingPeople, approvedFoods, pendingFoods, todayPeopleSubmissions, todayFoodSubmissions, todayDraws] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) AS count FROM people WHERE status = 'approved'`).first<{ count: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS count FROM people WHERE status = 'pending'`).first<{ count: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS count FROM foods WHERE status = 'approved'`).first<{ count: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS count FROM foods WHERE status = 'pending'`).first<{ count: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS count FROM people WHERE source = 'user' AND DATE(created_at) = DATE('now')`).first<{ count: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS count FROM foods WHERE source = 'user' AND DATE(created_at) = DATE('now')`).first<{ count: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS count FROM spin_logs WHERE DATE(created_at) = DATE('now')`).first<{ count: number }>()
    ])

    return json({
      approvedPeople: approvedPeople?.count ?? 0,
      pendingPeople: pendingPeople?.count ?? 0,
      approvedFoods: approvedFoods?.count ?? 0,
      pendingFoods: pendingFoods?.count ?? 0,
      todaySubmissions: (todayPeopleSubmissions?.count ?? 0) + (todayFoodSubmissions?.count ?? 0),
      todayDraws: todayDraws?.count ?? 0
    })
  }

  if (url.pathname === '/api/admin/people/pending' && request.method === 'GET') {
    const result = await env.DB.prepare(`SELECT * FROM people WHERE status = 'pending' ORDER BY created_at DESC`).all()
    return json(result.results ?? [])
  }

  if (url.pathname === '/api/admin/foods/pending' && request.method === 'GET') {
    const result = await env.DB.prepare(`SELECT * FROM foods WHERE status = 'pending' ORDER BY created_at DESC`).all()
    return json(result.results ?? [])
  }

  if (url.pathname === '/api/admin/logs' && request.method === 'GET') {
    const result = await env.DB.prepare(`SELECT * FROM spin_logs ORDER BY created_at DESC LIMIT 100`).all()
    return json(result.results ?? [])
  }

  if (url.pathname.match(/^\/api\/admin\/(people|foods)\/\d+\/(approve|reject)$/) && request.method === 'POST') {
    const [, resource, rawId, action] = url.pathname.match(/^\/api\/admin\/(people|foods)\/(\d+)\/(approve|reject)$/) ?? []
    const tableName = resource === 'people' ? 'people' : 'foods'
    const id = Number(rawId)
    const status = action === 'approve' ? 'approved' : 'rejected'
    const now = nowIso()

    await env.DB.prepare(`UPDATE ${tableName} SET status = ?, updated_at = ?, reviewed_at = ?, reviewed_by = 'admin' WHERE id = ?`)
      .bind(status, now, now, id)
      .run()

    return json(null, action === 'approve' ? '审核通过' : '已拒绝')
  }

  if (url.pathname === '/api/admin/people/approve-edited' && request.method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>
    const id = Number(body.id)
    const name = cleanText(body.name)
    assertSafeText(name, '姓名', 30)
    const now = nowIso()
    await env.DB.prepare(`UPDATE people SET name = ?, status = 'approved', updated_at = ?, reviewed_at = ?, reviewed_by = 'admin' WHERE id = ?`)
      .bind(name, now, now, id)
      .run()
    return json(null, '编辑后通过')
  }

  if (url.pathname === '/api/admin/foods/approve-edited' && request.method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>
    const id = Number(body.id)
    const name = cleanText(body.name)
    const category = cleanText(body.category) || '其他'
    const note = cleanText(body.note)
    assertSafeText(name, '美食名称', 40)
    assertSafeText(category, '分类', 20)
    if (note) assertSafeText(note, '备注', 80)
    const now = nowIso()
    await env.DB.prepare(`UPDATE foods SET name = ?, category = ?, note = ?, status = 'approved', updated_at = ?, reviewed_at = ?, reviewed_by = 'admin' WHERE id = ?`)
      .bind(name, category, note || null, now, now, id)
      .run()
    return json(null, '编辑后通过')
  }

  return fail('接口不存在', 404, 404)
}
