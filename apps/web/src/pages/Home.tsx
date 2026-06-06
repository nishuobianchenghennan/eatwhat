import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { OverviewStats } from '@eatwhat/shared'
import { api } from '@/lib/api'

type PublicOverviewStats = Pick<OverviewStats, 'approvedPeople' | 'approvedFoods' | 'todayDraws'>

export function HomePage() {
  const [stats, setStats] = useState<PublicOverviewStats | null>(null)
  const [statsError, setStatsError] = useState(false)

  useEffect(() => {
    api
      .get<PublicOverviewStats>('/stats/overview')
      .then((data) => {
        setStats(data)
        setStatsError(false)
      })
      .catch(() => setStatsError(true))
  }, [])

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-3xl bg-white p-6 shadow-soft md:grid-cols-[1.4fr,1fr] md:p-8">
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-brand-700">
            实验室饭点决策工具
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            今天实验室吃什么
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            支持人物池、美食池、审核管理、完整饭局模式和快速抽美食模式，
            帮助大家更快做出公平决策。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/party" className="rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-soft">
              开始完整饭局
            </Link>
            <Link to="/quick" className="rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              快速抽美食
            </Link>
          </div>
        </div>
        <div className="grid gap-3 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-500 p-5 text-white">
          <Stat label="人物池" value={formatStatValue(stats?.approvedPeople)} />
          <Stat label="美食池" value={formatStatValue(stats?.approvedFoods)} />
          <Stat label="今日转盘" value={formatStatValue(stats?.todayDraws)} />
          {statsError && <div className="text-xs text-white/80">统计数据暂时加载失败</div>}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="完整饭局" description="先选人，再选美食，完成双转盘流程" to="/party" />
        <Card title="快速抽美食" description="不需要人物，直接从美食池开始" to="/quick" />
        <Card title="美食池" description="查看和筛选已审核通过的美食" to="/foods" />
        <Card title="人物池" description="查看和筛选已审核通过的人物" to="/people" />
      </section>
    </div>
  )
}

function formatStatValue(value: number | undefined) {
  return value === undefined ? '--' : String(value)
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-4">
      <div className="text-sm text-white/80">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  )
}

function Card({ title, description, to }: { title: string; description: string; to: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
        <Link to={to} className="inline-flex rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-brand-700">
          进入页面
        </Link>
      </div>
    </motion.div>
  )
}
