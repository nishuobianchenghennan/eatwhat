import type { Env } from '../utils/auth'
import { requireAdmin } from '../utils/auth'
import { json, fail } from '../utils/response'
import { assertSafeText, cleanText, getSearchParam, nowIso } from '../utils/validation'

export async function foodsRoutes(request: Request, env: Env) {
  const url = new URL(request.url)

  if (request.method === 'GET') {
    const status = getSearchParam(url, 'status') || 'approved'
    const keyword = getSearchParam(url, 'keyword')
    const category = getSearchParam(url, 'category')
    const params: string[] = [status, `%${keyword}%`]
    let sql = `SELECT * FROM foods WHERE status = ? AND name LIKE ?`

    if (category) {
      sql += ` AND category = ?`
      params.push(category)
    }

    sql += ` ORDER BY created_at DESC`
    const result = await env.DB.prepare(sql).bind(...params).all()
    return json(result.results ?? [])
  }

  if (request.method === 'POST') {
    requireAdmin(request, env)
    const body = (await request.json()) as Record<string, unknown>
    const name = cleanText(body.name)
    const category = cleanText(body.category) || '其他'
    const note = cleanText(body.note)
    assertSafeText(name, '美食名称', 40)
    assertSafeText(category, '分类', 20)
    if (note) assertSafeText(note, '备注', 80)
    const now = nowIso()

    await env.DB.prepare(
      `INSERT INTO foods (name, category, note, status, source, created_at, updated_at, reviewed_at, reviewed_by)
       VALUES (?, ?, ?, 'approved', 'admin', ?, ?, ?, 'admin')`
    )
      .bind(name, category, note || null, now, now, now)
      .run()

    return json(null, '添加成功')
  }

  if (request.method === 'PUT') {
    requireAdmin(request, env)
    const id = Number(url.pathname.split('/').at(-1))
    const body = (await request.json()) as Record<string, unknown>
    const name = cleanText(body.name)
    const category = cleanText(body.category) || '其他'
    const note = cleanText(body.note)
    assertSafeText(name, '美食名称', 40)
    assertSafeText(category, '分类', 20)
    if (note) assertSafeText(note, '备注', 80)

    await env.DB.prepare(`UPDATE foods SET name = ?, category = ?, note = ?, updated_at = ? WHERE id = ?`)
      .bind(name, category, note || null, nowIso(), id)
      .run()

    return json(null, '更新成功')
  }

  if (request.method === 'DELETE') {
    requireAdmin(request, env)
    const id = Number(url.pathname.split('/').at(-1))
    await env.DB.prepare(`UPDATE foods SET status = 'removed', updated_at = ? WHERE id = ?`)
      .bind(nowIso(), id)
      .run()
    return json(null, '删除成功')
  }

  return fail('不支持的请求方法', 405, 405)
}
