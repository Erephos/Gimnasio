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
import SectionHeader from '../../components/ui/SectionHeader.jsx'
import Select from '../../components/ui/Select.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { listAlertas } from '../../services/membresias.js'
import { formatDate } from '../../utils/dates.js'

const RANGES = [7, 15, 30, 60]

function AlertasVencimiento() {
  const [dias, setDias] = useState(7)
  const { data, error, loading, reload } = useAsync(() => listAlertas(dias), [dias])
  const alertas = data ?? []

  return (
    <Card as="section" padding="none">
      <SectionHeader
        divided
        title="Vencimientos"
        description="Membresías vencidas en los últimos 30 días y las que vencen pronto."
        action={
          <Select aria-label="Rango de vencimiento" value={dias} onChange={(event) => setDias(Number(event.target.value))} className="sm:w-48">
            {RANGES.map((range) => (
              <option key={range} value={range}>
                Próximos {range} días
              </option>
            ))}
          </Select>
        }
      />

      <DataState loading={loading} error={error} hasData={Boolean(data)} onRetry={reload}>
        {alertas.length === 0 ? (
          <EmptyState title="No hay vencimientos en este rango" />
        ) : (
          <div className="overflow-x-auto">
            <DataTable>
              <thead>
                <DataTableHeaderRow>
                  <DataTableHeaderCell className="sm:px-6">Socio</DataTableHeaderCell>
                  <DataTableHeaderCell>DNI</DataTableHeaderCell>
                  <DataTableHeaderCell>Plan</DataTableHeaderCell>
                  <DataTableHeaderCell>Vence</DataTableHeaderCell>
                  <DataTableHeaderCell>Estado</DataTableHeaderCell>
                </DataTableHeaderRow>
              </thead>
              <DataTableBody>
                {alertas.map((alerta) => (
                  <DataTableRow key={alerta.membresiaId}>
                    <DataTableCell className="sm:px-6">
                      <p className="font-medium text-white">{alerta.socioNombre}</p>
                      <p className="text-xs text-slate-500">{alerta.correo}</p>
                    </DataTableCell>
                    <DataTableCell className="font-mono text-xs text-slate-400">{alerta.dni}</DataTableCell>
                    <DataTableCell className="text-slate-300">{alerta.plan ?? '—'}</DataTableCell>
                    <DataTableCell className="text-slate-300">{formatDate(alerta.fechaFin)}</DataTableCell>
                    <DataTableCell>
                      {alerta.estado === 'VENCIDA' ? (
                        <Badge tone="red">Vencida</Badge>
                      ) : (
                        <Badge tone="sky">
                          {alerta.diasRestantes === 1 ? 'Vence en 1 día' : `Vence en ${alerta.diasRestantes} días`}
                        </Badge>
                      )}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </div>
        )}
      </DataState>
    </Card>
  )
}

export default AlertasVencimiento
