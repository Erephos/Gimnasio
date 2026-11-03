import { getDb } from '../../mock/db.js'
export default function CajaPage() {
  const db = getDb()
  const total = db.pagos.reduce((a, p) => a + p.importe, 0)
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div><h1 className="text-xl font-semibold text-white">Caja y pagos</h1><p className="text-sm text-slate-400">Turno mañana · Caja de {db.caja.responsable}</p></div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">Cerrar caja</button>
          <button className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white">+ Registrar cobro</button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"><p className="text-xs text-slate-500">Ingresos del día</p><p className="text-xl font-semibold text-white">$ {total.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"><p className="text-xs text-slate-500">Efectivo</p><p className="text-xl font-semibold text-white">$ {db.caja.ingresosEfectivo.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"><p className="text-xs text-slate-500">Transferencias</p><p className="text-xl font-semibold text-white">$ {db.caja.transferencias.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"><p className="text-xs text-slate-500">Tarjetas</p><p className="text-xl font-semibold text-white">$ {db.caja.tarjetas.toLocaleString()}</p></div>
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
        <div className="border-b border-white/5 px-5 py-4"><h2 className="text-sm font-semibold text-white">Transacciones del turno</h2></div>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-white/5 text-[11px] uppercase text-slate-500"><th className="px-5 py-3">Hora / Comp.</th><th className="px-3 py-3">Socio</th><th className="px-3 py-3">Concepto</th><th className="px-3 py-3">Medio</th><th className="px-3 py-3">Importe</th><th className="px-3 py-3">Estado</th></tr></thead>
          <tbody>
            {db.pagos.map((p) => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="px-5 py-3 text-slate-400">{p.hora} · {p.comprobante}</td>
                <td className="px-3 py-3 text-white">{p.socio}</td>
                <td className="px-3 py-3 text-slate-300">{p.concepto}</td>
                <td className="px-3 py-3 text-slate-400">{p.medio}</td>
                <td className="px-3 py-3 text-white">$ {p.importe.toLocaleString()}</td>
                <td className="px-3 py-3"><span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-400">{p.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
