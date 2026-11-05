import Alert from './Alert.jsx'
import Button from './Button.jsx'

// Muestra carga / error con reintento; si hay datos, muestra el contenido.
function DataState({ loading, error, hasData = true, onRetry, children }) {
  if (error) {
    return (
      <div className="space-y-3 p-4 sm:p-6">
        <Alert tone="error" message={error} />
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    )
  }

  if (loading && !hasData) {
    return <p className="p-4 text-sm text-slate-400 sm:p-6">Cargando…</p>
  }

  return children
}

export default DataState
