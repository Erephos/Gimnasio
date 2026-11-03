import { getDb } from '../../mock/db.js'
export default function ClasesPage() {
  const { clases, entrenadores } = getDb()
  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold text-white">Entrenadores y clases</h1><p className="text-sm text-slate-400">Agenda semanal y gestión de cupos.</p></div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.03]">
          <div className="border-b border-white/5 px-5 py-4"><h2 className="text-sm font-semibold text-white">Agenda semanal</h2></div>
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-white/5 text-[11px] uppercase text-slate-500"><th className="px-5 py-3">Clase</th><th className="px-3 py-3">Día / Hora</th><th className="px-3 py-3">Entrenador</th><th className="px-3 py-3">Cupo</th><th className="px-3 py-3">Aula</th></tr></thead>
            <tbody>
              {clases.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="px-5 py-3 font-medium text-white">{c.nombre}</td>
                  <td className="px-3 py-3 text-slate-400">{c.dia} · {c.hora}</td>
                  <td className="px-3 py-3 text-slate-300">{c.entrenador}</td>
                  <td className="px-3 py-3 text-slate-300">{c.inscritos}/{c.cupo}</td>
                  <td className="px-3 py-3 text-slate-400">{c.aula}</td>
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
                <p className="mt-1 text-[11px] text-slate-400">{e.clases} clases activas</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
