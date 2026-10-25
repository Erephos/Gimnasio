function DemoNote({ children, className = '' }) {
  return (
    <p className={`text-center text-xs text-slate-600 ${className}`}>
      {children}
    </p>
  )
}

export default DemoNote
