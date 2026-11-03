import { ROLE_LABELS, ROLES } from '../../config/roles.js'
export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold text-white">Roles y seguridad</h1><p className="text-sm text-slate-400">Configuración RBAC (solo administrador).</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(ROLE_LABELS).map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <p className="text-sm font-semibold text-white">{v}</p>
            <p className="mt-1 text-xs text-slate-500">Código: {k}</p>
            <p className="mt-3 text-xs text-slate-400">
              {k === ROLES.ADMIN && 'Acceso total: socios, caja, roles, auditoría, reportes.'}
              {k === ROLES.RECEPCION && 'Operación diaria: socios, caja, asistencia, alertas.'}
              {k === ROLES.ENTRENADOR && 'Clases, agenda y seguimiento de alumnos.'}
              {k === ROLES.SOCIO && 'Mi cuenta, membresía y reservas propias.'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
