import { useMemo, useState } from 'react'
import { ROLE_LABELS, ROLES } from '../../config/roles.js'
import { changeUserRole, listUsers, resetAllData, toggleUserActive } from '../../services/data.js'

export default function AdminPage() {
  const [tick, setTick] = useState(0)
  const users = useMemo(() => listUsers(), [tick])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Roles y seguridad</h1>
          <p className="text-sm text-slate-400">Usuarios locales y permisos de menú por rol.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm('¿Resetear todos los datos demo?')) {
              resetAllData()
              setTick((t) => t + 1)
              alert('Datos restaurados. Recarga si hace falta.')
            }
          }}
          className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400"
        >
          Resetear demo
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(ROLE_LABELS).map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <p className="text-sm font-semibold text-white">{v}</p>
            <p className="mt-1 text-xs text-slate-500">{k}</p>
            <p className="mt-3 text-xs text-slate-400">
              {k === ROLES.ADMIN && 'Acceso total: socios, caja, roles, reportes, reset.'}
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
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="px-5 py-3 text-white">{u.nombre}</td>
                <td className="px-3 py-3 text-slate-400">{u.correo}</td>
                <td className="px-3 py-3">
                  <select
                    value={u.rol}
                    disabled={u.rol === ROLES.ADMIN && u.correo === 'admin@ximedgar.com'}
                    onChange={(e) => {
                      try {
                        changeUserRole(u.id, e.target.value)
                        setTick((t) => t + 1)
                      } catch (err) {
                        alert(err.message)
                      }
                    }}
                    className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                  >
                    {Object.values(ROLES).map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3">
                  <span className={`text-[11px] ${u.activo ? 'text-emerald-400' : 'text-red-400'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span>
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        toggleUserActive(u.id)
                        setTick((t) => t + 1)
                      } catch (err) {
                        alert(err.message)
                      }
                    }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
