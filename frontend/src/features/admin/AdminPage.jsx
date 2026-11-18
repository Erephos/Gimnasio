import { useEffect, useState } from 'react'
import { ROLE_LABELS, ROLES } from '../../config/roles.js'
import { changeUserRole, listUsers, toggleUserActive } from '../../services/data.js'
import { useAuth } from '../auth/useAuth.js'

const ROLES_EDITABLES = [ROLES.ADMIN, ROLES.RECEPCION]

export default function AdminPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  function reload() {
    setLoading(true)
    listUsers({ size: 100 }).then((p) => { setUsers(p.content); setLoading(false) })
  }

  useEffect(reload, [])

  async function handleRol(u, rol) {
    try {
      await changeUserRole(u.id, rol)
      reload()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleToggle(u) {
    try {
      await toggleUserActive(u.id, !u.activo)
      reload()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Roles y seguridad</h1>
        <p className="text-sm text-slate-400">Usuarios del sistema y permisos de menú por rol.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(ROLE_LABELS).map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <p className="text-sm font-semibold text-white">{v}</p>
            <p className="mt-1 text-xs text-slate-500">{k}</p>
            <p className="mt-3 text-xs text-slate-400">
              {k === ROLES.ADMIN && 'Acceso total: socios, caja, roles, reportes.'}
              {k === ROLES.RECEPCION && 'Operación: socios, caja, asistencia, alertas, reportes.'}
              {k === ROLES.ENTRENADOR && 'Clases y agenda.'}
              {k === ROLES.SOCIO && 'Mi cuenta y membresía.'}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Usuarios del sistema</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase text-slate-500">
              <th className="px-5 py-3">Nombre</th>
              <th className="px-3 py-3">Correo</th>
              <th className="px-3 py-3">Rol</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-5 py-6 text-slate-500" colSpan={5}>Cargando…</td></tr>
            ) : users.map((u) => {
              const esUnoMismo = u.id === user.usuarioId
              const rolEditable = ROLES_EDITABLES.includes(u.rol) && !esUnoMismo
              return (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="px-5 py-3 text-white">{u.nombre} {u.apellido}</td>
                  <td className="px-3 py-3 text-slate-400">{u.correo}</td>
                  <td className="px-3 py-3">
                    {rolEditable ? (
                      <select
                        value={u.rol}
                        onChange={(e) => handleRol(u, e.target.value)}
                        className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                      >
                        {ROLES_EDITABLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    ) : (
                      <span className="text-xs text-slate-300">{ROLE_LABELS[u.rol]}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[11px] ${u.activo ? 'text-emerald-400' : 'text-red-400'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td className="px-3 py-3">
                    {!esUnoMismo && (
                      <button type="button" onClick={() => handleToggle(u)} className="text-xs text-slate-400 hover:text-white">
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
