import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Dumbbell, Trophy } from 'lucide-react'
import { listRetoSentadillasTop } from '../../services/data.js'

const MEDALLA = ['text-yellow-400', 'text-slate-300', 'text-amber-600']

export default function RetoSentadillasRankingPage() {
  const [top, setTop] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    listRetoSentadillasTop(50)
      .then((rows) => !cancelled && setTop(rows))
      .catch((err) => !cancelled && setError(err.message))
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0b0f1a] p-6">
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300">‹ Volver al login</Link>
        <p className="text-[10px] uppercase tracking-wider text-slate-500">ximEdgar Gym · Stand</p>
      </div>

      <div className="w-full max-w-md">
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-semibold text-white">
          <Trophy size={22} />
          Ranking del reto de sentadillas
        </h1>
        <p className="mb-6 text-sm text-slate-400">Los mejores puntajes del stand, actualizados en vivo.</p>

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        {!error && top === null && <p className="text-sm text-slate-400">Cargando ranking…</p>}

        {top !== null && top.length === 0 && (
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-400">
            Todavía nadie ha jugado el reto. ¡Sé el primero!
          </p>
        )}

        {top !== null && top.length > 0 && (
          <ol className="space-y-2">
            {top.map((row, i) => (
              <li key={row.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center text-sm font-bold ${MEDALLA[i] ?? 'text-slate-500'}`}>{i + 1}</span>
                  <span className="text-sm text-slate-200">{row.nombre}</span>
                </div>
                <span className="text-lg font-bold text-white">{row.repeticiones}</span>
              </li>
            ))}
          </ol>
        )}

        <Link
          to="/reto-sentadillas"
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600"
        >
          <Dumbbell size={16} />
          Participar en el reto
        </Link>
      </div>
    </div>
  )
}
