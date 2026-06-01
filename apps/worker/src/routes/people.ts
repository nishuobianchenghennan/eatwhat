import type { Env } from '../utils/auth'
import { requireAdmin } from '../utils/auth'
import { json, fail } from '../utils/response'
import { assertSafeText, cleanText, getSearchParam, nowIso } from '../utils/validation'

export async function peopleRoutes(request: Request, env: Env) {
  const url = new URL(request.url)

  if (request.method === 'GET') {
    const status = getSearchParam(url, 'status') || 'approved'
    const keyword = getSearchParam(url, 'keyword')
    const sql = `SELECT * FROM people WHERE status = ? AND name LIKE ? ORDER BY created_at DESC`
    const result = await env.DB.prepare(sql).bind(status, `%${keyword}%`).all()
    return json(result.results ?? [])
  }

  if (request.method === 'POST') {
    requireAdmin(request, env)
    const body = (await request.json()) as Record<string, unknown>
    const name = cleanText(body.name)
    assertSafeText(name, '姓名', 30)
    const now = nowIso()

    await env.DB.prepare(
      `INSERT INTO people (name, status, source, created_at, updated_at, reviewed_at, reviewed_by)
       VALUES (?, 'approved', 'admin', ?, ?, ?, 'admin')`
    )
      .bind(name, now, now, now)
      .run()

    return json(null, '添加成功')
  }

  if (request.method === 'PUT') {
    requireAdmin(request, env)
    const id = Number(url.pathname.split('/').at(-1))
    const body = (await request.json()) as Record<string, unknown>
    const name = cleanText(body.name)
    assertSafeText(name, '姓名', 30)

    await env.DB.prepare(`UPDATE people SET name = ?, updated_at = ? WHERE id = ?`)
      .bind(name, nowIso(), id)
      .run()

    return json(null, '更新成功')
  }

  if (request.method === 'DELETE') {
    requireAdmin(request, env)
    const id = Number(url.pathname.split('/').at(-1))
    await env.DB.prepare(`UPDATE people SET status = 'removed', updated_at = ? WHERE id = ?`)
      .bind(nowIso(), id)
      .run()
    return json(null, '删除成功')
  }

  return fail('不支持的请求方法', 405, 405)
}
