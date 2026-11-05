<<<<<<< HEAD
import { useMemo, useState } from 'react'
import { getDb } from '../../mock/db.js'

export default function SociosPage() {
  const db = getDb()
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return db.socios
    return db.socios.filter(
      (s) => s.nombre.toLowerCase().includes(t) || s.dni.includes(t) || s.codigo.toLowerCase().includes(t),
    )
  }, [db.socios, q])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Clientes / Socios</h1>
          <p className="text-sm text-slate-400">Gestiona los datos, membresías y accesos de tu comunidad.</p>
        </div>
        <button className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600">+ Nuevo socio</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { l: 'Socios registrados', v: db.socios.length },
          { l: 'Membresías activas', v: db.socios.filter((s) => s.estado !== 'vencida').length },
          { l: 'Próximos vencimientos', v: db.socios.filter((s) => s.estado === 'por_vencer').length },
          { l: 'Sin membresía vigente', v: db.socios.filter((s) => s.estado === 'vencida').length },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">{c.l}</p>
            <p className="mt-1 text-xl font-semibold text-white">{c.v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
        <div className="flex gap-3 border-b border-white/5 p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar socio por DNI o nombre"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500/40 focus:outline-none"
          />
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase text-slate-500">
              <th className="px-5 py-3">Socio</th>
              <th className="px-3 py-3">DNI</th>
              <th className="px-3 py-3">Plan activo</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Última asistencia</th>
              <th className="px-3 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const plan = db.planes.find((p) => p.id === s.planId)
              const badge = s.estado === 'activa' ? 'bg-emerald-500/15 text-emerald-400' : s.estado === 'por_vencer' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
              const label = s.estado === 'activa' ? 'Activa' : s.estado === 'por_vencer' ? 'Por vencer' : 'Vencida'
              return (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-3"><p className="font-medium text-white">{s.nombre}</p><p className="text-[11px] text-slate-500">{s.codigo}</p></td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-400">{s.dni}</td>
                  <td className="px-3 py-3 text-slate-300">{plan?.nombre}</td>
                  <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] ${badge}`}>{label}</span></td>
                  <td className="px-3 py-3 text-slate-400">{s.ultimaAsistencia}</td>
                  <td className="px-3 py-3 text-xs text-blue-400">Ver · Editar · Cobrar · Check-in</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
=======
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
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
