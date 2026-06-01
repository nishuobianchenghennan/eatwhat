import type { Env } from '../utils/auth'
import { json, fail } from '../utils/response'
import { pickRandomItem } from '../utils/random'
import { nowIso } from '../utils/validation'

export async function drawRoutes(request: Request, env: Env) {
  if (request.method !== 'POST') {
    return fail('不支持的请求方法', 405, 405)
  }

  const url = new URL(request.url)
  const payload = (await request.json().catch(() => ({}))) as { personIds?: number[]; foodIds?: number[] }
  const mode = url.pathname.includes('quick') ? 'quick' : 'party'
  const createdAt = nowIso()

  const foods = await loadFoods(env, payload.foodIds ?? [])
  if (foods.length === 0) {
    return fail('候选美食不能为空', 40001, 400)
  }

  if (mode === 'party' && (payload.personIds ?? []).length === 0) {
    return fail('完整饭局模式需要至少一位参与人员', 40002, 400)
  }

  const selectedFood = pickRandomItem(foods)
  const participants = mode === 'party' ? await loadPeople(env, payload.personIds ?? []) : []
  const selectedPerson = participants.length > 0 ? pickRandomItem(participants) : null

  await env.DB.prepare(
    `INSERT INTO spin_logs (
      mode,
      selected_person_id,
      selected_person_name,
      selected_food_id,
      selected_food_name,
      participant_ids,
      participant_names,
      candidate_food_ids,
      candidate_food_names,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      mode,
      selectedPerson?.id ?? null,
      selectedPerson?.name ?? null,
      selectedFood.id,
      selectedFood.name,
      JSON.stringify(participants.map((item) => item.id)),
      JSON.stringify(participants.map((item) => item.name)),
      JSON.stringify(foods.map((item) => item.id)),
      JSON.stringify(foods.map((item) => item.name)),
      createdAt
    )
    .run()

  return json({
    mode,
    selectedPerson,
    selectedFood,
    participantPeople: participants,
    candidateFoods: foods,
    createdAt
  })
}

async function loadPeople(env: Env, ids: number[]) {
  if (ids.length === 0) {
    return []
  }

  const placeholders = ids.map(() => '?').join(', ')
  const result = await env.DB.prepare(`SELECT * FROM people WHERE status = 'approved' AND id IN (${placeholders})`).bind(...ids).all()
  return (result.results ?? []) as Array<{ id: number; name: string }>
}

async function loadFoods(env: Env, ids: number[]) {
  if (ids.length === 0) {
    return []
  }

  const placeholders = ids.map(() => '?').join(', ')
  const result = await env.DB.prepare(`SELECT * FROM foods WHERE status = 'approved' AND id IN (${placeholders})`).bind(...ids).all()
  return (result.results ?? []) as Array<{ id: number; name: string }>
}
