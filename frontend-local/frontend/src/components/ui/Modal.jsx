import { useEffect } from 'react'

const WIDTHS = { md: 'max-w-md', lg: 'max-w-2xl' }

function Modal({ title, description, onClose, size = 'md', children }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${WIDTHS[size]} rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50`}
      >
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export default Modal
