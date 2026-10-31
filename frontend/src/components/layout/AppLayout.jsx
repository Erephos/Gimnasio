import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { NAV_ITEMS, ROLE_LABELS, homePathFor } from '../../config/roles.js'
import { useAuth } from '../../features/auth/useAuth.js'
import BrandMark from '../ui/BrandMark.jsx'

function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.rol))

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link
              to={homePathFor(user.rol)}
              className="flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
            >
              <BrandMark />
              <div>
                <p className="text-sm font-semibold tracking-tight text-white">ximEdgar Gym</p>
                <p className="text-xs text-slate-400">{ROLE_LABELS[user.rol]}</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-400 sm:inline">{user.nombre}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
              >
                Cerrar sesión
              </button>
            </div>
          </div>

          <nav aria-label="Navegación principal" className="flex flex-wrap items-center gap-2">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 text-slate-300 hover:border-white/20 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
