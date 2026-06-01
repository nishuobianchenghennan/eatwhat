import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: '首页' },
  { to: '/party', label: '完整饭局' },
  { to: '/quick', label: '快速抽' },
  { to: '/foods', label: '美食池' },
  { to: '/people', label: '人物池' },
  { to: '/admin', label: '后台' }
]

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <header className="sticky top-0 z-20 border-b border-orange-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500 text-xl font-bold text-white shadow-soft">
              食
            </span>
            <div>
              <div className="text-base font-bold text-slate-900">实验室吃啥转盘</div>
              <div className="text-xs text-slate-500">今天实验室吃什么</div>
            </div>
          </NavLink>
          <nav className="hidden items-center gap-2 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-orange-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:py-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-orange-100 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-6 gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-xl px-1 py-2 text-center text-xs font-medium ${
                  isActive ? 'bg-brand-500 text-white' : 'text-slate-600'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
