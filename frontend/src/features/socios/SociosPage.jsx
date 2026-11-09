import { useMemo, useState } from 'react'
import { createSocio, deactivateSocio, listPlanes, listSocios, updateSocio } from '../../services/data.js'
import { getDb } from '../../mock/db.js'

const emptyForm = { nombre: '', dni: '', correo: '', telefono: '', planId: '', password: 'Socio2026!', estado: 'activa' }

export default function SociosPage() {
  const [tick, setTick] = useState(0)
  const refresh = () => setTick((t) => t + 1)
  const socios = useMemo(() => listSocios(), [tick])
  const planes = useMemo(() => listPlanes(), [tick])
  const db = useMemo(() => getDb(), [tick])
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null) // 'new' | 'edit'
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return socios
    return socios.filter((s) => s.nombre.toLowerCase().includes(t) || s.dni.includes(t) || s.codigo.toLowerCase().includes(t))
  }, [socios, q])

  function openNew() {
    setModal('new')
    setForm({ ...emptyForm, planId: String(planes[0]?.id || '') })
    setError('')
  }

  function openEdit(s) {
    setModal('edit')
    setEditId(s.id)
    setForm({
      nombre: s.nombre,
      dni: s.dni,
      correo: s.correo,
      telefono: s.telefono || '',
      planId: String(s.planId),
      password: '',
      estado: s.estado,
    })
    setError('')
  }

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setOkMsg('')
    try {
      if (modal === 'new') {
        createSocio({ ...form, planId: form.planId || planes[0]?.id })
        setOkMsg('Socio registrado')
      } else {
        updateSocio(editId, form)
        setOkMsg('Socio actualizado')
      }
      setModal(null)
      refresh()
    } catch (err) {
      setError(err.message || 'Error')
    }
  }

  function handleBaja(id) {
    if (!confirm('¿Dar de baja a este socio?')) return
    deactivateSocio(id)
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Clientes / Socios</h1>
          <p className="text-sm text-slate-400">CRUD completo en localStorage.</p>
        </div>
        <button type="button" onClick={openNew} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600">+ Nuevo socio</button>
      </div>
      {okMsg && <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">{okMsg}</p>}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { l: 'Registrados', v: socios.length },
          { l: 'Activas / por vencer', v: socios.filter((s) => s.estado !== 'vencida').length },
          { l: 'Por vencer', v: socios.filter((s) => s.estado === 'por_vencer').length },
          { l: 'Vencidas', v: socios.filter((s) => s.estado === 'vencida').length },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">{c.l}</p>
            <p className="mt-1 text-xl font-semibold text-white">{c.v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
        <div className="border-b border-white/5 p-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por DNI o nombre" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase text-slate-500">
                <th className="px-5 py-3">Socio</th>
                <th className="px-3 py-3">DNI</th>
                <th className="px-3 py-3">Plan</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Última asistencia</th>
                <th className="px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const plan = db.planes.find((p) => p.id === s.planId)
                const badge = s.estado === 'activa' ? 'bg-emerald-500/15 text-emerald-400' : s.estado === 'por_vencer' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
                const label = s.estado === 'activa' ? 'Activa' : s.estado === 'por_vencer' ? 'Por vencer' : 'Vencida'
                return (
                  <tr key={s.id} className="border-b border-white/5">
                    <td className="px-5 py-3"><p className="font-medium text-white">{s.nombre}</p><p className="text-[11px] text-slate-500">{s.codigo}</p></td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-400">{s.dni}</td>
                    <td className="px-3 py-3 text-slate-300">{plan?.nombre}</td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] ${badge}`}>{label}</span></td>
                    <td className="px-3 py-3 text-slate-400">{s.ultimaAsistencia}</td>
                    <td className="px-3 py-3 space-x-2 text-xs">
                      <button type="button" onClick={() => openEdit(s)} className="text-blue-400 hover:underline">Editar</button>
                      <button type="button" onClick={() => handleBaja(s.id)} className="text-red-400 hover:underline">Baja</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-white">{modal === 'new' ? 'Nuevo socio' : 'Editar socio'}</h2>
            {['nombre', 'dni', 'correo', 'telefono'].map((name) => (
              <div key={name}>
                <label className="mb-1 block text-xs capitalize text-slate-400">{name}</label>
                <input name={name} required={name !== 'telefono'} value={form[name]} onChange={onChange} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs text-slate-400">Plan</label>
              <select name="planId" value={form.planId} onChange={onChange} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                {planes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            {modal === 'edit' && (
              <div>
                <label className="mb-1 block text-xs text-slate-400">Estado membresía</label>
                <select name="estado" value={form.estado} onChange={onChange} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                  <option value="activa">Activa</option>
                  <option value="por_vencer">Por vencer</option>
                  <option value="vencida">Vencida</option>
                </select>
              </div>
            )}
            {modal === 'new' && (
              <div>
                <label className="mb-1 block text-xs text-slate-400">Contraseña acceso</label>
                <input name="password" value={form.password} onChange={onChange} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-slate-300">Cancelar</button>
              <button type="submit" className="flex-1 rounded-lg bg-blue-500 py-2 text-sm text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
