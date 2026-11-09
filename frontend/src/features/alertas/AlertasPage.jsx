import { useMemo, useState } from 'react'
import { getAlertas, updateSocio } from '../../services/data.js'

export default function AlertasPage() {
  const [tick, setTick] = useState(0)
  const alertas = useMemo(() => getAlertas(), [tick])

  function marcarActiva(id) {
    updateSocio(id, { estado: 'activa' })
    setTick((t) => t + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Alertas y vencimientos</h1>
        <p className="text-sm text-slate-400">Generadas desde el estado real de los socios en local.</p>
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
        {alertas.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No hay alertas pendientes.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase text-slate-500">
                <th className="px-5 py-3">Socio</th>
                <th className="px-3 py-3">Plan</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {alertas.map((a) => (
                <tr key={a.id} className="border-b border-white/5">
                  <td className="px-5 py-3 text-white">{a.socio} <span className="text-slate-500">({a.codigo})</span></td>
                  <td className="px-3 py-3 text-slate-300">{a.plan}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${a.estado === 'vencida' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {a.estado === 'vencida' ? 'Vencida' : 'Por vencer'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => marcarActiva(a.id)} className="text-xs text-blue-400 hover:underline">Marcar renovada</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
