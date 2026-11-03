import { getDb } from '../../mock/db.js'

export default function DashboardPage() {
  const db = getDb()
  const activos = db.socios.filter((s) => s.estado === 'activa' || s.estado === 'por_vencer').length
  const porVencer = db.socios.filter((s) => s.estado === 'por_vencer').length
  const ingresos = db.pagos.reduce((a, p) => a + p.importe, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Resumen de recepción</h1>
          <p className="text-sm text-slate-400">Todo listo para un nuevo día de entrenamiento.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Registrar pago</button>
          <button className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600">+ Nuevo socio</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Socios activos', value: activos.toLocaleString(), sub: `de ${db.socios.length} registrados`, color: 'text-white' },
          { label: 'Ingresos del día', value: `$ ${ingresos.toLocaleString()}`, sub: `${db.pagos.length} cobros`, color: 'text-emerald-400' },
          { label: 'Asistencias de hoy', value: '42', sub: 'en el gimnasio', color: 'text-white' },
          { label: 'Membresías por vencer', value: String(porVencer), sub: 'próximos 3 días', color: 'text-amber-400' },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${c.color}`}>{c.value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Socios y asistencia</h2>
            <p className="text-xs text-slate-500">Gestiona membresías, cobros e ingresos desde un solo lugar.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">Socio</th>
                <th className="px-3 py-3 font-medium">DNI</th>
                <th className="px-3 py-3 font-medium">Plan</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-3 py-3 font-medium">Última asistencia</th>
              </tr>
            </thead>
            <tbody>
              {db.socios.slice(0, 7).map((s) => {
                const plan = db.planes.find((p) => p.id === s.planId)
                const badge =
                  s.estado === 'activa'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : s.estado === 'por_vencer'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-red-500/15 text-red-400'
                const label = s.estado === 'activa' ? 'Activa' : s.estado === 'por_vencer' ? 'Por vencer' : 'Vencida'
                return (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{s.nombre}</p>
                      <p className="text-[11px] text-slate-500">{s.codigo}</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-400">{s.dni}</td>
                    <td className="px-3 py-3 text-slate-300">{plan?.nombre ?? '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge}`}>{label}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-400">{s.ultimaAsistencia}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
