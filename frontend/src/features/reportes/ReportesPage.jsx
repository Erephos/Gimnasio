export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold text-white">Reportes y auditoría</h1><p className="text-sm text-slate-400">Rendimiento de la sede (datos demo).</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { l: 'Ingresos del mes', v: '$ 1.240.000' },
          { l: 'Nuevos socios', v: '32' },
          { l: 'Tasa de renovación', v: '78%' },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <p className="text-xs text-slate-500">{c.l}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{c.v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-8 text-center text-sm text-slate-500">
        Gráficos y exportación estarán disponibles en la siguiente iteración. Los datos mostrados son de demostración.
      </div>
    </div>
  )
}
