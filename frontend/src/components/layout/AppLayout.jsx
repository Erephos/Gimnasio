import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { NAV_ITEMS, ROLE_LABELS, homePathFor } from '../../config/roles.js'
import { useAuth } from '../../features/auth/useAuth.js'
import { ICONS } from '../ui/icons.jsx'
import { IconLogout } from '../ui/icons.jsx'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.rol))

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f1a] text-slate-200">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-white/5 bg-[#0d121f]">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-sm font-bold text-white">
            xE
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">ximEdgar Gym</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Gym Management</p>
          </div>
        </div>

        <div className="mx-3 mb-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
          <p className="text-[10px] text-slate-500">Sede</p>
          <p className="text-xs font-medium text-slate-300">Pucallpa · Ucayali</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Operación</p>
          {items.map((item) => {
            const Icon = ICONS[item.icon] || ICONS.grid
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition ${
                    isActive
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-white/5 p-3">
          <div className="mb-2 flex items-center gap-2 rounded-lg px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-400">
              {user.nombre?.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{user.nombre}</p>
              <p className="truncate text-[10px] text-slate-500">{ROLE_LABELS[user.rol]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <IconLogout className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b border-white/5 bg-[#0d121f]/80 px-6 backdrop-blur">
          <div className="relative flex-1 max-w-md">
            <input
              type="search"
              placeholder="Buscar por DNI o nombre de socio..."
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
            />
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-400">
              12 membresías vencen en 3 días
            </span>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
              ● Caja abierta
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
