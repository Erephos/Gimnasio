import { useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import DataState from '../../components/ui/DataState.jsx'
import SectionHeader from '../../components/ui/SectionHeader.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { getMyProfile } from '../../services/socios.js'
import SocioEditForm from '../socios/SocioEditForm.jsx'

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-200">{children || '—'}</dd>
    </div>
  )
}

function PerfilCard() {
  const { data: socio, error, loading, reload } = useAsync(getMyProfile, [])
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')

  return (
    <Card as="section" padding="none">
      <SectionHeader divided title="Mis datos" />
      <DataState loading={loading} error={error} hasData={Boolean(socio)} onRetry={reload}>
        {socio && (
          <div className="space-y-3 p-4 sm:p-6">
            {notice && <Alert tone="success" message={notice} />}
            {editing ? (
              <SocioEditForm
                socio={socio}
                onCancel={() => setEditing(false)}
                onSaved={() => {
                  setEditing(false)
                  setNotice('Datos actualizados correctamente.')
                  reload()
                }}
              />
            ) : (
              <>
                <dl className="divide-y divide-white/5">
                  <Row label="Nombre">{socio.nombreCompleto}</Row>
                  <Row label="DNI">
                    <span className="font-mono">{socio.dni}</span>
                  </Row>
                  <Row label="Correo">{socio.correo}</Row>
                  <Row label="Teléfono">{socio.telefono}</Row>
                  <Row label="Dirección">{socio.direccion}</Row>
                  <Row label="Contacto de emergencia">{socio.contactoEmergencia}</Row>
                </dl>
                <Button variant="outline" size="sm" onClick={() => { setNotice(''); setEditing(true) }}>
                  Editar mis datos
                </Button>
              </>
            )}
          </div>
        )}
      </DataState>
    </Card>
  )
}

export default PerfilCard
