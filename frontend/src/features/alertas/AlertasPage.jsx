import { getDb } from '../../mock/db.js'
export default function AlertasPage() {
  const { alertas } = getDb()
  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold text-white">Alertas y vencimientos</h1><p className="text-sm text-slate-400">Seguimiento de membresías por vencer o vencidas.</p></div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-white/5 text-[11px] uppercase text-slate-500"><th className="px-5 py-3">Socio</th><th className="px-3 py-3">Plan</th><th className="px-3 py-3">Vence</th><th className="px-3 py-3">Días</th></tr></thead>
          <tbody>
            {alertas.map((a) => (
              <tr key={a.id} className="border-b border-white/5">
                <td className="px-5 py-3 text-white">{a.socio}</td>
                <td className="px-3 py-3 text-slate-300">{a.plan}</td>
                <td className="px-3 py-3 text-slate-400">{a.vence}</td>
                <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] ${a.dias < 0 ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>{a.dias < 0 ? `Vencida hace ${Math.abs(a.dias)}d` : `${a.dias} días`}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
