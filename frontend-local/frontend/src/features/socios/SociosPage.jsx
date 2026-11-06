import { useState } from 'react'
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
import Input from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import Select from '../../components/ui/Select.jsx'
import { PAGE_SIZE } from '../../config/constants.js'
import { useAsync } from '../../hooks/useAsync.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { createSocio, listSocios } from '../../services/socios.js'
import RegisterForm from '../auth/RegisterForm.jsx'
import SocioDetail from './SocioDetail.jsx'

function SociosPage() {
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const debouncedQuery = useDebouncedValue(query)

  const { data, error, loading, reload } = useAsync(
    () => listSocios({ q: debouncedQuery.trim(), activo: estado, page, size: PAGE_SIZE }),
    [debouncedQuery, estado, page],
  )

  const socios = data?.content ?? []

  return (
    <>
      <PageHeader
        layout="split"
        title="Socios"
        description="Busca socios por nombre, DNI o correo, consulta su membresía, actualiza sus datos y registra nuevas altas."
        actions={<Button onClick={() => setShowCreate(true)}>Registrar socio</Button>}
      />

      <Card as="section" padding="none">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:p-6">
          <Input
            type="search"
            aria-label="Buscar socios"
            placeholder="Buscar por nombre, DNI o correo"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(0)
            }}
            className="sm:max-w-sm"
          />
          <Select
            aria-label="Filtrar por estado"
            value={estado}
            onChange={(event) => {
              setEstado(event.target.value)
              setPage(0)
            }}
            className="sm:max-w-[12rem]"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Dados de baja</option>
          </Select>
        </div>

        <DataState loading={loading} error={error} hasData={Boolean(data)} onRetry={reload}>
          {socios.length === 0 ? (
            <EmptyState
              title="No se encontraron socios"
              description="Prueba con otro nombre, DNI o correo, o registra un nuevo socio."
            />
          ) : (
            <div className="overflow-x-auto">
              <DataTable>
                <thead>
                  <DataTableHeaderRow>
                    <DataTableHeaderCell className="sm:px-6">Socio</DataTableHeaderCell>
                    <DataTableHeaderCell>DNI</DataTableHeaderCell>
                    <DataTableHeaderCell>Correo</DataTableHeaderCell>
                    <DataTableHeaderCell>Estado</DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <span className="sr-only">Acciones</span>
                    </DataTableHeaderCell>
                  </DataTableHeaderRow>
                </thead>
                <DataTableBody>
                  {socios.map((socio) => (
                    <DataTableRow key={socio.id}>
                      <DataTableCell className="font-medium text-white sm:px-6">{socio.nombreCompleto}</DataTableCell>
                      <DataTableCell className="font-mono text-xs text-slate-400">{socio.dni}</DataTableCell>
                      <DataTableCell className="text-slate-400">{socio.correo}</DataTableCell>
                      <DataTableCell>
                        <Badge tone={socio.activo ? 'emerald' : 'red'}>{socio.activo ? 'Activo' : 'Dado de baja'}</Badge>
                      </DataTableCell>
                      <DataTableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedId(socio.id)}>
                          Ver ficha
                        </Button>
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
            <Pagination
              page={data.number}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onChange={setPage}
            />
          </div>
        )}
      </Card>

      {showCreate && (
        <Modal
          size="lg"
          title="Registrar socio"
          description="Crea la cuenta del socio. Podrá iniciar sesión con el correo y la contraseña que definas."
          onClose={() => setShowCreate(false)}
        >
          <RegisterForm
            submit={createSocio}
            submitLabel="Registrar socio"
            onRegistered={(socio) => {
              setShowCreate(false)
              setSelectedId(socio.id)
              reload()
            }}
          />
          <Button variant="ghostMuted" fullWidth className="mt-3" onClick={() => setShowCreate(false)}>
            Cancelar
          </Button>
        </Modal>
      )}

      {selectedId && (
        <SocioDetail socioId={selectedId} onClose={() => setSelectedId(null)} onChanged={reload} />
      )}
    </>
  )
}

export default SociosPage
