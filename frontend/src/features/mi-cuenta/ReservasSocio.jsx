import { useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import DataState from '../../components/ui/DataState.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import SectionHeader from '../../components/ui/SectionHeader.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { errorMessage } from '../../services/api.js'
import { cancelReserva, createReserva, listClases, listMyReservas } from '../../services/clases.js'
import { formatDateTime, formatTime, nowMs } from '../../utils/dates.js'

function ReservasSocio() {
  const clases = useAsync(listClases, [])
  const reservas = useAsync(listMyReservas, [])
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(nowMs)

  const activas = (reservas.data ?? []).filter((item) => item.estado === 'RESERVADA')
  const reservedClassIds = new Set(activas.map((item) => item.claseId))

  async function run(id, action, message) {
    setBusyId(id)
    setError('')
    setNotice('')
    try {
      await action()
      setNotice(message)
      await Promise.all([clases.reload(), reservas.reload()])
      setNow(nowMs())
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card as="section" padding="none" className="lg:col-span-2">
        <SectionHeader divided title="Reservar clases" description="Necesitas una membresía vigente en la fecha de la clase." />
        {(notice || error) && (
          <div className="p-4 sm:px-6">
            {notice && <Alert tone="success" message={notice} />}
            {error && <Alert tone="error" message={error} />}
          </div>
        )}
        <DataState loading={clases.loading} error={clases.error} hasData={Boolean(clases.data)} onRetry={clases.reload}>
          {(clases.data ?? []).length === 0 ? (
            <EmptyState title="No hay clases programadas por ahora" />
          ) : (
            <ul className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
              {clases.data.map((clase) => {
                const reserved = reservedClassIds.has(clase.id)
                const started = new Date(clase.inicio).getTime() <= now
                return (
                  <li key={clase.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-white">{clase.disciplina}</p>
                      <Badge tone={clase.cuposDisponibles === 0 ? 'red' : 'emerald'}>
                        {clase.cuposDisponibles} {clase.cuposDisponibles === 1 ? 'cupo' : 'cupos'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{formatDateTime(clase.inicio)}</p>
                    <p className="text-xs text-slate-500">
                      hasta {formatTime(clase.fin)} · {clase.aula} · {clase.entrenadorNombre}
                    </p>
                    <Button
                      className="mt-3"
                      size="sm"
                      fullWidth
                      variant={reserved ? 'outline' : 'primary'}
                      disabled={reserved || started || clase.cuposDisponibles === 0 || busyId === clase.id}
                      onClick={() => run(clase.id, () => createReserva({ claseId: clase.id }), `Reservaste ${clase.disciplina}.`)}
                    >
                      {reserved ? 'Ya reservada' : clase.cuposDisponibles === 0 ? 'Sin cupos' : 'Reservar'}
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </DataState>
      </Card>

      <Card as="section" padding="none" className="lg:col-span-2">
        <SectionHeader divided title="Mis reservas" />
        <DataState loading={reservas.loading} error={reservas.error} hasData={Boolean(reservas.data)} onRetry={reservas.reload}>
          {(reservas.data ?? []).length === 0 ? (
            <EmptyState title="Todavía no tienes reservas" />
          ) : (
            <ul className="divide-y divide-white/5">
              {reservas.data.map((reserva) => {
                const canCancel = reserva.estado === 'RESERVADA' && new Date(reserva.inicio).getTime() > now
                return (
                  <li key={reserva.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
                    <div>
                      <p className="text-sm font-medium text-white">{reserva.disciplina}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(reserva.inicio)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {reserva.asistioEn ? (
                        <Badge tone="emerald">Asististe</Badge>
                      ) : (
                        <Badge tone={reserva.estado === 'RESERVADA' ? 'sky' : 'muted'}>
                          {reserva.estado === 'RESERVADA' ? 'Reservada' : 'Cancelada'}
                        </Badge>
                      )}
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!text-red-300"
                          disabled={busyId === reserva.id}
                          onClick={() => run(reserva.id, () => cancelReserva(reserva.id), 'Reserva cancelada.')}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </DataState>
      </Card>
    </div>
  )
}

export default ReservasSocio
