import { useState } from 'react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import HistorialPagos from './HistorialPagos.jsx'
import RegistrarPago from './RegistrarPago.jsx'

function PagosPage() {
  // Al registrar un pago se cambia la clave para que el historial se vuelva a cargar.
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <>
      <PageHeader
        title="Pagos"
        description="Registra abonos de las membresías y consulta el historial. Un pago anulado se conserva con su motivo."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <RegistrarPago onRegistered={() => setRefreshKey((key) => key + 1)} />
        <HistorialPagos refreshKey={refreshKey} />
      </div>
    </>
  )
}

export default PagosPage
