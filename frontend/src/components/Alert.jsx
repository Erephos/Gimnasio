const TONES = {
  success: {
    box: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    badge: 'bg-emerald-500/20 text-emerald-200',
  },
  error: {
    box: 'border-red-500/30 bg-red-500/10 text-red-200',
    badge: 'bg-red-500/20 text-red-200',
  },
}

function Alert({
  tone = 'success',
  code,
  title,
  message,
  icon,
  className = '',
  children,
}) {
  const isError = tone === 'error'
  const styles = TONES[tone] ?? TONES.success
  const role = isError ? 'alert' : 'status'
  const content = message ?? children

  if (icon) {
    return (
      <div
        role={role}
        className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${styles.box} ${className}`}
      >
        {icon}
        <span>{content}</span>
      </div>
    )
  }

  return (
    <div
      role={role}
      className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${styles.box} ${className}`}
    >
      <span
        className={`mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${styles.badge}`}
        aria-hidden="true"
      >
        {code ?? (isError ? '!' : '✓')}
      </span>
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <p className={title ? 'mt-0.5 leading-relaxed' : 'leading-relaxed'}>
          {content}
        </p>
      </div>
    </div>
  )
}

export default Alert
