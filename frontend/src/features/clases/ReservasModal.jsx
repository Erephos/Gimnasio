import { useState } from 'react'
import SocioPicker from '../../components/shared/SocioPicker.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import DataState from '../../components/ui/DataState.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { isStaff } from '../../config/roles.js'
import { useAsync } from '../../hooks/useAsync.js'
import { errorMessage } from '../../services/api.js'
import { cancelReserva, createReserva, listReservasByClase, markReservaAsistencia } from '../../services/clases.js'
import { formatDateTime, formatTime } from '../../utils/dates.js'
import { useAuth } from '../auth/useAuth.js'

function ReservasModal({ clase, onClose, onChanged }) {
  const { user } = useAuth()
  const staff = isStaff(user.rol)
  const { data, error, loading, reload } = useAsync(() => listReservasByClase(clase.id), [clase.id])
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const reservas = data ?? []

  async function run(action, successMessage, id = null) {
    setBusyId(id)
    setActionError('')
    setNotice('')
    try {
      await action()
      setNotice(successMessage)
      await reload()
      onChanged()
    } catch (requestError) {
      setActionError(errorMessage(requestError))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Modal
      size="lg"
      title={`Reservas · ${clase.disciplina}`}
      description={`${formatDateTime(clase.inicio)} a ${formatTime(clase.fin)} · ${clase.aula} · ${clase.entrenadorNombre}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        {notice && <Alert tone="success" message={notice} />}
        {actionError && <Alert tone="error" message={actionError} />}

        <DataState loading={loading} error={error} hasData={Boolean(data)} onRetry={reload}>
          {reservas.length === 0 ? (
            <EmptyState title="Esta clase aún no tiene reservas activas" />
          ) : (
            <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
              {reservas.map((reserva) => (
                <li key={reserva.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-white">{reserva.socioNombre}</p>
                    <p className="text-xs text-slate-500">Reservó el {formatDateTime(reserva.creadaEn)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {reserva.asistioEn ? (
                      <Badge tone="emerald">Asistió {formatTime(reserva.asistioEn)}</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === reserva.id}
                        onClick={() => run(() => markReservaAsistencia(reserva.id), `Asistencia de ${reserva.socioNombre} registrada.`, reserva.id)}
                      >
                        Marcar asistencia
                      </Button>
                    )}
                    {staff && !reserva.asistioEn && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!text-red-300"
                        disabled={busyId === reserva.id}
                        onClick={() => run(() => cancelReserva(reserva.id), 'Reserva cancelada.', reserva.id)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DataState>

        {staff && (
          <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-4">
            {showAdd ? (
              <SocioPicker
                id="reserva-socio"
                label="Reservar para un socio"
                onPick={(socio) => {
                  setShowAdd(false)
                  run(() => createReserva({ claseId: clase.id, socioId: socio.id }), `Reserva creada para ${socio.nombreCompleto}.`)
                }}
              />
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
                Reservar para un socio
              </Button>
            )}
          </div>
        )}

        <Button variant="outline" fullWidth onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  )
}

export default ReservasModal
