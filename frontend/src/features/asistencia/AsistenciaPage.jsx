import { useState } from 'react'
import FaceCapture from '../../components/ui/FaceCapture.jsx'
import { checkIn, checkInFacial } from '../../services/data.js'
import { rutinaDelDia } from '../../services/rutina.js'
import { hablar } from '../../services/voz.js'

export default function AsistenciaPage() {
  const [modo, setModo] = useState('dni') // 'dni' | 'facial'
  const [dni, setDni] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  function showResult(r) {
    const primerNombre = r.socioNombre.split(' ')[0]
    const rutina = rutinaDelDia()
    setResult({
      ok: true,
      msg: `Ingreso registrado. Bienvenido/a ${r.socioNombre}. Membresía vigente hasta ${r.membresiaVigenteHasta}. Rutina de hoy: ${rutina}.`,
    })
    hablar(`Bienvenido o bienvenida, ${primerNombre}. Hoy te toca rutina de ${rutina}.`)
  }

  async function handleCheck() {
    if (!dni.trim()) return
    setLoading(true)
    try {
      const r = await checkIn(dni.trim())
      showResult(r)
    } catch (err) {
      setResult({ ok: false, msg: err.message })
    } finally {
      setLoading(false)
      setDni('')
    }
  }

  async function handleFacial(descriptor) {
    try {
      const r = await checkInFacial(descriptor)
      showResult(r)
    } catch (err) {
      setResult({ ok: false, msg: err.message })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Control de asistencia</h1>
        <p className="text-sm text-slate-400">Registra el ingreso del socio por DNI o reconocimiento facial.</p>
      </div>
      <div className="mx-auto max-w-md rounded-2xl border border-white/5 bg-white/[0.03] p-6">
        <div className="mb-4 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {[{ id: 'dni', label: 'Por DNI' }, { id: 'facial', label: 'Reconocimiento facial' }].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setModo(t.id); setResult(null) }}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${modo === t.id ? 'bg-blue-500 text-white' : 'text-slate-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {modo === 'dni' ? (
          <>
            <label className="mb-2 block text-xs text-slate-400">DNI</label>
            <div className="flex gap-2">
              <input
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                placeholder="38245916"
                disabled={loading}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500/40 focus:outline-none"
              />
              <button type="button" onClick={handleCheck} disabled={loading} className="rounded-xl bg-blue-500 px-4 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-60">
                →
              </button>
            </div>
          </>
        ) : (
          <FaceCapture onCapture={handleFacial} label="Registrar ingreso" />
        )}

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
