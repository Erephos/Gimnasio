import { useEffect, useState } from 'react'
import { getResumen, listAuditoria, listPagos } from '../../services/data.js'
import { ROLES } from '../../config/roles.js'
import { useAuth } from '../auth/useAuth.js'

export default function ReportesPage() {
  const { user } = useAuth()
  const [resumen, setResumen] = useState(null)
  const [pagos, setPagos] = useState([])
  const [auditoria, setAuditoria] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const calls = [getResumen(), listPagos({ size: 10 })]
    if (user.rol === ROLES.ADMIN) calls.push(listAuditoria({ size: 10 }))
    Promise.all(calls).then(([resumenData, pagosPage, auditoriaPage]) => {
      if (cancelled) return
      setResumen(resumenData)
      setPagos(pagosPage.content)
      if (auditoriaPage) setAuditoria(auditoriaPage.content)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [user.rol])

  if (loading) return <p className="text-sm text-slate-500">Cargando…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Reportes y auditoría</h1>
        <p className="text-sm text-slate-400">Indicadores del mes en curso.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: 'Ingresos registrados', v: `S/ ${Number(resumen.ingresosRegistrados).toLocaleString()}` },
          { l: 'Cobros', v: resumen.pagosRegistrados },
          { l: 'Membresías vigentes', v: resumen.membresiasVigentes },
          { l: 'Membresías vencidas', v: resumen.membresiasVencidas },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <p className="text-xs text-slate-500">{c.l}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{c.v}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Últimos cobros</h2>
          <ul className="space-y-2 text-sm">
            {pagos.length === 0 && <li className="text-slate-500">Sin cobros todavía.</li>}
            {pagos.map((p) => (
              <li key={p.id} className="flex justify-between border-b border-white/5 py-1 text-slate-300">
                <span>{p.socioNombre} · {p.metodo}</span>
                <span className="text-emerald-400">S/ {Number(p.monto).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Auditoría reciente</h2>
          {auditoria === null ? (
            <p className="text-sm text-slate-500">Solo visible para administradores.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {auditoria.length === 0 && <li className="text-slate-500">Sin registros todavía.</li>}
              {auditoria.map((a) => (
                <li key={a.id} className="border-b border-white/5 py-1 text-slate-300">
                  <p>{a.accion} · {a.entidad}</p>
                  <p className="text-[11px] text-slate-500">{a.usuarioCorreo || 'sistema'} · {a.detalle}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
