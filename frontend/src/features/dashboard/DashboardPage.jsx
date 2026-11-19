import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAlertas, getMembresiaVigenteSocio, getResumen, listClases, listEntrenadores, listSocios } from '../../services/data.js'

export default function DashboardPage() {
  const [resumen, setResumen] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [clasesCount, setClasesCount] = useState(0)
  const [entrenadoresCount, setEntrenadoresCount] = useState(0)
  const [sociosTotal, setSociosTotal] = useState(0)
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([getResumen(), getAlertas(7), listClases(), listEntrenadores(), listSocios({ size: 8 })])
      .then(async ([resumenData, alertasData, clases, entrenadores, sociosPage]) => {
        if (cancelled) return
        setResumen(resumenData)
        setAlertas(alertasData)
        setClasesCount(clases.length)
        setEntrenadoresCount(entrenadores.length)
        setSociosTotal(sociosPage.totalElements)
        const conMembresia = await Promise.all(
          sociosPage.content.map(async (s) => ({ ...s, membresia: await getMembresiaVigenteSocio(s.id) })),
        )
        if (!cancelled) {
          setSocios(conMembresia)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  const porVencer = alertas.filter((a) => a.estado === 'POR_VENCER').length
  const vencidas = alertas.filter((a) => a.estado === 'VENCIDA').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Resumen de recepción</h1>
          <p className="text-sm text-slate-400">Datos en vivo del mes en curso.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/caja" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Registrar pago</Link>
          <Link to="/socios" className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600">+ Nuevo socio</Link>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Membresías vigentes', value: resumen.membresiasVigentes, sub: `de ${sociosTotal} socios registrados`, color: 'text-white' },
              { label: 'Ingresos del mes', value: `S/ ${Number(resumen.ingresosRegistrados).toLocaleString()}`, sub: `${resumen.pagosRegistrados} cobros`, color: 'text-emerald-400' },
              { label: 'Clases / entrenadores', value: `${clasesCount} / ${entrenadoresCount}`, sub: 'agenda actual', color: 'text-white' },
              { label: 'Membresías por vencer', value: String(porVencer), sub: `${vencidas} vencidas`, color: 'text-amber-400' },
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
            <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[11px] uppercase text-slate-500">
                  <th className="px-5 py-3">Socio</th>
                  <th className="px-3 py-3">DNI</th>
                  <th className="px-3 py-3">Plan</th>
                  <th className="px-3 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {socios.map((s) => {
                  const vigente = s.membresia?.vigente
                  const badge = vigente ? 'bg-emerald-500/15 text-emerald-400' : s.membresia ? 'bg-red-500/15 text-red-400' : 'bg-white/10 text-slate-400'
                  const label = vigente ? 'Vigente' : s.membresia ? 'Vencida' : 'Sin membresía'
                  return (
                    <tr key={s.id} className="border-b border-white/5">
                      <td className="px-5 py-3 font-medium text-white">{s.nombreCompleto}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-400">{s.dni}</td>
                      <td className="px-3 py-3 text-slate-300">{s.membresia?.planNombre || '—'}</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] ${badge}`}>{label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
