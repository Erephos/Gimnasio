import { useEffect, useState } from 'react'
import { cancelarClase, createClase, createEntrenador, listClases, listEntrenadores } from '../../services/data.js'

const emptyClase = { disciplina: '', entrenadorId: '', aula: '', fecha: '', horaInicio: '09:00', horaFin: '10:00', aforo: '12' }
const emptyEnt = { nombre: '', apellido: '', correo: '', password: 'Entrenador2026!', dni: '', telefono: '', especialidad: '' }

export default function ClasesPage() {
  const [clases, setClases] = useState([])
  const [entrenadores, setEntrenadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [showC, setShowC] = useState(false)
  const [showE, setShowE] = useState(false)
  const [fc, setFc] = useState(emptyClase)
  const [fe, setFe] = useState(emptyEnt)
  const [error, setError] = useState('')

  function reload() {
    setLoading(true)
    Promise.all([listClases(), listEntrenadores()]).then(([c, e]) => {
      setClases(c)
      setEntrenadores(e)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  async function saveClase(e) {
    e.preventDefault()
    setError('')
    try {
      await createClase({
        disciplina: fc.disciplina.trim(),
        entrenadorId: Number(fc.entrenadorId),
        aula: fc.aula.trim(),
        inicio: `${fc.fecha}T${fc.horaInicio}:00-05:00`,
        fin: `${fc.fecha}T${fc.horaFin}:00-05:00`,
        aforo: Number(fc.aforo),
      })
      setShowC(false)
      setFc(emptyClase)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  async function saveEnt(e) {
    e.preventDefault()
    setError('')
    try {
      await createEntrenador(fe)
      setShowE(false)
      setFe(emptyEnt)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCancelar(id) {
    if (!confirm('¿Cancelar esta clase? Se cancelan también sus reservas.')) return
    await cancelarClase(id)
    reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-white">Entrenadores y clases</h1>
          <p className="text-sm text-slate-400">Agenda y equipo del gimnasio.</p>
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
                <th className="px-3 py-3">Horario</th>
                <th className="px-3 py-3">Entrenador</th>
                <th className="px-3 py-3">Cupo</th>
                <th className="px-3 py-3">Aula</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-5 py-6 text-slate-500" colSpan={6}>Cargando…</td></tr>
              ) : clases.length === 0 ? (
                <tr><td className="px-5 py-6 text-slate-500" colSpan={6}>Sin clases programadas.</td></tr>
              ) : clases.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="px-5 py-3 font-medium text-white">{c.disciplina}</td>
                  <td className="px-3 py-3 text-slate-400">{new Date(c.inicio).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="px-3 py-3 text-slate-300">{c.entrenadorNombre}</td>
                  <td className="px-3 py-3 text-slate-300">{c.reservasActivas}/{c.aforo}</td>
                  <td className="px-3 py-3 text-slate-400">{c.aula}</td>
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => handleCancelar(c.id)} className="text-xs text-red-400">Cancelar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
          <div className="border-b border-white/5 px-5 py-4"><h2 className="text-sm font-semibold text-white">Equipo</h2></div>
          <div className="space-y-3 p-4">
            {entrenadores.length === 0 && <p className="text-sm text-slate-500">Sin entrenadores todavía.</p>}
            {entrenadores.map((e) => (
              <div key={e.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <p className="text-sm font-medium text-white">{e.nombreCompleto}</p>
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
            <input placeholder="Disciplina" required value={fc.disciplina} onChange={(e) => setFc({ ...fc, disciplina: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <select required value={fc.entrenadorId} onChange={(e) => setFc({ ...fc, entrenadorId: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              <option value="">Entrenador</option>
              {entrenadores.map((e) => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
            </select>
            <input type="date" required value={fc.fecha} onChange={(e) => setFc({ ...fc, fecha: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <div className="grid grid-cols-2 gap-3">
              <input type="time" value={fc.horaInicio} onChange={(e) => setFc({ ...fc, horaInicio: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              <input type="time" value={fc.horaFin} onChange={(e) => setFc({ ...fc, horaFin: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            </div>
            <input placeholder="Cupo" type="number" min="1" value={fc.aforo} onChange={(e) => setFc({ ...fc, aforo: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Aula" required value={fc.aula} onChange={(e) => setFc({ ...fc, aula: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
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
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Nombre" required value={fe.nombre} onChange={(e) => setFe({ ...fe, nombre: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              <input placeholder="Apellido" required value={fe.apellido} onChange={(e) => setFe({ ...fe, apellido: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            </div>
            <input placeholder="DNI (8 dígitos)" required value={fe.dni} onChange={(e) => setFe({ ...fe, dni: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Especialidad" required value={fe.especialidad} onChange={(e) => setFe({ ...fe, especialidad: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Teléfono" value={fe.telefono} onChange={(e) => setFe({ ...fe, telefono: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input type="email" placeholder="Correo" required value={fe.correo} onChange={(e) => setFe({ ...fe, correo: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Contraseña (mín. 8)" required value={fe.password} onChange={(e) => setFe({ ...fe, password: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            {error && <p className="text-sm text-red-400">{error}</p>}
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
