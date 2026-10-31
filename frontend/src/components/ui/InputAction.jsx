function InputAction({ className = '', children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`absolute top-1/2 right-3 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-slate-400 transition hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 ${className}`}
    >
      {children}
    </button>
  )
}

export default InputAction
