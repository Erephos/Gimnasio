const FIELD_STYLES = {
  compact: {
    label: 'mb-1.5 block text-xs font-medium text-slate-300',
    error: 'mt-1.5 text-xs text-red-400',
    hint: 'mt-1.5 text-xs text-slate-500',
  },
  comfortable: {
    label: 'mb-2 block text-sm font-medium text-slate-200',
    error: 'mt-2 text-sm text-red-400',
    hint: 'mt-2 text-xs text-slate-500',
  },
}

function Field({
  id,
  label,
  error,
  errorId,
  hint,
  hintId,
  density = 'compact',
  className = '',
  children,
}) {
  const styles = FIELD_STYLES[density]

  return (
    <div className={className}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export default Field
