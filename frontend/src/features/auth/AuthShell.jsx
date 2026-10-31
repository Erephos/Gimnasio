import BrandMark from '../../components/ui/BrandMark.jsx'

function AuthShell({ title, subtitle, wide = false, children, footer }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
      />

      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <header className="mb-8 text-center">
          <BrandMark size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
        </header>

        {children}

        {footer && <div className="mt-6 text-center text-xs text-slate-500">{footer}</div>}
      </div>
    </main>
  )
}

export default AuthShell
