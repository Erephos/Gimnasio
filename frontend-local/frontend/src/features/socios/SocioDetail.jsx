import { useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import DataState from '../../components/ui/DataState.jsx'
import InfoBox from '../../components/ui/InfoBox.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { ROLES } from '../../config/roles.js'
import { GENEROS } from '../../config/constants.js'
import { useAsync } from '../../hooks/useAsync.js'
import { deactivateSocio, getSocio } from '../../services/socios.js'
import { errorMessage } from '../../services/api.js'
import { listMembresiasBySocio } from '../../services/membresias.js'
import { formatCurrency } from '../../utils/format.js'
import { formatDate, isMembershipCurrent, todayLima } from '../../utils/dates.js'
import { useAuth } from '../auth/useAuth.js'
import AsignarMembresia from './AsignarMembresia.jsx'
import SocioEditForm from './SocioEditForm.jsx'

const genderLabel = (value) => GENEROS.find((option) => option.value === value)?.label ?? '—'

function DataRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-200">{children || '—'}</dd>
    </div>
  )
}

function SocioDetail({ socioId, onClose, onChanged }) {
  const { user } = useAuth()
  const isAdmin = user.rol === ROLES.ADMIN
  const [editing, setEditing] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const [isDeactivating, setIsDeactivating] = useState(false)

  const perfil = useAsync(() => getSocio(socioId), [socioId])
  const membresias = useAsync(() => listMembresiasBySocio(socioId), [socioId])

  const socio = perfil.data
  const history = membresias.data ?? []
  const today = todayLima()
  const current = history.find((item) => isMembershipCurrent(item, today))

  async function handleDeactivate() {
    setIsDeactivating(true)
    setActionError('')
    try {
      await deactivateSocio(socioId)
      setConfirmDeactivate(false)
      setNotice('El socio fue dado de baja. Su historial se conserva.')
      await perfil.reload()
      onChanged()
    } catch (error) {
      setConfirmDeactivate(false)
      setActionError(errorMessage(error))
    } finally {
      setIsDeactivating(false)
    }
  }

  return (
    <>
      <Modal size="lg" title={socio ? socio.nombreCompleto : 'Ficha del socio'} onClose={onClose}>
        <DataState loading={perfil.loading} error={perfil.error} hasData={Boolean(socio)} onRetry={perfil.reload}>
          {socio && (
            <div className="space-y-6">
              {notice && <Alert tone="success" message={notice} />}
              {actionError && <Alert tone="error" message={actionError} />}

              <section>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">Datos personales</h3>
                  <Badge tone={socio.activo ? 'emerald' : 'red'}>{socio.activo ? 'Activo' : 'Dado de baja'}</Badge>
                </div>
                {editing ? (
                  <SocioEditForm
                    socio={socio}
                    canEditDni={isAdmin}
                    onCancel={() => setEditing(false)}
                    onSaved={() => {
                      setEditing(false)
                      setNotice('Datos actualizados correctamente.')
                      perfil.reload()
                      onChanged()
                    }}
                  />
                ) : (
                  <>
                    <dl className="divide-y divide-white/5">
                      <DataRow label="DNI">
                        <span className="font-mono">{socio.dni}</span>
                      </DataRow>
                      <DataRow label="Correo">{socio.correo}</DataRow>
                      <DataRow label="Teléfono">{socio.telefono}</DataRow>
                      <DataRow label="Género">{genderLabel(socio.genero)}</DataRow>
                      <DataRow label="Dirección">{socio.direccion}</DataRow>
                      <DataRow label="Contacto de emergencia">{socio.contactoEmergencia}</DataRow>
                      <DataRow label="Registrado el">{formatDate(socio.creadoEn)}</DataRow>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                        Editar datos
                      </Button>
                      {isAdmin && socio.activo && (
                        <Button variant="outline" size="sm" className="!text-red-300" onClick={() => setConfirmDeactivate(true)}>
                          Dar de baja
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-white">Membresía</h3>
                <DataState loading={membresias.loading} error={membresias.error} hasData={Boolean(membresias.data)} onRetry={membresias.reload}>
                  {current ? (
                    <InfoBox tone="success" label="Vigente">
                      Plan {current.planNombre} hasta el {formatDate(current.fechaFin)} (el último día de acceso es el
                      anterior). Precio: {formatCurrency(current.precioPagado)}.
                    </InfoBox>
                  ) : (
                    <InfoBox tone="warning" label="Sin membresía vigente">
                      {history.length === 0
                        ? 'Este socio aún no tiene membresías registradas.'
                        : 'La última membresía de este socio ya venció.'}
                    </InfoBox>
                  )}

                  {history.length > 0 && (
                    <ul className="mt-3 divide-y divide-white/5 rounded-lg border border-white/10">
                      {history.map((item) => (
                        <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                          <span className="font-medium text-slate-200">{item.planNombre}</span>
                          <span className="text-slate-400">
                            {formatDate(item.fechaInicio)} → {formatDate(item.fechaFin)}
                          </span>
                          <span className="text-slate-400">{formatCurrency(item.precioPagado)}</span>
                          <Badge tone={isMembershipCurrent(item, today) ? 'emerald' : 'muted'}>
                            {isMembershipCurrent(item, today) ? 'Vigente' : 'No vigente'}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </DataState>

                {socio.activo && (
                  <AsignarMembresia
                    socioId={socio.id}
                    onAssigned={() => {
                      setNotice('Membresía asignada. Registra el pago desde la pantalla de pagos.')
                      membresias.reload()
                      onChanged()
                    }}
                  />
                )}
              </section>

              <Button variant="outline" fullWidth onClick={onClose}>
                Cerrar
              </Button>
            </div>
          )}
        </DataState>
      </Modal>

      {confirmDeactivate && (
        <Modal
          title="Dar de baja al socio"
          description="El socio no podrá iniciar sesión ni ingresar al gimnasio. Su historial de pagos y asistencias se conserva."
          onClose={() => setConfirmDeactivate(false)}
        >
          <div className="flex gap-2">
            <Button className="flex-1" loading={isDeactivating} disabled={isDeactivating} onClick={handleDeactivate}>
              Confirmar baja
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDeactivate(false)}>
              Cancelar
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default SocioDetail
