<<<<<<< HEAD
import { getDb } from '../../mock/db.js'
export default function ClasesPage() {
  const { clases, entrenadores } = getDb()
  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold text-white">Entrenadores y clases</h1><p className="text-sm text-slate-400">Agenda semanal y gestión de cupos.</p></div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.03]">
          <div className="border-b border-white/5 px-5 py-4"><h2 className="text-sm font-semibold text-white">Agenda semanal</h2></div>
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-white/5 text-[11px] uppercase text-slate-500"><th className="px-5 py-3">Clase</th><th className="px-3 py-3">Día / Hora</th><th className="px-3 py-3">Entrenador</th><th className="px-3 py-3">Cupo</th><th className="px-3 py-3">Aula</th></tr></thead>
            <tbody>
              {clases.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="px-5 py-3 font-medium text-white">{c.nombre}</td>
                  <td className="px-3 py-3 text-slate-400">{c.dia} · {c.hora}</td>
                  <td className="px-3 py-3 text-slate-300">{c.entrenador}</td>
                  <td className="px-3 py-3 text-slate-300">{c.inscritos}/{c.cupo}</td>
                  <td className="px-3 py-3 text-slate-400">{c.aula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
          <div className="border-b border-white/5 px-5 py-4"><h2 className="text-sm font-semibold text-white">Equipo</h2></div>
          <div className="space-y-3 p-4">
            {entrenadores.map((e) => (
              <div key={e.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <p className="text-sm font-medium text-white">{e.nombre}</p>
                <p className="text-xs text-slate-500">{e.especialidad}</p>
                <p className="mt-1 text-[11px] text-slate-400">{e.clases} clases activas</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
=======
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
import Modal from '../../components/ui/Modal.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import SectionHeader from '../../components/ui/SectionHeader.jsx'
import { ROLES } from '../../config/roles.js'
import { useAsync } from '../../hooks/useAsync.js'
import { errorMessage } from '../../services/api.js'
import { cancelClase, listClases } from '../../services/clases.js'
import { formatDateTime, formatTime } from '../../utils/dates.js'
import { useAuth } from '../auth/useAuth.js'
import ClaseForm from './ClaseForm.jsx'
import EntrenadoresPanel from './EntrenadoresPanel.jsx'
import ReservasModal from './ReservasModal.jsx'

function ClasesPage() {
  const { user } = useAuth()
  const isAdmin = user.rol === ROLES.ADMIN
  const { data, error, loading, reload } = useAsync(listClases, [])
  const [showForm, setShowForm] = useState(false)
  const [reservasDe, setReservasDe] = useState(null)
  const [toCancel, setToCancel] = useState(null)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const clases = data ?? []

  async function handleCancel() {
    setIsCancelling(true)
    setActionError('')
    try {
      await cancelClase(toCancel.id)
      setNotice(`La clase de ${toCancel.disciplina} fue cancelada junto con sus reservas.`)
      setToCancel(null)
      reload()
    } catch (requestError) {
      setToCancel(null)
      setActionError(errorMessage(requestError))
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <>
      <PageHeader
        layout="split"
        title="Horarios y clases"
        description={
          user.rol === ROLES.ENTRENADOR
            ? 'Consulta las próximas clases y marca la asistencia de los socios en tus clases.'
            : 'Programa clases, revisa los cupos y gestiona las reservas de los socios.'
        }
        actions={isAdmin && <Button onClick={() => setShowForm(true)}>Programar clase</Button>}
      />

      {notice && <Alert tone="success" message={notice} />}
      {actionError && <Alert tone="error" message={actionError} />}

      <Card as="section" padding="none">
        <SectionHeader divided title="Próximas clases" description="Solo se muestran clases activas que aún no terminaron." />

        <DataState loading={loading} error={error} hasData={Boolean(data)} onRetry={reload}>
          {clases.length === 0 ? (
            <EmptyState title="No hay clases programadas" description={isAdmin ? 'Programa la primera clase con el botón de arriba.' : undefined} />
          ) : (
            <div className="overflow-x-auto">
              <DataTable>
                <thead>
                  <DataTableHeaderRow>
                    <DataTableHeaderCell className="sm:px-6">Clase</DataTableHeaderCell>
                    <DataTableHeaderCell>Horario</DataTableHeaderCell>
                    <DataTableHeaderCell>Aula</DataTableHeaderCell>
                    <DataTableHeaderCell>Cupos</DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <span className="sr-only">Acciones</span>
                    </DataTableHeaderCell>
                  </DataTableHeaderRow>
                </thead>
                <DataTableBody>
                  {clases.map((clase) => (
                    <DataTableRow key={clase.id}>
                      <DataTableCell className="sm:px-6">
                        <p className="font-medium text-white">{clase.disciplina}</p>
                        <p className="text-xs text-slate-500">{clase.entrenadorNombre}</p>
                      </DataTableCell>
                      <DataTableCell className="text-slate-300">
                        <p>{formatDateTime(clase.inicio)}</p>
                        <p className="text-xs text-slate-500">hasta {formatTime(clase.fin)}</p>
                      </DataTableCell>
                      <DataTableCell className="text-slate-300">{clase.aula}</DataTableCell>
                      <DataTableCell>
                        <Badge tone={clase.cuposDisponibles === 0 ? 'red' : 'emerald'}>
                          {clase.reservasActivas}/{clase.aforo}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setReservasDe(clase)}>
                            Reservas
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="sm" className="!text-red-300" onClick={() => setToCancel(clase)}>
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          )}
        </DataState>
      </Card>

      {user.rol !== ROLES.ENTRENADOR && <EntrenadoresPanel canCreate={isAdmin} />}

      {showForm && (
        <ClaseForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            setNotice('Clase programada correctamente.')
            reload()
          }}
        />
      )}

      {reservasDe && <ReservasModal clase={reservasDe} onClose={() => setReservasDe(null)} onChanged={reload} />}

      {toCancel && (
        <Modal
          title="Cancelar clase"
          description={`${toCancel.disciplina} · ${formatDateTime(toCancel.inicio)}. Se cancelarán también las ${toCancel.reservasActivas} reservas activas.`}
          onClose={() => setToCancel(null)}
        >
          <div className="flex gap-2">
            <Button className="flex-1" loading={isCancelling} disabled={isCancelling} onClick={handleCancel}>
              Cancelar clase
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setToCancel(null)}>
              Volver
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default ClasesPage

>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
