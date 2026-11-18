import { useEffect, useState } from 'react'
import FaceCapture from '../../components/ui/FaceCapture.jsx'
import { createSocio, crearMembresia, deactivateSocio, enrolarRostro, getMembresiaVigenteSocio, listPlanes, listSocios, toggleUserActive, updateSocio } from '../../services/data.js'

const emptyForm = { nombre: '', apellido: '', dni: '', correo: '', telefono: '', genero: 'MASCULINO', password: 'Socio2026!' }
const emptyEdit = { correo: '', telefono: '', direccion: '', contactoEmergencia: '' }

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [total, setTotal] = useState(0)
  const [activos, setActivos] = useState(0)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null) // 'new' | 'edit' | 'plan'
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyEdit)
  const [planForm, setPlanForm] = useState({ planId: '' })
  const [planes, setPlanes] = useState([])
  const [activeSocio, setActiveSocio] = useState(null)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')

  async function reload() {
    setLoading(true)
    const [page, countActivos] = await Promise.all([
      listSocios({ q, size: 50 }),
      listSocios({ activo: true, size: 1 }),
    ])
    const conMembresia = await Promise.all(
      page.content.map(async (s) => ({ ...s, membresia: await getMembresiaVigenteSocio(s.id) })),
    )
    setSocios(conMembresia)
    setTotal(page.totalElements)
    setActivos(countActivos.totalElements)
    setLoading(false)
  }

  useEffect(() => {
    const t = setTimeout(reload, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  function openNew() {
    setModal('new')
    setForm(emptyForm)
    setError('')
  }

  function openEdit(s) {
    setModal('edit')
    setActiveSocio(s)
    setEditForm({ correo: s.correo, telefono: s.telefono || '', direccion: s.direccion || '', contactoEmergencia: s.contactoEmergencia || '' })
    setError('')
  }

  function openPlan(s) {
    setModal('plan')
    setActiveSocio(s)
    if (planes.length === 0) listPlanes().then(setPlanes)
    setPlanForm({ planId: '' })
    setError('')
  }

  function openRostro(s) {
    setModal('rostro')
    setActiveSocio(s)
    setError('')
  }

  async function handleRostro(descriptor) {
    await enrolarRostro(activeSocio.id, descriptor)
    setOkMsg(`Rostro registrado para ${activeSocio.nombreCompleto}`)
    setModal(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setOkMsg('')
    try {
      if (modal === 'new') {
        await createSocio(form)
        setOkMsg('Socio registrado. Asígnale un plan desde "Plan" en la tabla.')
      } else if (modal === 'edit') {
        await updateSocio(activeSocio.id, editForm)
        setOkMsg('Socio actualizado')
      } else if (modal === 'plan') {
        await crearMembresia({ socioId: activeSocio.id, planId: planForm.planId, fechaInicio: new Date().toISOString().slice(0, 10) })
        setOkMsg('Membresía asignada')
      }
      setModal(null)
      reload()
    } catch (err) {
      setError(err.message || 'Error')
    }
  }

  async function handleBaja(id) {
    if (!confirm('¿Dar de baja a este socio? Su cuenta quedará inactiva (no podrá loguearse ni hacer check-in), pero su historial se conserva.')) return
    await deactivateSocio(id)
    reload()
  }

  async function handleReactivar(s) {
    await toggleUserActive(s.usuarioId, true)
    reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Clientes / Socios</h1>
          <p className="text-sm text-slate-400">Registro de socios del gimnasio.</p>
        </div>
        <button type="button" onClick={openNew} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600">+ Nuevo socio</button>
      </div>
      {okMsg && <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">{okMsg}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">Registrados</p>
          <p className="mt-1 text-xl font-semibold text-white">{total}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">Cuentas activas</p>
          <p className="mt-1 text-xl font-semibold text-white">{activos}</p>
        </div>
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
                <th className="px-3 py-3">Membresía</th>
                <th className="px-3 py-3">Cuenta</th>
                <th className="px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-5 py-6 text-slate-500" colSpan={6}>Cargando…</td></tr>
              ) : socios.length === 0 ? (
                <tr><td className="px-5 py-6 text-slate-500" colSpan={6}>Sin resultados.</td></tr>
              ) : socios.map((s) => {
                const vigente = s.membresia?.vigente
                const badge = vigente ? 'bg-emerald-500/15 text-emerald-400' : s.membresia ? 'bg-red-500/15 text-red-400' : 'bg-white/10 text-slate-400'
                const label = vigente ? 'Vigente' : s.membresia ? 'Vencida' : 'Sin membresía'
                return (
                  <tr key={s.id} className={`border-b border-white/5 ${!s.activo ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3 font-medium text-white">{s.nombreCompleto}</td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-400">{s.dni}</td>
                    <td className="px-3 py-3 text-slate-300">{s.membresia?.planNombre || '—'}</td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] ${badge}`}>{label}</span></td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${s.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'}`}>
                        {s.activo ? 'Activa' : 'Dada de baja'}
                      </span>
                    </td>
                    <td className="px-3 py-3 space-x-2 text-xs">
                      <button type="button" onClick={() => openPlan(s)} className="text-emerald-400 hover:underline">Plan</button>
                      <button type="button" onClick={() => openRostro(s)} className="text-purple-400 hover:underline">Rostro</button>
                      <button type="button" onClick={() => openEdit(s)} className="text-blue-400 hover:underline">Editar</button>
                      {s.activo ? (
                        <button type="button" onClick={() => handleBaja(s.id)} className="text-red-400 hover:underline">Baja</button>
                      ) : (
                        <button type="button" onClick={() => handleReactivar(s)} className="text-emerald-400 hover:underline">Reactivar</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'new' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-white">Nuevo socio</h2>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Nombre" required value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
              <input placeholder="Apellido" required value={form.apellido} onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <input placeholder="DNI (8 dígitos)" required value={form.dni} onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            <select value={form.genero} onChange={(e) => setForm((f) => ({ ...f, genero: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
            </select>
            <input placeholder="Teléfono (9 dígitos)" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            <input type="email" placeholder="Correo" required value={form.correo} onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            <input placeholder="Contraseña (mín. 8)" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-slate-300">Cancelar</button>
              <button type="submit" className="flex-1 rounded-lg bg-blue-500 py-2 text-sm text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {modal === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-white">Editar socio</h2>
            <input type="email" placeholder="Correo" value={editForm.correo} onChange={(e) => setEditForm((f) => ({ ...f, correo: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            <input placeholder="Teléfono" value={editForm.telefono} onChange={(e) => setEditForm((f) => ({ ...f, telefono: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            <input placeholder="Dirección" value={editForm.direccion} onChange={(e) => setEditForm((f) => ({ ...f, direccion: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            <input placeholder="Contacto de emergencia" value={editForm.contactoEmergencia} onChange={(e) => setEditForm((f) => ({ ...f, contactoEmergencia: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-slate-300">Cancelar</button>
              <button type="submit" className="flex-1 rounded-lg bg-blue-500 py-2 text-sm text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {modal === 'rostro' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-white">Enrolar rostro de {activeSocio?.nombreCompleto}</h2>
            <p className="text-xs text-slate-400">Pide al socio que mire de frente a la cámara, con buena luz.</p>
            <FaceCapture onCapture={handleRostro} label="Registrar rostro" />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="button" onClick={() => setModal(null)} className="w-full rounded-lg border border-white/10 py-2 text-sm text-slate-300">Cerrar</button>
          </div>
        </div>
      )}

      {modal === 'plan' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-white">Asignar plan a {activeSocio?.nombreCompleto}</h2>
            <select required value={planForm.planId} onChange={(e) => setPlanForm({ planId: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              <option value="">Selecciona un plan</option>
              {planes.map((p) => <option key={p.id} value={p.id}>{p.nombre} · S/ {p.precio}</option>)}
            </select>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-slate-300">Cancelar</button>
              <button type="submit" className="flex-1 rounded-lg bg-blue-500 py-2 text-sm text-white">Asignar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
