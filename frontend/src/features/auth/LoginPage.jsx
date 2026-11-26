import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { homePathFor } from '../../config/roles.js'
import { recoverPassword, registerPublic, resetPassword } from '../../services/data.js'
import { useAuth } from './useAuth.js'

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login') // login | register | recover
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [genero, setGenero] = useState('MASCULINO')
  const [dni, setDni] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPass, setNewPass] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [recoverReady, setRecoverReady] = useState(false)

  if (isAuthenticated) return <Navigate to={homePathFor(user.rol)} replace />

  async function handleLogin(e) {
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

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    try {
      await registerPublic({ nombre, apellido, correo, password, dni, genero })
      setInfo('Cuenta creada. Ya puedes iniciar sesión.')
      setTab('login')
      setPassword('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRecover(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    try {
      await recoverPassword(correo)
      setInfo('Si el correo esta registrado, se enviaron instrucciones para restablecer la contraseña.')
      setRecoverReady(true)
    } catch (err) {
      setError(err.message)
      setRecoverReady(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    try {
      await resetPassword(resetToken, newPass)
      setInfo('Contraseña actualizada. Inicia sesión.')
      setTab('login')
      setRecoverReady(false)
      setNewPass('')
      setResetToken('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f1a]">
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
          <h1 className="mb-4 text-4xl font-semibold leading-tight text-white">Tu operación,<br />siempre en control.</h1>
          <p className="max-w-md text-sm leading-relaxed text-slate-400">
            Socios, membresías y caja conectados en un solo lugar.
          </p>
        </div>
        <p className="text-xs text-slate-600">© 2026 ximEdgar Gym</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {[
              { id: 'login', label: 'Iniciar sesión' },
              { id: 'register', label: 'Crear cuenta' },
              { id: 'recover', label: 'Recuperar' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTab(t.id); setError(''); setInfo('') }}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${tab === t.id ? 'bg-blue-500 text-white' : 'text-slate-400'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'login' && (
            <>
              <h2 className="mb-1 text-xl font-semibold text-white">Bienvenido a ximEdgar</h2>
              <p className="mb-6 text-sm text-slate-400">Ingresa con tu cuenta para continuar.</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Correo</label>
                  <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Contraseña</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none" />
                </div>
                {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
                {info && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{info}</p>}
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60">
                  {loading ? 'Entrando…' : 'Iniciar sesión →'}
                </button>
              </form>
            </>
          )}

          {tab === 'register' && (
            <>
              <h2 className="mb-1 text-xl font-semibold text-white">Crear cuenta de socio</h2>
              <p className="mb-6 text-sm text-slate-400">Tu cuenta queda sin plan asignado; recepción lo asigna al confirmar tu membresía.</p>
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none" />
                  <input placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none" />
                </div>
                <input placeholder="DNI (8 digitos)" value={dni} onChange={(e) => setDni(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none" />
                <select value={genero} onChange={(e) => setGenero(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none">
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                </select>
                <input type="email" placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none" />
                <input type="password" placeholder="Contraseña (mín. 8)" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none" />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button type="submit" className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600">Registrarme</button>
              </form>
            </>
          )}

          {tab === 'recover' && (
            <>
              <h2 className="mb-1 text-xl font-semibold text-white">Recuperar contraseña</h2>
              <p className="mb-6 text-sm text-slate-400">Te enviamos un enlace con un código al correo de tu cuenta.</p>
              <form onSubmit={handleRecover} className="space-y-3">
                <input type="email" placeholder="Correo de la cuenta" value={correo} onChange={(e) => setCorreo(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none" />
                <button type="submit" className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600">Enviar enlace</button>
              </form>
              {info && <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{info}</p>}
              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              {recoverReady && (
                <form onSubmit={handleReset} className="mt-4 space-y-3 border-t border-white/10 pt-4">
                  <p className="text-xs text-slate-400">¿Ya tienes el código del correo? Restablece aquí:</p>
                  <input placeholder="Código del enlace" value={resetToken} onChange={(e) => setResetToken(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none" />
                  <input type="password" placeholder="Nueva contraseña (mín. 8)" value={newPass} onChange={(e) => setNewPass(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none" />
                  <button type="submit" className="w-full rounded-xl border border-blue-500/40 py-3 text-sm font-medium text-blue-400 hover:bg-blue-500/10">Guardar nueva contraseña</button>
                </form>
              )}
            </>
          )}

          <Link
            to="/reto-sentadillas"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-center text-sm font-medium text-blue-300 hover:bg-blue-500/20"
          >
            <Dumbbell size={16} />
            ¿Nos visitas en el stand? Prueba el reto de sentadillas
          </Link>
        </div>
      </div>
    </div>
  )
}
