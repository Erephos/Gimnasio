import { useMemo, useState } from 'react'
import { getStats, listPagos, listSocios } from '../../services/data.js'

export default function ReportesPage() {
  const [tick] = useState(0)
  const stats = useMemo(() => getStats(), [tick])
  const pagos = useMemo(() => listPagos().slice(0, 10), [tick])
  const porPlan = useMemo(() => {
    const socios = listSocios()
    const map = {}
    socios.forEach((s) => {
      const k = s.planId || 0
      map[k] = (map[k] || 0) + 1
    })
    return map
  }, [tick])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Reportes y auditoría</h1>
        <p className="text-sm text-slate-400">Indicadores calculados con los datos locales actuales.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: 'Ingresos registrados', v: `$ ${stats.ingresos.toLocaleString()}` },
          { l: 'Cobros', v: stats.cobros },
          { l: 'Socios activos', v: stats.sociosActivos },
          { l: 'Por vencer / vencidos', v: `${stats.porVencer} / ${stats.vencidos}` },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <p className="text-xs text-slate-500">{c.l}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{c.v}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Socios por plan (id)</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            {Object.entries(porPlan).map(([id, n]) => (
              <li key={id} className="flex justify-between border-b border-white/5 py-1">
                <span>Plan #{id}</span>
                <span className="text-white">{n}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Últimos cobros</h2>
          <ul className="space-y-2 text-sm">
            {pagos.map((p) => (
              <li key={p.id} className="flex justify-between border-b border-white/5 py-1 text-slate-300">
                <span>{p.socio} · {p.concepto}</span>
                <span className="text-emerald-400">$ {p.importe.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
