import { useEffect, useState } from 'react'
import { crearMembresia, getMembresiaVigenteSocio, listPagos, listPagosPorMembresia, listPlanes, listSocios, registrarPago } from '../../services/data.js'

const hoyLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })

export default function CajaPage() {
  const [pagos, setPagos] = useState([])
  const [resumenHoy, setResumenHoy] = useState({ efectivo: 0, transferencia: 0, tarjeta: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [socios, setSocios] = useState([])
  const [planes, setPlanes] = useState([])

  const [show, setShow] = useState(false)
  const [socioId, setSocioId] = useState('')
  const [membresia, setMembresia] = useState(undefined) // undefined = sin consultar, null = no tiene
  const [saldo, setSaldo] = useState(null)
  const [nuevoPlanId, setNuevoPlanId] = useState('')
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState('EFECTIVO')
  const [error, setError] = useState('')

  async function reload() {
    setLoading(true)
    const page = await listPagos({ size: 100 })
    setPagos(page.content.slice(0, 20))
    const hoy = hoyLima()
    const deHoy = page.content.filter((p) => p.estado === 'REGISTRADO' && String(p.fechaPago).slice(0, 10) === hoy)
    const sumBy = (metodoFiltro) => deHoy.filter((p) => p.metodo === metodoFiltro).reduce((a, p) => a + Number(p.monto), 0)
    setResumenHoy({
      efectivo: sumBy('EFECTIVO'),
      transferencia: sumBy('TRANSFERENCIA'),
      tarjeta: sumBy('TARJETA'),
      total: deHoy.reduce((a, p) => a + Number(p.monto), 0),
    })
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  async function openModal() {
    setShow(true)
    setError('')
    setSocioId('')
    setMembresia(undefined)
    setMonto('')
    setMetodo('EFECTIVO')
    if (socios.length === 0) listSocios({ size: 100 }).then((p) => setSocios(p.content))
    if (planes.length === 0) listPlanes().then(setPlanes)
  }

  async function onPickSocio(id) {
    setSocioId(id)
    setError('')
    if (!id) { setMembresia(undefined); return }
    const m = await getMembresiaVigenteSocio(id)
    setMembresia(m)
    if (m) {
      const pagosM = await listPagosPorMembresia(m.id)
      const pagado = pagosM.filter((p) => p.estado === 'REGISTRADO').reduce((a, p) => a + Number(p.monto), 0)
      setSaldo(Number(m.precioPagado) - pagado)
    } else {
      setSaldo(null)
    }
  }

  async function handleNuevaMembresia(e) {
    e.preventDefault()
    setError('')
    try {
      await crearMembresia({ socioId, planId: nuevoPlanId, fechaInicio: hoyLima() })
      await onPickSocio(socioId)
      setNuevoPlanId('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handlePay(e) {
    e.preventDefault()
    setError('')
    try {
      await registrarPago({ membresiaId: membresia.id, monto, metodo })
      setShow(false)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Caja y pagos</h1>
          <p className="text-sm text-slate-400">Cobros registrados hoy.</p>
        </div>
        <button type="button" onClick={openModal} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600">
          + Registrar cobro
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">Total hoy</p>
          <p className="text-xl font-semibold text-white">S/ {resumenHoy.total.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">Efectivo</p>
          <p className="text-xl font-semibold text-white">S/ {resumenHoy.efectivo.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">Transferencias</p>
          <p className="text-xl font-semibold text-white">S/ {resumenHoy.transferencia.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">Tarjetas</p>
          <p className="text-xl font-semibold text-white">S/ {resumenHoy.tarjeta.toLocaleString()}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Últimas transacciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase text-slate-500">
                <th className="px-5 py-3">Fecha</th>
                <th className="px-3 py-3">Socio</th>
                <th className="px-3 py-3">Medio</th>
                <th className="px-3 py-3">Importe</th>
                <th className="px-3 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-5 py-6 text-slate-500" colSpan={5}>Cargando…</td></tr>
              ) : pagos.length === 0 ? (
                <tr><td className="px-5 py-6 text-slate-500" colSpan={5}>Sin cobros todavía.</td></tr>
              ) : pagos.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-5 py-3 text-slate-400">{new Date(p.fechaPago).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</td>
                  <td className="px-3 py-3 text-white">{p.socioNombre}</td>
                  <td className="px-3 py-3 text-slate-400">{p.metodo}</td>
                  <td className="px-3 py-3 text-white">S/ {Number(p.monto).toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${p.estado === 'REGISTRADO' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>{p.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-white">Registrar cobro</h2>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Socio</label>
              <select required value={socioId} onChange={(e) => onPickSocio(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                <option value="">— Elegir —</option>
                {socios.map((s) => <option key={s.id} value={s.id}>{s.nombreCompleto} ({s.dni})</option>)}
              </select>
            </div>

            {socioId && membresia === null && (
              <form onSubmit={handleNuevaMembresia} className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-xs text-amber-300">Este socio no tiene una membresía vigente. Asígnale un plan primero:</p>
                <select required value={nuevoPlanId} onChange={(e) => setNuevoPlanId(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                  <option value="">Selecciona un plan</option>
                  {planes.map((p) => <option key={p.id} value={p.id}>{p.nombre} · S/ {p.precio}</option>)}
                </select>
                <button type="submit" className="w-full rounded-lg bg-amber-500/80 py-2 text-sm font-medium text-white hover:bg-amber-500">Crear membresía</button>
              </form>
            )}

            {membresia && (
              <form onSubmit={handlePay} className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                  <p>Plan: <span className="text-white">{membresia.planNombre}</span> · Vence {membresia.fechaFin}</p>
                  <p>Saldo pendiente: <span className="text-white">S/ {saldo?.toFixed(2)}</span></p>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Medio</label>
                  <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="TARJETA">Tarjeta</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Importe</label>
                  <input type="number" min="0.01" step="0.01" required value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
                </div>
                <button type="submit" className="w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white">Cobrar</button>
              </form>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="button" onClick={() => setShow(false)} className="w-full rounded-lg border border-white/10 py-2 text-sm text-slate-300">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
