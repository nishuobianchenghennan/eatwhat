import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { DrawResult, OverviewStats, PartyPersonDrawResult } from '@eatwhat/shared'
import { api, ApiError } from '@/lib/api'

type PersonRow = {
  id: number
  name: string
  status?: string
  submitted_by?: string | null
  created_at?: string
}

type FoodRow = PersonRow & {
  category?: string | null
  note?: string | null
}

type SelectableGroup = {
  name: string
  itemIds: number[]
}

type SpinLogRow = {
  id: number
  mode: string
  selected_person_name: string | null
  selected_food_name: string | null
  participant_names: string | null
  candidate_food_names: string | null
  created_at: string
}

type NoticeState = { type: 'success' | 'error'; text: string } | null

export function PartyPage() {
  return <DrawPage mode="party" />
}

export function QuickPage() {
  return <DrawPage mode="quick" />
}

export function PeoplePage() {
  return <PoolPage type="people" />
}

export function FoodsPage() {
  return <PoolPage type="foods" />
}

export function SubmitPersonPage() {
  return <SubmitPage type="person" />
}

export function SubmitFoodPage() {
  return <SubmitPage type="food" />
}

export function AdminLoginPage() {
  const [token, setToken] = useState('')
  const [notice, setNotice] = useState<NoticeState>(null)

  const handleLogin = async () => {
    try {
      const result = await api.post<{ token: string }>('/admin/login', { token })
      localStorage.setItem('eatwhat_admin_token', result.token)
      setNotice({ type: 'success', text: '登录成功，可进入管理后台' })
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    }
  }

  return (
    <section className="mx-auto max-w-lg rounded-3xl bg-white p-6 shadow-soft">
      <PageTitle title="管理员登录" description="输入 Cloudflare Worker 环境变量 ADMIN_TOKEN 对应的管理员口令。" />
      <div className="mt-6 space-y-4">
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          type="password"
          className="w-full rounded-2xl border border-orange-100 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="请输入管理员口令"
        />
        <button onClick={handleLogin} className="w-full rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white">
          登录
        </button>
        <Notice notice={notice} />
        <Link to="/admin" className="block text-center text-sm font-semibold text-brand-700">
          返回管理后台
        </Link>
      </div>
    </section>
  )
}

export function AdminPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [notice, setNotice] = useState<NoticeState>(null)

  useEffect(() => {
    if (!hasAdminToken()) {
      setNotice({ type: 'error', text: '请先登录管理员后台' })
      return
    }

    api
      .get<OverviewStats>('/admin/stats')
      .then(setStats)
      .catch((error) => setNotice({ type: 'error', text: getErrorMessage(error) }))
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-soft">
        <PageTitle title="管理后台" description="审核用户提交内容、查看转盘记录和维护公共池数据。" />
        <div className="mt-5 flex flex-wrap gap-3">
          <AdminLink to="/admin/login" label="管理员登录" />
          <AdminLink to="/admin/people/pending" label="人物审核" />
          <AdminLink to="/admin/foods/pending" label="美食审核" />
          <AdminLink to="/admin/logs" label="转盘记录" />
        </div>
        <Notice notice={notice} />
      </section>

      {stats && (
        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="已通过人物" value={stats.approvedPeople} />
          <StatCard label="待审人物" value={stats.pendingPeople} />
          <StatCard label="已通过美食" value={stats.approvedFoods} />
          <StatCard label="待审美食" value={stats.pendingFoods} />
          <StatCard label="今日提交" value={stats.todaySubmissions} />
          <StatCard label="今日转盘" value={stats.todayDraws} />
        </section>
      )}
    </div>
  )
}

export function AdminPendingPeoplePage() {
  return <ReviewPage type="people" />
}

export function AdminPendingFoodsPage() {
  return <ReviewPage type="foods" />
}

export function AdminLogsPage() {
  const [logs, setLogs] = useState<SpinLogRow[]>([])
  const [notice, setNotice] = useState<NoticeState>(null)

  useEffect(() => {
    api
      .get<SpinLogRow[]>('/admin/logs')
      .then(setLogs)
      .catch((error) => setNotice({ type: 'error', text: getErrorMessage(error) }))
  }, [])

  return (
    <section className="rounded-3xl bg-white p-6 shadow-soft">
      <PageTitle title="转盘记录" description="展示最近 100 条完整饭局和快速抽美食记录。" />
      <Notice notice={notice} />
      <div className="mt-5 space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="rounded-2xl border border-orange-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">{log.mode === 'party' ? '完整饭局' : '快速抽美食'}</span>
              <span className="text-xs text-slate-500">{formatTime(log.created_at)}</span>
            </div>
            <div className="mt-2 text-sm text-slate-600">
              {log.selected_person_name ? `选中人物：${log.selected_person_name}，` : ''}选中美食：{log.selected_food_name ?? '未知'}
            </div>
          </div>
        ))}
        {logs.length === 0 && <EmptyText text="暂无转盘记录" />}
      </div>
    </section>
  )
}

function DrawPage({ mode }: { mode: 'party' | 'quick' }) {
  const [people, setPeople] = useState<PersonRow[]>([])
  const [foods, setFoods] = useState<FoodRow[]>([])
  const [selectedPeople, setSelectedPeople] = useState<number[]>([])
  const [selectedFoods, setSelectedFoods] = useState<number[]>([])
  const [partyPersonResult, setPartyPersonResult] = useState<PartyPersonDrawResult | null>(null)
  const [result, setResult] = useState<DrawResult | null>(null)
  const [notice, setNotice] = useState<NoticeState>(null)
  const isParty = mode === 'party'
  const foodGroups = useMemo(() => buildFoodGroups(foods), [foods])

  useEffect(() => {
    Promise.all([api.get<PersonRow[]>('/people'), api.get<FoodRow[]>('/foods')])
      .then(([peopleData, foodData]) => {
        setPeople(peopleData)
        setFoods(foodData)
      })
      .catch((error) => setNotice({ type: 'error', text: getErrorMessage(error) }))
  }, [])

  useEffect(() => {
    if (!isParty) {
      return
    }
    setPartyPersonResult(null)
    setResult(null)
  }, [isParty, selectedPeople])

  const handlePartyPersonDraw = async () => {
    if (selectedPeople.length === 0) {
      setNotice({ type: 'error', text: '请至少选择一位参与人员' })
      return
    }

    try {
      const drawResult = await api.post<PartyPersonDrawResult>('/draw/party/person', {
        personIds: selectedPeople
      })
      setPartyPersonResult(drawResult)
      setResult(null)
      setNotice({ type: 'success', text: `已抽取本轮点餐人：${drawResult.selectedPerson.name}` })
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    }
  }

  const handleDraw = async () => {
    if (selectedFoods.length === 0) {
      setNotice({ type: 'error', text: '请至少选择一个候选美食' })
      return
    }
    if (isParty && !partyPersonResult) {
      setNotice({ type: 'error', text: '请先抽取本轮点餐人' })
      return
    }

    try {
      const drawResult = await api.post<DrawResult>(isParty ? '/draw/party' : '/draw/quick', {
        personIds: selectedPeople,
        selectedPersonId: partyPersonResult?.selectedPerson.id,
        foodIds: selectedFoods
      })
      setResult(drawResult)
      setNotice({ type: 'success', text: '抽取完成，记录已保存' })
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-soft">
        <PageTitle
          title={isParty ? '完整饭局模式' : '快速抽美食模式'}
          description={isParty ? '先抽取本轮点餐人，再从候选美食中等概率抽取最终结果。' : '跳过人物环节，直接从候选美食中等概率抽取。'}
        />
        <Notice notice={notice} />
      </section>

      <div className={`grid gap-6 ${isParty ? 'xl:grid-cols-2' : ''}`}>
        {isParty && (
          <SelectablePanel
            title="选择参与人员"
            items={people}
            selectedIds={selectedPeople}
            onChange={setSelectedPeople}
            renderMeta={() => '已审核通过'}
          />
        )}
        <SelectablePanel
          title="选择候选美食"
          items={foods}
          selectedIds={selectedFoods}
          onChange={setSelectedFoods}
          renderMeta={(item) => getFoodCategory(item)}
          groups={foodGroups}
        />
      </div>

      {isParty && partyPersonResult && (
        <motion.section initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-3xl bg-white p-6 text-center shadow-soft">
          <div className="text-sm text-slate-600">本轮点餐人</div>
          <div className="mt-2 text-3xl font-bold text-brand-700">{partyPersonResult.selectedPerson.name}</div>
          <div className="mt-2 text-xs text-slate-500">{formatTime(partyPersonResult.createdAt)}</div>
        </motion.section>
      )}

      <section className="rounded-3xl bg-white p-6 text-center shadow-soft">
        <button
          onClick={isParty && !partyPersonResult ? handlePartyPersonDraw : handleDraw}
          className="rounded-full bg-brand-500 px-8 py-3 text-sm font-semibold text-white shadow-soft"
        >
          {isParty && !partyPersonResult ? '抽取本轮点餐人' : '开始抽取美食'}
        </button>
        {result && (
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto mt-6 max-w-xl rounded-3xl bg-orange-50 p-6">
            {result.selectedPerson && <div className="text-sm text-slate-600">本轮代表：{result.selectedPerson.name}</div>}
            <div className="mt-2 text-3xl font-bold text-brand-700">{result.selectedFood.name}</div>
            <div className="mt-2 text-xs text-slate-500">{formatTime(result.createdAt)}</div>
          </motion.div>
        )}
      </section>
    </div>
  )
}

function PoolPage({ type }: { type: 'people' | 'foods' }) {
  const [items, setItems] = useState<FoodRow[]>([])
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [notice, setNotice] = useState<NoticeState>(null)
  const isFood = type === 'foods'
  const canDelete = hasAdminToken()

  const loadItems = () => {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('keyword', keyword.trim())
    if (isFood && category) params.set('category', category)

    api
      .get<FoodRow[]>(`/${type}${params.toString() ? `?${params.toString()}` : ''}`)
      .then(setItems)
      .catch((error) => setNotice({ type: 'error', text: getErrorMessage(error) }))
  }

  useEffect(loadItems, [type, keyword, category, isFood])

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category).filter(Boolean))) as string[], [items])

  const handleDelete = async (id: number) => {
    try {
      await api.post(`/admin/${type}/${id}/delete`)
      setNotice({ type: 'success', text: '删除成功' })
      loadItems()
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    }
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-soft">
      <PageTitle title={isFood ? '美食池' : '人物池'} description={isFood ? '查看已审核通过的美食，支持搜索和分类筛选。' : '查看已审核通过的人物，支持搜索。'} />
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr,180px,auto]">
        <input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="rounded-2xl border border-orange-100 px-4 py-3 outline-none focus:border-brand-500" placeholder="输入关键词搜索" />
        {isFood ? (
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-orange-100 px-4 py-3 outline-none focus:border-brand-500">
            <option value="">全部分类</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        ) : <span />}
        <Link to={isFood ? '/submit-food' : '/submit-person'} className="rounded-full bg-brand-500 px-5 py-3 text-center text-sm font-semibold text-white">
          用户提交
        </Link>
      </div>
      <Notice notice={notice} />
      <ItemGrid items={items} isFood={isFood} onDelete={canDelete ? handleDelete : undefined} />
    </section>
  )
}

function SubmitPage({ type }: { type: 'person' | 'food' }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('其他')
  const [note, setNote] = useState('')
  const [submittedBy, setSubmittedBy] = useState('')
  const [notice, setNotice] = useState<NoticeState>(null)
  const isFood = type === 'food'

  const handleSubmit = async () => {
    try {
      await api.post(`/submissions/${type}`, { name, category, note, submittedBy })
      setName('')
      setNote('')
      setSubmittedBy('')
      setNotice({ type: 'success', text: '提交成功，等待管理员审核' })
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-soft">
      <PageTitle title={isFood ? '提交美食' : '提交人物'} description="用户提交后进入待审核状态，通过管理员审核后才会进入公共池。" />
      <div className="mt-6 space-y-4">
        <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-orange-100 px-4 py-3 outline-none focus:border-brand-500" placeholder={isFood ? '美食名称' : '人物姓名'} />
        {isFood && (
          <>
            <input value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-2xl border border-orange-100 px-4 py-3 outline-none focus:border-brand-500" placeholder="分类，例如：米饭、面食、火锅" />
            <textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 w-full rounded-2xl border border-orange-100 px-4 py-3 outline-none focus:border-brand-500" placeholder="备注，可选" />
          </>
        )}
        <input value={submittedBy} onChange={(event) => setSubmittedBy(event.target.value)} className="w-full rounded-2xl border border-orange-100 px-4 py-3 outline-none focus:border-brand-500" placeholder="提交人，可选" />
        <button onClick={handleSubmit} className="w-full rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white">提交审核</button>
        <Notice notice={notice} />
      </div>
    </section>
  )
}

function ReviewPage({ type }: { type: 'people' | 'foods' }) {
  const [items, setItems] = useState<FoodRow[]>([])
  const [notice, setNotice] = useState<NoticeState>(null)
  const isFood = type === 'foods'

  const loadItems = () => {
    api
      .get<FoodRow[]>(`/admin/${type}/pending`)
      .then(setItems)
      .catch((error) => setNotice({ type: 'error', text: getErrorMessage(error) }))
  }

  useEffect(loadItems, [type])

  const handleAction = async (id: number, action: 'approve' | 'reject' | 'delete') => {
    try {
      await api.post(`/admin/${type}/${id}/${action}`)
      setNotice({ type: 'success', text: action === 'approve' ? '已通过' : action === 'reject' ? '已拒绝' : '删除成功' })
      loadItems()
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    }
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-soft">
      <PageTitle title={isFood ? '美食审核' : '人物审核'} description="审核用户提交的待处理内容。" />
      <Notice notice={notice} />
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-orange-100 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-slate-900">{item.name}</div>
              <div className="mt-1 text-xs text-slate-500">
                {isFood ? `${item.category ?? '其他'} ｜ ` : ''}提交人：{item.submitted_by ?? '匿名'}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleAction(item.id, 'approve')} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white">通过</button>
              <button onClick={() => handleAction(item.id, 'reject')} className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-slate-700">拒绝</button>
              <button onClick={() => handleAction(item.id, 'delete')} className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600">删除</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyText text="暂无待审核内容" />}
      </div>
    </section>
  )
}

function SelectablePanel({
  title,
  items,
  selectedIds,
  onChange,
  renderMeta,
  groups
}: {
  title: string
  items: FoodRow[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
  renderMeta: (item: FoodRow) => string
  groups?: SelectableGroup[]
}) {
  const toggle = (id: number) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id])
  }

  const toggleGroup = (group: SelectableGroup) => {
    const isAllSelected = group.itemIds.every((id) => selectedIds.includes(id))

    if (isAllSelected) {
      onChange(selectedIds.filter((id) => !group.itemIds.includes(id)))
      return
    }

    onChange(Array.from(new Set([...selectedIds, ...group.itemIds])))
  }

  const getGroupStatus = (group: SelectableGroup) => {
    const selectedCount = group.itemIds.filter((id) => selectedIds.includes(id)).length

    if (selectedCount === 0) return 'none'
    if (selectedCount === group.itemIds.length) return 'all'
    return 'partial'
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">已选择 {selectedIds.length} 项</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onChange(items.map((item) => item.id))} className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-brand-700">一键全选</button>
          <button onClick={() => onChange([])} className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-slate-700">清空选择</button>
        </div>
      </div>
      {groups && groups.length > 0 && (
        <div className="mt-5 rounded-2xl bg-orange-50 p-4">
          <div className="text-sm font-semibold text-slate-700">按分组快速选择</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {groups.map((group) => {
              const status = getGroupStatus(group)
              const statusClassName =
                status === 'all'
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : status === 'partial'
                    ? 'border-brand-500 bg-white text-brand-700'
                    : 'border-orange-200 bg-white text-slate-700'

              return (
                <button
                  key={group.name}
                  onClick={() => toggleGroup(group)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${statusClassName}`}
                >
                  {group.name}
                  {status === 'partial' ? '（部分）' : ''}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id)
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`rounded-2xl border p-4 text-left transition ${isSelected ? 'border-brand-500 bg-orange-50' : 'border-orange-100 bg-white hover:bg-orange-50'}`}
            >
              <div className="font-semibold text-slate-900">{item.name}</div>
              <div className="mt-1 text-xs text-slate-500">{renderMeta(item)}</div>
            </button>
          )
        })}
      </div>
      {items.length === 0 && <EmptyText text="暂无可选内容" />}
    </section>
  )
}

function ItemGrid({
  items,
  isFood,
  onDelete
}: {
  items: FoodRow[]
  isFood: boolean
  onDelete?: (id: number) => void
}) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-orange-100 p-4">
          <div className="font-semibold text-slate-900">{item.name}</div>
          {isFood && <div className="mt-1 text-xs text-brand-700">{item.category ?? '其他'}</div>}
          {item.note && <div className="mt-2 text-sm text-slate-500">{item.note}</div>}
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="mt-4 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600"
            >
              删除
            </button>
          )}
        </div>
      ))}
      {items.length === 0 && <EmptyText text="暂无数据" />}
    </div>
  )
}

function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  )
}

function Notice({ notice }: { notice: NoticeState }) {
  if (!notice) return null
  return (
    <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${notice.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      {notice.text}
    </div>
  )
}

function EmptyText({ text }: { text: string }) {
  return <div className="rounded-2xl bg-orange-50 p-5 text-center text-sm text-slate-500">{text}</div>
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold text-brand-700">{value}</div>
    </div>
  )
}

function AdminLink({ to, label }: { to: string; label: string }) {
  return <Link to={to} className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-brand-700">{label}</Link>
}

function hasAdminToken() {
  return Boolean(localStorage.getItem('eatwhat_admin_token'))
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return '请求失败'
}

function getFoodCategory(item: FoodRow) {
  return item.category?.trim() || '其他'
}

function buildFoodGroups(items: FoodRow[]): SelectableGroup[] {
  const groupMap = new Map<string, number[]>()

  items.forEach((item) => {
    const category = getFoodCategory(item)
    const groupItemIds = groupMap.get(category) ?? []
    groupItemIds.push(item.id)
    groupMap.set(category, groupItemIds)
  })

  return Array.from(groupMap.entries()).map(([name, itemIds]) => ({ name, itemIds }))
}

function formatTime(value?: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}
