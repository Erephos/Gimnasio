import { useState } from 'react'
import { checkIn } from '../../services/data.js'

export default function AsistenciaPage() {
  const [dni, setDni] = useState('')
  const [result, setResult] = useState(null)

  function handleCheck() {
    const r = checkIn(dni)
    setResult(r)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Control de asistencia</h1>
        <p className="text-sm text-slate-400">Escanea o ingresa el DNI. Si es válido, se actualiza la última asistencia en local.</p>
      </div>
      <div className="mx-auto max-w-md rounded-2xl border border-white/5 bg-white/[0.03] p-6">
        <label className="mb-2 block text-xs text-slate-400">DNI o código</label>
        <div className="flex gap-2">
          <input
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            placeholder="38245916"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500/40 focus:outline-none"
          />
          <button type="button" onClick={handleCheck} className="rounded-xl bg-blue-500 px-4 text-sm font-medium text-white hover:bg-blue-600">
            →
          </button>
        </div>
        {result && (
          <div className={`mt-4 rounded-xl p-4 ${result.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
            <p className="text-sm font-medium">{result.ok ? '✓ Acceso permitido' : '✕ Acceso rechazado'}</p>
            <p className="mt-1 text-xs opacity-80">{result.msg}</p>
          </div>
        )}
        <p className="mt-4 text-[11px] text-slate-500">Prueba con DNI seed: 38245916 (Sofía, por vencer) o 29543208 (Diego, vencida).</p>
      </div>
    </div>
  )
}
