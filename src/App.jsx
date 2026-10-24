import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import Login from './page/login.jsx'
import Memberships from './page/memberships.jsx'
import Ingresos from './pages/ingresos/index.jsx'
import Horarios from './pages/horarios/index.jsx'
import BrandMark from './components/BrandMark.jsx'

const NAV_ITEMS = [
  { to: '/memberships', label: 'Socios y membresías' },
  { to: '/ingresos', label: 'Control de ingresos' },
  { to: '/horarios', label: 'Horarios y clases' },
]

function AppHeader() {
  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link
          to="/memberships"
          className="flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
        >
          <BrandMark />
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">
              ximEdgar Gym
            </p>
            <p className="text-xs text-slate-400">
              Recepción y administración
            </p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300 ring-1 ring-sky-500/30 sm:inline">
            Recepción
          </span>
          <nav
            aria-label="Navegación principal"
            className="flex flex-wrap items-center gap-2"
          >
            {NAV_ITEMS.map((item) => (
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
            <Link
              to="/login"
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
            >
              Volver al login
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

function App() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {pathname !== '/login' && <AppHeader />}

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/memberships" element={<Memberships />} />
        <Route path="/ingresos" element={<Ingresos />} />
        <Route path="/horarios" element={<Horarios />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

export default App
