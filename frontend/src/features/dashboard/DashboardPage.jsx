import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStats, listSocios } from '../../services/data.js'
import { getDb } from '../../mock/db.js'

export default function DashboardPage() {
  const [tick] = useState(0)
  const stats = useMemo(() => getStats(), [tick])
  const socios = useMemo(() => listSocios().slice(0, 8), [tick])
  const db = useMemo(() => getDb(), [tick])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Resumen de recepción</h1>
          <p className="text-sm text-slate-400">Datos en vivo desde el almacenamiento local.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/caja" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Registrar pago</Link>
          <Link to="/socios" className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600">+ Nuevo socio</Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Socios activos', value: stats.sociosActivos, sub: `de ${stats.sociosTotal} registrados`, color: 'text-white' },
          { label: 'Ingresos registrados', value: `$ ${stats.ingresos.toLocaleString()}`, sub: `${stats.cobros} cobros`, color: 'text-emerald-400' },
          { label: 'Clases / entrenadores', value: `${stats.clases} / ${stats.entrenadores}`, sub: 'agenda local', color: 'text-white' },
          { label: 'Membresías por vencer', value: String(stats.porVencer), sub: `${stats.vencidos} vencidas`, color: 'text-amber-400' },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${c.color}`}>{c.value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{c.sub}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Socios recientes</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase text-slate-500">
              <th className="px-5 py-3">Socio</th>
              <th className="px-3 py-3">DNI</th>
              <th className="px-3 py-3">Plan</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Última asistencia</th>
            </tr>
          </thead>
          <tbody>
            {socios.map((s) => {
              const plan = db.planes.find((p) => p.id === s.planId)
              const badge = s.estado === 'activa' ? 'bg-emerald-500/15 text-emerald-400' : s.estado === 'por_vencer' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
              const label = s.estado === 'activa' ? 'Activa' : s.estado === 'por_vencer' ? 'Por vencer' : 'Vencida'
              return (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="px-5 py-3"><p className="font-medium text-white">{s.nombre}</p><p className="text-[11px] text-slate-500">{s.codigo}</p></td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-400">{s.dni}</td>
                  <td className="px-3 py-3 text-slate-300">{plan?.nombre}</td>
                  <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] ${badge}`}>{label}</span></td>
                  <td className="px-3 py-3 text-slate-400">{s.ultimaAsistencia}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
