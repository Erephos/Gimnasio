function SectionHeader({
  title,
  titleId,
  description,
  descriptionClassName = 'text-sm text-slate-400',
  action,
  divided = false,
  className = '',
}) {
  const content = (
    <div>
      <h2 id={titleId} className="text-lg font-semibold text-white">
        {title}
      </h2>
      {description && <p className={descriptionClassName}>{description}</p>}
    </div>
  )

  if (divided) {
    return (
      <div
        className={`flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6 ${className}`}
      >
        {content}
        {action}
      </div>
    )
  }

  return (
    <div className={className}>
      {content}
      {action}
    </div>
  )
}

export default SectionHeader
