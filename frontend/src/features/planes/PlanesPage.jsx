import { getDb } from '../../mock/db.js'
export default function PlanesPage() {
  const { planes } = getDb()
  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold text-white">Membresías y planes</h1><p className="text-sm text-slate-400">Catálogo de planes disponibles.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {planes.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <p className="text-sm font-semibold text-white">{p.nombre}</p>
            <p className="mt-2 text-2xl font-semibold text-blue-400">$ {p.precio.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-500">{p.dias} días · {p.disciplina}</p>
            <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[11px] ${p.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
