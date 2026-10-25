function StatGrid({ items, className = '' }) {
  return (
    <dl className={`grid grid-cols-2 gap-3 lg:grid-cols-4 ${className}`}>
      {items.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3"
        >
          <dt className="text-xs text-slate-400">{stat.label}</dt>
          <dd className="mt-1 text-2xl font-bold text-white">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default StatGrid
