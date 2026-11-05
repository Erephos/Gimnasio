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
import { PAGE_SIZE } from '../../config/constants.js'
import { ROLE_LABELS, ROLES } from '../../config/roles.js'
import { useAsync } from '../../hooks/useAsync.js'
import { errorMessage } from '../../services/api.js'
import { changeUsuarioRol, createUsuario, listUsuarios, setUsuarioActivo } from '../../services/usuarios.js'
import {
  compactErrors,
  normalizeEmail,
  validateEmail,
  validateName,
  validatePassword,
} from '../../utils/validators.js'
import { useAuth } from '../auth/useAuth.js'

const STAFF_OPTIONS = [ROLES.RECEPCION, ROLES.ADMIN]
const FILTERS = [ROLES.ADMIN, ROLES.RECEPCION, ROLES.ENTRENADOR, ROLES.SOCIO]

function UsuarioForm({ onClose, onSaved }) {
  const [draft, setDraft] = useState({ nombre: '', apellido: '', correo: '', password: '', rol: ROLES.RECEPCION })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setDraft((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = compactErrors({
      nombre: validateName(draft.nombre),
      apellido: validateName(draft.apellido, 'El apellido'),
      correo: validateEmail(draft.correo),
      password: validatePassword(draft.password),
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    setFormError('')
    try {
      await createUsuario({
        nombre: draft.nombre.trim(),
        apellido: draft.apellido.trim(),
        correo: normalizeEmail(draft.correo),
        password: draft.password,
        rol: draft.rol,
      })
      onSaved()
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const field = (name, label, props = {}) => (
    <Field id={`usr-${name}`} label={label} error={errors[name]}>
      <Input id={`usr-${name}`} name={name} value={draft[name]} onChange={handleChange} invalid={Boolean(errors[name])} {...props} />
    </Field>
  )

  return (
    <Modal title="Nueva cuenta de personal" description="Para entrenadores usa la sección Horarios y clases." onClose={onClose}>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        {formError && <Alert tone="error" message={formError} />}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('nombre', 'Nombre')}
          {field('apellido', 'Apellido')}
        </div>
        {field('correo', 'Correo electrónico', { type: 'email' })}
        {field('password', 'Contraseña inicial', { type: 'password', autoComplete: 'new-password' })}
        <Field id="usr-rol" label="Rol">
          <Select id="usr-rol" name="rol" value={draft.rol} onChange={handleChange}>
            {STAFF_OPTIONS.map((rol) => (
              <option key={rol} value={rol}>
                {ROLE_LABELS[rol]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" loading={isSaving} disabled={isSaving}>
            Crear cuenta
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function UsuariosPanel() {
  const { user } = useAuth()
  const [rol, setRol] = useState('')
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const { data, error, loading, reload } = useAsync(() => listUsuarios({ rol, page, size: PAGE_SIZE }), [rol, page])
  const usuarios = data?.content ?? []

  async function run(action, message) {
    setActionError('')
    setNotice('')
    try {
      await action()
      setNotice(message)
      reload()
    } catch (requestError) {
      setActionError(errorMessage(requestError))
    }
  }

  return (
    <Card as="section" padding="none">
      <SectionHeader
        divided
        title="Cuentas de usuario"
        description="Solo se puede cambiar el rol de administradores y recepcionistas."
        action={<Button size="sm" onClick={() => setShowForm(true)}>Nueva cuenta</Button>}
      />

      <div className="space-y-3 border-b border-white/10 p-4 sm:px-6">
        <Select aria-label="Filtrar por rol" value={rol} onChange={(event) => { setRol(event.target.value); setPage(0) }} className="sm:max-w-[14rem]">
          <option value="">Todos los roles</option>
          {FILTERS.map((item) => (
            <option key={item} value={item}>
              {ROLE_LABELS[item]}
            </option>
          ))}
        </Select>
        {notice && <Alert tone="success" message={notice} />}
        {actionError && <Alert tone="error" message={actionError} />}
      </div>

      <DataState loading={loading} error={error} hasData={Boolean(data)} onRetry={reload}>
        {usuarios.length === 0 ? (
          <EmptyState title="No hay cuentas con ese filtro" />
        ) : (
          <div className="overflow-x-auto">
            <DataTable>
              <thead>
                <DataTableHeaderRow>
                  <DataTableHeaderCell className="sm:px-6">Usuario</DataTableHeaderCell>
                  <DataTableHeaderCell>Rol</DataTableHeaderCell>
                  <DataTableHeaderCell>Estado</DataTableHeaderCell>
                  <DataTableHeaderCell>
                    <span className="sr-only">Acciones</span>
                  </DataTableHeaderCell>
                </DataTableHeaderRow>
              </thead>
              <DataTableBody>
                {usuarios.map((item) => {
                  const isSelf = item.id === user.usuarioId
                  const canChangeRole = !isSelf && STAFF_OPTIONS.includes(item.rol)
                  const nextRole = item.rol === ROLES.ADMIN ? ROLES.RECEPCION : ROLES.ADMIN
                  return (
                    <DataTableRow key={item.id}>
                      <DataTableCell className="sm:px-6">
                        <p className="font-medium text-white">
                          {item.nombre} {item.apellido}
                          {isSelf && <span className="ml-2 text-xs text-slate-500">(tú)</span>}
                        </p>
                        <p className="text-xs text-slate-500">{item.correo}</p>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge tone="sky">{ROLE_LABELS[item.rol] ?? item.rol}</Badge>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge tone={item.activo ? 'emerald' : 'red'}>{item.activo ? 'Activa' : 'Inactiva'}</Badge>
                      </DataTableCell>
                      <DataTableCell className="text-right">
                        {!isSelf && (
                          <div className="flex flex-wrap justify-end gap-1">
                            {canChangeRole && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => run(() => changeUsuarioRol(item.id, nextRole), `${item.nombre} ahora es ${ROLE_LABELS[nextRole]}.`)}
                              >
                                Pasar a {ROLE_LABELS[nextRole]}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => run(() => setUsuarioActivo(item.id, !item.activo), item.activo ? 'Cuenta desactivada.' : 'Cuenta activada.')}
                            >
                              {item.activo ? 'Desactivar' : 'Activar'}
                            </Button>
                          </div>
                        )}
                      </DataTableCell>
                    </DataTableRow>
                  )
                })}
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

      {showForm && (
        <UsuarioForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            setNotice('Cuenta creada correctamente.')
            reload()
          }}
        />
      )}
    </Card>
  )
}

export default UsuariosPanel
