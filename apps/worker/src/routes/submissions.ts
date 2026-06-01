import type { Env } from '../utils/auth'
import { json, fail } from '../utils/response'
import { assertSafeText, cleanText, nowIso } from '../utils/validation'

export async function submissionRoutes(request: Request, env: Env) {
  if (request.method !== 'POST') {
    return fail('不支持的请求方法', 405, 405)
  }

  const url = new URL(request.url)
  const body = (await request.json()) as Record<string, unknown>
  const type = url.pathname.includes('food') ? 'food' : 'person'
  const now = nowIso()

  if (type === 'person') {
    const name = cleanText(body.name)
    assertSafeText(name, '姓名', 30)

    const exists = await env.DB.prepare(`SELECT id FROM people WHERE name = ?`).bind(name).first()
    if (exists) {
      return fail('该人物已存在', 10001, 400)
    }

    await env.DB.prepare(
      `INSERT INTO people (name, status, source, submitted_by, created_at, updated_at)
       VALUES (?, 'pending', 'user', ?, ?, ?)`
    )
      .bind(name, cleanText(body.submittedBy) || null, now, now)
      .run()

    return json(null, '提交成功')
  }

  const name = cleanText(body.name)
  const category = cleanText(body.category) || '其他'
  const note = cleanText(body.note)
  assertSafeText(name, '美食名称', 40)
  assertSafeText(category, '分类', 20)
  if (note) assertSafeText(note, '备注', 80)

  const exists = await env.DB.prepare(`SELECT id FROM foods WHERE name = ? AND COALESCE(category, '') = ?`)
    .bind(name, category)
    .first()
  if (exists) {
    return fail('该美食已存在', 10002, 400)
  }

  await env.DB.prepare(
    `INSERT INTO foods (name, category, note, status, source, submitted_by, created_at, updated_at)
     VALUES (?, ?, ?, 'pending', 'user', ?, ?, ?)`
  )
    .bind(name, category, note || null, cleanText(body.submittedBy) || null, now, now)
    .run()

  return json(null, '提交成功')
}
