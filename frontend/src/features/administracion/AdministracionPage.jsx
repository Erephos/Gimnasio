import PageHeader from '../../components/ui/PageHeader.jsx'
import AuditoriaPanel from './AuditoriaPanel.jsx'
import UsuariosPanel from './UsuariosPanel.jsx'

function AdministracionPage() {
  return (
    <>
      <PageHeader
        title="Administración"
        description="Gestiona las cuentas del personal y revisa el registro de actividad del sistema."
      />
      <UsuariosPanel />
      <AuditoriaPanel />
    </>
  )
}

export default AdministracionPage
