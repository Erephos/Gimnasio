const TONES = {
  neutral: 'bg-slate-500/10 text-slate-400 ring-slate-500/30',
  sky: 'bg-sky-500/10 text-sky-300 ring-sky-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  red: 'bg-red-500/10 text-red-300 ring-red-500/30',
  muted: 'bg-white/5 text-slate-300 ring-white/10',
}

const SIZES = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1 text-xs',
}

function Badge({ tone = 'neutral', size = 'sm', className = '', children }) {
  return (
    <span
      className={`inline-flex rounded-full font-medium ring-1 ${SIZES[size]} ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
