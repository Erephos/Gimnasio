const TONES = {
  neutral: 'border-white/10 bg-slate-950/40 text-slate-400',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  error: 'border-red-500/30 bg-red-500/10 text-red-200',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
}

function InfoBox({ tone = 'neutral', label, className = '', children }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${TONES[tone]} ${className}`}
    >
      {label && (
        <p className="mb-1 text-[11px] font-semibold tracking-wide uppercase opacity-80">
          {label}
        </p>
      )}
      <p>{children}</p>
    </div>
  )
}

export default InfoBox
