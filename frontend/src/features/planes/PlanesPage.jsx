import { useMemo, useState } from 'react'
import { createPlan, listPlanes, updatePlan } from '../../services/data.js'

const empty = { nombre: '', precio: '', dias: '30', disciplina: 'Full' }

export default function PlanesPage() {
  const [tick, setTick] = useState(0)
  const planes = useMemo(() => listPlanes(true), [tick])
  const [show, setShow] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  function openNew() {
    setEditId(null)
    setForm(empty)
    setError('')
    setShow(true)
  }

  function openEdit(p) {
    setEditId(p.id)
    setForm({ nombre: p.nombre, precio: String(p.precio), dias: String(p.dias), disciplina: p.disciplina })
    setError('')
    setShow(true)
  }

  function submit(e) {
    e.preventDefault()
    setError('')
    try {
      if (editId) updatePlan(editId, { ...form, precio: Number(form.precio), dias: Number(form.dias) })
      else createPlan(form)
      setShow(false)
      setTick((t) => t + 1)
    } catch (err) {
      setError(err.message)
    }
  }

  function toggle(p) {
    updatePlan(p.id, { activo: !p.activo })
    setTick((t) => t + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Membresías y planes</h1>
          <p className="text-sm text-slate-400">Catálogo editable. Se guarda en el navegador.</p>
        </div>
        <button type="button" onClick={openNew} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600">+ Nuevo plan</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {planes.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <p className="text-sm font-semibold text-white">{p.nombre}</p>
            <p className="mt-2 text-2xl font-semibold text-blue-400">$ {Number(p.precio).toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-500">{p.dias} días · {p.disciplina}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${p.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'}`}>
                {p.activo ? 'Activo' : 'Inactivo'}
              </span>
              <button type="button" onClick={() => openEdit(p)} className="text-[11px] text-blue-400 hover:underline">Editar</button>
              <button type="button" onClick={() => toggle(p)} className="text-[11px] text-slate-400 hover:underline">{p.activo ? 'Desactivar' : 'Activar'}</button>
            </div>
          </div>
        ))}
      </div>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-white">{editId ? 'Editar plan' : 'Nuevo plan'}</h2>
            {['nombre', 'precio', 'dias', 'disciplina'].map((k) => (
              <div key={k}>
                <label className="mb-1 block text-xs capitalize text-slate-400">{k}</label>
                <input
                  required={k === 'nombre'}
                  value={form[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            ))}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShow(false)} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-slate-300">Cancelar</button>
              <button type="submit" className="flex-1 rounded-lg bg-blue-500 py-2 text-sm text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
