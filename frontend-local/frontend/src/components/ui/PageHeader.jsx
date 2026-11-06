function PageHeader({
  title,
  titleId,
  description,
  actions,
  layout = 'block',
  className = '',
}) {
  const content = (
    <>
      <h1
        id={titleId}
        className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
      >
        {title}
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p>
      )}
    </>
  )

  if (layout === 'split') {
    return (
      <div
        className={`flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between ${className}`}
      >
        <div>{content}</div>
        {actions}
      </div>
    )
  }

  return <div className={className}>{content}</div>
}

export default PageHeader
