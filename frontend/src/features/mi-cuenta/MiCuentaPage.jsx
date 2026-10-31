import PageHeader from '../../components/ui/PageHeader.jsx'
import { ROLES } from '../../config/roles.js'
import { useAuth } from '../auth/useAuth.js'
import CambiarPassword from './CambiarPassword.jsx'
import MembresiaCard from './MembresiaCard.jsx'
import PerfilCard from './PerfilCard.jsx'
import ReservasSocio from './ReservasSocio.jsx'

function MiCuentaPage() {
  const { user } = useAuth()

  // El personal solo administra su contraseña; el resto es información de socio.
  if (user.rol !== ROLES.SOCIO) {
    return (
      <>
        <PageHeader title="Mi cuenta" description={`Sesión iniciada como ${user.nombre}.`} />
        <CambiarPassword />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={`Hola, ${user.nombre.split(' ')[0]}`}
        description="Consulta tu membresía, reserva clases y mantén tus datos al día."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <MembresiaCard />
        <PerfilCard />
      </div>
      <ReservasSocio />
      <CambiarPassword />
    </>
  )
}

export default MiCuentaPage
