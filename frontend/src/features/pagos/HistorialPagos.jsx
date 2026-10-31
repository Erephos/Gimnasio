import { useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
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
import Field from '../../components/ui/Field.jsx'
import Input from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import SectionHeader from '../../components/ui/SectionHeader.jsx'
import Select from '../../components/ui/Select.jsx'
import { METODOS_PAGO, PAGE_SIZE } from '../../config/constants.js'
import { ROLES } from '../../config/roles.js'
import { useAsync } from '../../hooks/useAsync.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { errorMessage } from '../../services/api.js'
import { annulPago, listPagos } from '../../services/pagos.js'
import { formatDateTime } from '../../utils/dates.js'
import { formatCurrency } from '../../utils/format.js'
import { useAuth } from '../auth/useAuth.js'

const methodLabel = (value) => METODOS_PAGO.find((option) => option.value === value)?.label ?? value

function AnnulModal({ pago, onClose, onDone }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!motivo.trim()) return setError('Indica el motivo de la anulación.')
    setIsSaving(true)
    try {
      await annulPago(pago.id, motivo.trim())
      onDone()
    } catch (requestError) {
      setError(errorMessage(requestError))
      setIsSaving(false)
    }
  }

  return (
    <Modal
      title="Anular pago"
      description={`${formatCurrency(pago.monto)} de ${pago.socioNombre}. El registro no se borra: queda marcado como anulado.`}
      onClose={onClose}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert tone="error" message={error} />}
        <Field id="annul-motivo" label="Motivo">
          <Input id="annul-motivo" maxLength={200} value={motivo} onChange={(event) => setMotivo(event.target.value)} autoFocus />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" loading={isSaving} disabled={isSaving}>
            Anular pago
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function HistorialPagos({ refreshKey }) {
  const { user } = useAuth()
  const isAdmin = user.rol === ROLES.ADMIN
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('')
  const [page, setPage] = useState(0)
  const [toAnnul, setToAnnul] = useState(null)
  const debounced = useDebouncedValue(query)

  const { data, error, loading, reload } = useAsync(
    () => listPagos({ q: debounced.trim(), estado, page, size: PAGE_SIZE }),
    [debounced, estado, page, refreshKey],
  )
  const pagos = data?.content ?? []

  return (
    <Card as="section" padding="none" className="lg:col-span-3">
      <SectionHeader divided title="Historial de pagos" description="Más recientes primero." />

      <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:px-6">
        <Input
          type="search"
          aria-label="Buscar pagos"
          placeholder="Buscar por socio, DNI o correo"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(0)
          }}
        />
        <Select
          aria-label="Filtrar por estado"
          value={estado}
          onChange={(event) => {
            setEstado(event.target.value)
            setPage(0)
          }}
          className="sm:max-w-[11rem]"
        >
          <option value="">Todos</option>
          <option value="REGISTRADO">Registrados</option>
          <option value="ANULADO">Anulados</option>
        </Select>
      </div>

      <DataState loading={loading} error={error} hasData={Boolean(data)} onRetry={reload}>
        {pagos.length === 0 ? (
          <EmptyState title="No hay pagos para mostrar" />
        ) : (
          <div className="overflow-x-auto">
            <DataTable>
              <thead>
                <DataTableHeaderRow>
                  <DataTableHeaderCell className="sm:px-6">Fecha</DataTableHeaderCell>
                  <DataTableHeaderCell>Socio</DataTableHeaderCell>
                  <DataTableHeaderCell>Monto</DataTableHeaderCell>
                  <DataTableHeaderCell>Estado</DataTableHeaderCell>
                  <DataTableHeaderCell>
                    <span className="sr-only">Acciones</span>
                  </DataTableHeaderCell>
                </DataTableHeaderRow>
              </thead>
              <DataTableBody>
                {pagos.map((pago) => (
                  <DataTableRow key={pago.id}>
                    <DataTableCell className="text-xs text-slate-400 sm:px-6">{formatDateTime(pago.fechaPago)}</DataTableCell>
                    <DataTableCell>
                      <p className="font-medium text-white">{pago.socioNombre}</p>
                      <p className="text-xs text-slate-500">
                        Membresía #{pago.membresiaId} · {methodLabel(pago.metodo)} · {pago.registradoPor}
                      </p>
                    </DataTableCell>
                    <DataTableCell className="font-semibold text-slate-100">{formatCurrency(pago.monto)}</DataTableCell>
                    <DataTableCell>
                      {pago.estado === 'ANULADO' ? (
                        <div>
                          <Badge tone="red">Anulado</Badge>
                          {pago.motivoAnulacion && <p className="mt-1 max-w-[12rem] text-xs text-slate-500">{pago.motivoAnulacion}</p>}
                        </div>
                      ) : (
                        <Badge tone="emerald">Registrado</Badge>
                      )}
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      {isAdmin && pago.estado === 'REGISTRADO' && (
                        <Button variant="ghost" size="sm" onClick={() => setToAnnul(pago)}>
                          Anular
                        </Button>
                      )}
                    </DataTableCell>
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

      {toAnnul && (
        <AnnulModal
          pago={toAnnul}
          onClose={() => setToAnnul(null)}
          onDone={() => {
            setToAnnul(null)
            reload()
          }}
        />
      )}
    </Card>
  )
}

export default HistorialPagos
