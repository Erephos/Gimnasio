const VARIANTS = {
  primary:
    'bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-400',
  primarySky: 'bg-sky-500 font-semibold text-slate-950 hover:bg-sky-400',
  outline:
    'border border-white/10 font-medium text-slate-300 hover:border-white/20 hover:text-white',
  outlineStrong:
    'border border-white/10 font-medium text-slate-200 hover:border-white/20 hover:text-white',
  ghost: 'font-medium text-emerald-400 hover:bg-emerald-500/10',
  ghostMuted: 'text-slate-400 hover:text-white',
}

const FOCUS_RINGS = {
  primary:
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300',
  primarySky:
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300',
}

const SIZES = {
  xs: 'rounded-md px-2 py-1 text-xs',
  sm: 'rounded-lg px-3 py-2 text-xs',
  md: 'rounded-lg px-3 py-2.5 text-sm',
  lg: 'rounded-lg px-4 py-3 text-sm',
}

function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  focusRing = true,
  loading = false,
  className = '',
  children,
  ...props
}) {
  const ring = focusRing ? (FOCUS_RINGS[variant] ?? '') : ''

  return (
    <button
      {...props}
      className={`${SIZES[size]} ${VARIANTS[variant]} ${ring} ${
        fullWidth ? 'w-full' : ''
      } ${
        loading ? 'flex items-center justify-center gap-2' : ''
      } transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

export default Button
