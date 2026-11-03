import { useMemo, useState } from 'react'
import { getDb } from '../../mock/db.js'

export default function SociosPage() {
  const db = getDb()
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return db.socios
    return db.socios.filter(
      (s) => s.nombre.toLowerCase().includes(t) || s.dni.includes(t) || s.codigo.toLowerCase().includes(t),
    )
  }, [db.socios, q])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Clientes / Socios</h1>
          <p className="text-sm text-slate-400">Gestiona los datos, membresías y accesos de tu comunidad.</p>
        </div>
        <button className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600">+ Nuevo socio</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { l: 'Socios registrados', v: db.socios.length },
          { l: 'Membresías activas', v: db.socios.filter((s) => s.estado !== 'vencida').length },
          { l: 'Próximos vencimientos', v: db.socios.filter((s) => s.estado === 'por_vencer').length },
          { l: 'Sin membresía vigente', v: db.socios.filter((s) => s.estado === 'vencida').length },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">{c.l}</p>
            <p className="mt-1 text-xl font-semibold text-white">{c.v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
        <div className="flex gap-3 border-b border-white/5 p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar socio por DNI o nombre"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500/40 focus:outline-none"
          />
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase text-slate-500">
              <th className="px-5 py-3">Socio</th>
              <th className="px-3 py-3">DNI</th>
              <th className="px-3 py-3">Plan activo</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Última asistencia</th>
              <th className="px-3 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const plan = db.planes.find((p) => p.id === s.planId)
              const badge = s.estado === 'activa' ? 'bg-emerald-500/15 text-emerald-400' : s.estado === 'por_vencer' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
              const label = s.estado === 'activa' ? 'Activa' : s.estado === 'por_vencer' ? 'Por vencer' : 'Vencida'
              return (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-3"><p className="font-medium text-white">{s.nombre}</p><p className="text-[11px] text-slate-500">{s.codigo}</p></td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-400">{s.dni}</td>
                  <td className="px-3 py-3 text-slate-300">{plan?.nombre}</td>
                  <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] ${badge}`}>{label}</span></td>
                  <td className="px-3 py-3 text-slate-400">{s.ultimaAsistencia}</td>
                  <td className="px-3 py-3 text-xs text-blue-400">Ver · Editar · Cobrar · Check-in</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
