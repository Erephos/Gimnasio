import Button from './Button.jsx'

// `page` es base 0, igual que la API.
function Pagination({ page, totalPages, totalElements, onChange }) {
  if (!totalPages || totalPages <= 1) {
    return totalElements > 0 ? (
      <p className="text-xs text-slate-500">
        {totalElements} {totalElements === 1 ? 'resultado' : 'resultados'}
      </p>
    ) : null
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        Página {page + 1} de {totalPages} · {totalElements} resultados
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}

export default Pagination
