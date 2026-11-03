import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { homePathFor } from '../../config/roles.js'
import { useAuth } from './useAuth.js'

const DEMOS = [
  { label: 'Admin', correo: 'admin@ximedgar.com', password: 'Admin2026!' },
  { label: 'Recepción', correo: 'recepcion@ximedgar.com', password: 'Recepcion2026!' },
  { label: 'Entrenador', correo: 'entrenador@ximedgar.com', password: 'Entrenador2026!' },
  { label: 'Socio', correo: 'sofia@email.com', password: 'Socio2026!' },
]

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to={homePathFor(user.rol)} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login({ correo, password })
      navigate(homePathFor(data.rol), { replace: true })
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(d) {
    setCorreo(d.correo)
    setPassword(d.password)
    setError('')
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f1a]">
      {/* Left panel */}
      <div className="hidden w-1/2 flex-col justify-between border-r border-white/5 p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-sm font-bold text-white">xE</div>
          <div>
            <p className="text-base font-semibold text-white">ximEdgar Gym</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Gym Management</p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">— Consola de administración</p>
          <h1 className="mb-4 text-4xl font-semibold leading-tight text-white">
            Tu operación,<br />siempre en control.
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-slate-400">
            Socios, membresías y caja conectados en un solo lugar. Más claridad para tu equipo, cada día.
          </p>
          <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-300">Resumen de recepción</p>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>En vivo</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-2xl font-semibold text-white">1.248</p><p className="text-[11px] text-slate-500">Socios activos</p></div>
              <div><p className="text-2xl font-semibold text-white">186</p><p className="text-[11px] text-slate-500">Asistencias de hoy</p></div>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-600">© 2026 ximEdgar Gym · Sistema en línea</p>
      </div>

      {/* Right form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            <button type="button" className="flex-1 rounded-lg bg-blue-500 py-2 text-sm font-medium text-white">Iniciar sesión</button>
            <button type="button" className="flex-1 rounded-lg py-2 text-sm text-slate-400">Crear cuenta</button>
          </div>
          <h2 className="mb-1 text-xl font-semibold text-white">Bienvenido a ximEdgar</h2>
          <p className="mb-6 text-sm text-slate-400">Ingresa con tu cuenta para continuar a la consola.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Correo electrónico</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
            >
              {loading ? 'Entrando…' : 'Iniciar sesión →'}
            </button>
          </form>

          <div className="mt-8">
            <p className="mb-3 text-center text-[11px] uppercase tracking-wider text-slate-600">Cuentas demo</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMOS.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => fillDemo(d)}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:border-blue-500/40 hover:text-blue-400"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
