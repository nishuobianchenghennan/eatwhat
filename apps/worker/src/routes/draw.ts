import type { Env } from '../utils/auth'
import { json, fail } from '../utils/response'
import { pickRandomItem } from '../utils/random'
import { nowIso } from '../utils/validation'

export async function drawRoutes(request: Request, env: Env) {
  if (request.method !== 'POST') {
    return fail('不支持的请求方法', 405, 405)
  }

  const url = new URL(request.url)
  const payload = (await request.json().catch(() => ({}))) as {
    personIds?: number[]
    foodIds?: number[]
    selectedPersonId?: number
  }
  const createdAt = nowIso()

  if (url.pathname === '/api/draw/party/person') {
    const participants = await loadPeople(env, payload.personIds ?? [])
    if ((payload.personIds ?? []).length === 0) {
      return fail('完整饭局模式需要至少一位参与人员', 40002, 400)
    }
    if (participants.length === 0) {
      return fail('未找到有效的参与人员', 40003, 400)
    }

    const selectedPerson = pickRandomItem(participants)
    return json({
      mode: 'party',
      selectedPerson,
      participantPeople: participants,
      createdAt
    })
  }

  if (url.pathname === '/api/draw/quick') {
    const foods = await loadFoods(env, payload.foodIds ?? [])
    if (foods.length === 0) {
      return fail('候选美食不能为空', 40001, 400)
    }

    const selectedFood = pickRandomItem(foods)
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
        'quick',
        null,
        null,
        selectedFood.id,
        selectedFood.name,
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify(foods.map((item) => item.id)),
        JSON.stringify(foods.map((item) => item.name)),
        createdAt
      )
      .run()

    return json({
      mode: 'quick',
      selectedPerson: null,
      selectedFood,
      participantPeople: [],
      candidateFoods: foods,
      createdAt
    })
  }

  if (url.pathname !== '/api/draw/party') {
    return fail('接口不存在', 404, 404)
  }

  const participants = await loadPeople(env, payload.personIds ?? [])
  const foods = await loadFoods(env, payload.foodIds ?? [])

  if ((payload.personIds ?? []).length === 0) {
    return fail('完整饭局模式需要至少一位参与人员', 40002, 400)
  }
  if (participants.length === 0) {
    return fail('未找到有效的参与人员', 40003, 400)
  }
  if (participants.length !== (payload.personIds ?? []).length) {
    return fail('参与人员包含无效数据', 40004, 400)
  }
  if (!payload.selectedPersonId) {
    return fail('请先抽取本轮点餐人', 40005, 400)
  }
  if (!participants.some((item) => item.id === payload.selectedPersonId)) {
    return fail('本轮点餐人不在参与人员中', 40006, 400)
  }
  if (foods.length === 0) {
    return fail('候选美食不能为空', 40001, 400)
  }
  if (foods.length !== (payload.foodIds ?? []).length) {
    return fail('候选美食包含无效数据', 40007, 400)
  }

  const selectedPerson = participants.find((item) => item.id === payload.selectedPersonId) ?? null
  const selectedFood = pickRandomItem(foods)

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
      'party',
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
    mode: 'party',
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
