import { useMemo, useState } from 'react'
import { getCaja, listPagos, listSocios, registerPago } from '../../services/data.js'

export default function CajaPage() {
  const [tick, setTick] = useState(0)
  const refresh = () => setTick((t) => t + 1)
  const pagos = useMemo(() => listPagos(), [tick])
  const socios = useMemo(() => listSocios(), [tick])
  const caja = useMemo(() => getCaja(), [tick])
  const total = pagos.reduce((a, p) => a + p.importe, 0)

  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ socioId: '', concepto: 'Membresía', medio: 'Efectivo', importe: '' })
  const [error, setError] = useState('')

  function handlePay(e) {
    e.preventDefault()
    setError('')
    try {
      registerPago(form)
      setShow(false)
      setForm({ socioId: '', concepto: 'Membresía', medio: 'Efectivo', importe: '' })
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Caja y pagos</h1>
          <p className="text-sm text-slate-400">Turno · {caja.responsable}. Los cobros se guardan en local.</p>
        </div>
        <button type="button" onClick={() => setShow(true)} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600">
          + Registrar cobro
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">Ingresos (lista)</p>
          <p className="text-xl font-semibold text-white">$ {total.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">Efectivo</p>
          <p className="text-xl font-semibold text-white">$ {(caja.ingresosEfectivo || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">Transferencias</p>
          <p className="text-xl font-semibold text-white">$ {(caja.transferencias || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">Tarjetas</p>
          <p className="text-xl font-semibold text-white">$ {(caja.tarjetas || 0).toLocaleString()}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Transacciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase text-slate-500">
                <th className="px-5 py-3">Hora / Comp.</th>
                <th className="px-3 py-3">Socio</th>
                <th className="px-3 py-3">Concepto</th>
                <th className="px-3 py-3">Medio</th>
                <th className="px-3 py-3">Importe</th>
                <th className="px-3 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-5 py-3 text-slate-400">{p.hora} · {p.comprobante}</td>
                  <td className="px-3 py-3 text-white">{p.socio}</td>
                  <td className="px-3 py-3 text-slate-300">{p.concepto}</td>
                  <td className="px-3 py-3 text-slate-400">{p.medio}</td>
                  <td className="px-3 py-3 text-white">$ {p.importe.toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-400">{p.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={handlePay} className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-white">Registrar cobro</h2>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Socio</label>
              <select
                required
                value={form.socioId}
                onChange={(e) => setForm((f) => ({ ...f, socioId: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">— Elegir —</option>
                {socios.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre} ({s.dni})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Concepto</label>
              <input
                value={form.concepto}
                onChange={(e) => setForm((f) => ({ ...f, concepto: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Medio</label>
              <select
                value={form.medio}
                onChange={(e) => setForm((f) => ({ ...f, medio: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Tarjeta</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Importe</label>
              <input
                type="number"
                min="1"
                required
                value={form.importe}
                onChange={(e) => setForm((f) => ({ ...f, importe: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShow(false)} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-slate-300">Cancelar</button>
              <button type="submit" className="flex-1 rounded-lg bg-blue-500 py-2 text-sm font-medium text-white">Cobrar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
