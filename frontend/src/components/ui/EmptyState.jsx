function EmptyState({ title, description }) {
  return (
    <div className="px-4 py-10 text-center sm:px-6">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
    </div>
  )
}

export default EmptyState
