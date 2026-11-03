import { useState } from 'react'
import { getDb } from '../../mock/db.js'

export default function AsistenciaPage() {
  const [dni, setDni] = useState('')
  const [result, setResult] = useState(null)
  const db = getDb()

  function check() {
    const socio = db.socios.find((s) => s.dni === dni.trim())
    if (!socio) {
      setResult({ ok: false, msg: 'DNI no encontrado en el sistema.' })
      return
    }
    if (socio.estado === 'vencida') {
      setResult({ ok: false, msg: `Acceso rechazado. Membresía de ${socio.nombre} vencida.`, socio })
      return
    }
    setResult({ ok: true, msg: `Ingreso registrado. Bienvenido/a ${socio.nombre}.`, socio })
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold text-white">Control de asistencia</h1><p className="text-sm text-slate-400">Escanea o ingresa el DNI para registrar el acceso.</p></div>
      <div className="mx-auto max-w-md rounded-2xl border border-white/5 bg-white/[0.03] p-6">
        <label className="mb-2 block text-xs text-slate-400">DNI o código de barras</label>
        <div className="flex gap-2">
          <input value={dni} onChange={(e) => setDni(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} placeholder="38245916" className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500/40 focus:outline-none" />
          <button onClick={check} className="rounded-xl bg-blue-500 px-4 text-sm font-medium text-white hover:bg-blue-600">→</button>
        </div>
        {result && (
          <div className={`mt-4 rounded-xl p-4 ${result.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
            <p className="text-sm font-medium">{result.ok ? '✓ Acceso permitido' : '✕ Acceso rechazado'}</p>
            <p className="mt-1 text-xs opacity-80">{result.msg}</p>
          </div>
        )}
      </div>
    </div>
  )
}
