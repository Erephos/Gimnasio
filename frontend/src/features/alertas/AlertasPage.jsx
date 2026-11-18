import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAlertas } from '../../services/data.js'

export default function AlertasPage() {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAlertas(7)
      .then(setAlertas)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Alertas y vencimientos</h1>
        <p className="text-sm text-slate-400">Membresías vencidas o por vencer en los próximos 7 días.</p>
      </div>
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
      <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Cargando…</p>
        ) : alertas.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No hay alertas pendientes.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase text-slate-500">
                <th className="px-5 py-3">Socio</th>
                <th className="px-3 py-3">Plan</th>
                <th className="px-3 py-3">Vence</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {alertas.map((a) => (
                <tr key={a.membresiaId} className="border-b border-white/5">
                  <td className="px-5 py-3 text-white">{a.socioNombre} <span className="text-slate-500">({a.dni})</span></td>
                  <td className="px-3 py-3 text-slate-300">{a.plan}</td>
                  <td className="px-3 py-3 text-slate-300">{a.fechaFin}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${a.estado === 'VENCIDA' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {a.estado === 'VENCIDA' ? 'Vencida' : `Por vencer (${a.diasRestantes}d)`}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Link to="/caja" className="text-xs text-blue-400 hover:underline">Renovar en caja →</Link>
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
