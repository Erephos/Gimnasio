import { useState } from 'react'
import Badge from '../../components/ui/Badge.jsx'
import Card from '../../components/ui/Card.jsx'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeaderCell,
  DataTableHeaderRow,
  DataTableRow,
} from '../../components/ui/DataTable.jsx'
import DataState from '../../components/ui/DataState.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import SectionHeader from '../../components/ui/SectionHeader.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { listAuditoria } from '../../services/reportes.js'
import { formatDateTime } from '../../utils/dates.js'

function AuditoriaPanel() {
  const [page, setPage] = useState(0)
  const { data, error, loading, reload } = useAsync(() => listAuditoria({ page, size: 10 }), [page])
  const eventos = data?.content ?? []

  return (
    <Card as="section" padding="none">
      <SectionHeader divided title="Registro de actividad" description="Quién hizo qué y cuándo. Los eventos más recientes aparecen primero." />

      <DataState loading={loading} error={error} hasData={Boolean(data)} onRetry={reload}>
        {eventos.length === 0 ? (
          <EmptyState title="Aún no hay actividad registrada" />
        ) : (
          <div className="overflow-x-auto">
            <DataTable>
              <thead>
                <DataTableHeaderRow>
                  <DataTableHeaderCell className="sm:px-6">Fecha</DataTableHeaderCell>
                  <DataTableHeaderCell>Usuario</DataTableHeaderCell>
                  <DataTableHeaderCell>Acción</DataTableHeaderCell>
                  <DataTableHeaderCell>Detalle</DataTableHeaderCell>
                </DataTableHeaderRow>
              </thead>
              <DataTableBody>
                {eventos.map((evento) => (
                  <DataTableRow key={evento.id}>
                    <DataTableCell className="text-xs text-slate-400 sm:px-6">{formatDateTime(evento.fecha)}</DataTableCell>
                    <DataTableCell className="text-slate-300">{evento.usuarioCorreo ?? 'Sistema'}</DataTableCell>
                    <DataTableCell>
                      <Badge tone="muted">
                        {evento.accion} · {evento.entidad}
                        {evento.entidadId !== null && ` #${evento.entidadId}`}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell className="text-xs text-slate-400">{evento.detalle ?? '—'}</DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </div>
        )}
      </DataState>

      {data && (
        <div className="border-t border-white/10 px-4 py-3 sm:px-6">
          <Pagination page={data.number} totalPages={data.totalPages} totalElements={data.totalElements} onChange={setPage} />
        </div>
      )}
    </Card>
  )
}

export default AuditoriaPanel
