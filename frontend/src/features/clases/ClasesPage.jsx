import { useMemo, useState } from 'react'
import { createClase, createEntrenador, deleteClase, listClases, listEntrenadores } from '../../services/data.js'

export default function ClasesPage() {
  const [tick, setTick] = useState(0)
  const clases = useMemo(() => listClases(), [tick])
  const entrenadores = useMemo(() => listEntrenadores(), [tick])
  const [showC, setShowC] = useState(false)
  const [showE, setShowE] = useState(false)
  const [fc, setFc] = useState({ nombre: '', dia: 'Lunes', hora: '09:00', entrenador: '', cupo: '12', aula: 'Aula 1' })
  const [fe, setFe] = useState({ nombre: '', especialidad: '' })
  const [error, setError] = useState('')

  function saveClase(e) {
    e.preventDefault()
    setError('')
    try {
      createClase(fc)
      setShowC(false)
      setTick((t) => t + 1)
    } catch (err) {
      setError(err.message)
    }
  }

  function saveEnt(e) {
    e.preventDefault()
    try {
      createEntrenador(fe)
      setShowE(false)
      setFe({ nombre: '', especialidad: '' })
      setTick((t) => t + 1)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-white">Entrenadores y clases</h1>
          <p className="text-sm text-slate-400">Agenda y equipo (persistente en local).</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowE(true)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">+ Entrenador</button>
          <button type="button" onClick={() => setShowC(true)} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white">+ Clase</button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.03]">
          <div className="border-b border-white/5 px-5 py-4"><h2 className="text-sm font-semibold text-white">Agenda</h2></div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase text-slate-500">
                <th className="px-5 py-3">Clase</th>
                <th className="px-3 py-3">Día / Hora</th>
                <th className="px-3 py-3">Entrenador</th>
                <th className="px-3 py-3">Cupo</th>
                <th className="px-3 py-3">Aula</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {clases.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="px-5 py-3 font-medium text-white">{c.nombre}</td>
                  <td className="px-3 py-3 text-slate-400">{c.dia} · {c.hora}</td>
                  <td className="px-3 py-3 text-slate-300">{c.entrenador}</td>
                  <td className="px-3 py-3 text-slate-300">{c.inscritos}/{c.cupo}</td>
                  <td className="px-3 py-3 text-slate-400">{c.aula}</td>
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => { deleteClase(c.id); setTick((t) => t + 1) }} className="text-xs text-red-400">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
          <div className="border-b border-white/5 px-5 py-4"><h2 className="text-sm font-semibold text-white">Equipo</h2></div>
          <div className="space-y-3 p-4">
            {entrenadores.map((e) => (
              <div key={e.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <p className="text-sm font-medium text-white">{e.nombre}</p>
                <p className="text-xs text-slate-500">{e.especialidad}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={saveClase} className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-white">Nueva clase</h2>
            <input placeholder="Nombre" required value={fc.nombre} onChange={(e) => setFc({ ...fc, nombre: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <select value={fc.dia} onChange={(e) => setFc({ ...fc, dia: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].map((d) => <option key={d}>{d}</option>)}
            </select>
            <input type="time" value={fc.hora} onChange={(e) => setFc({ ...fc, hora: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <select value={fc.entrenador} onChange={(e) => setFc({ ...fc, entrenador: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              <option value="">Entrenador</option>
              {entrenadores.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
            </select>
            <input placeholder="Cupo" value={fc.cupo} onChange={(e) => setFc({ ...fc, cupo: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Aula" value={fc.aula} onChange={(e) => setFc({ ...fc, aula: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowC(false)} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-slate-300">Cancelar</button>
              <button type="submit" className="flex-1 rounded-lg bg-blue-500 py-2 text-sm text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}
      {showE && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={saveEnt} className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-white">Nuevo entrenador</h2>
            <input placeholder="Nombre" required value={fe.nombre} onChange={(e) => setFe({ ...fe, nombre: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Especialidad" value={fe.especialidad} onChange={(e) => setFe({ ...fe, especialidad: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowE(false)} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-slate-300">Cancelar</button>
              <button type="submit" className="flex-1 rounded-lg bg-blue-500 py-2 text-sm text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
