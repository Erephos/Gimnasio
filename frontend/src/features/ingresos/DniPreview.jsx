import InfoBox from '../../components/ui/InfoBox.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { ApiError } from '../../services/api.js'
import { getMembresiaVigenteBySocio } from '../../services/membresias.js'
import { listSocios } from '../../services/socios.js'
import { formatDate } from '../../utils/dates.js'
import { validateDni } from '../../utils/validators.js'

// Consulta al socio y su membresía mientras se escribe el DNI.
async function lookup(dni) {
  const page = await listSocios({ q: dni, size: 5 })
  const socio = page.content.find((item) => item.dni === dni)
  if (!socio) return { socio: null }
  if (!socio.activo) return { socio, membresia: null }

  try {
    return { socio, membresia: await getMembresiaVigenteBySocio(socio.id) }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { socio, membresia: null }
    throw error
  }
}

function DniPreview({ dni }) {
  const debounced = useDebouncedValue(dni.trim(), 300)
  const ready = !validateDni(debounced)
  const { data, loading, error } = useAsync(() => (ready ? lookup(debounced) : Promise.resolve(null)), [debounced, ready])

  if (!dni.trim()) {
    return <InfoBox label="Validación en tiempo real">Escribe el DNI para ver el estado del socio antes de registrar el ingreso.</InfoBox>
  }

  if (validateDni(dni.trim())) {
    return <InfoBox tone="warning" label="Validación en tiempo real">El DNI debe tener 8 dígitos numéricos para poder consultar al socio.</InfoBox>
  }

  if (error) {
    return <InfoBox tone="warning" label="No se pudo consultar">{error}</InfoBox>
  }

  if (loading || !data || debounced !== dni.trim()) {
    return <InfoBox label="Consultando">Buscando al socio…</InfoBox>
  }

  const { socio, membresia } = data

  if (!socio) {
    return (
      <InfoBox tone="error" label="Sin coincidencias · 404">
        No existe un socio con el DNI “{debounced}”. Regístralo primero en la sección de socios.
      </InfoBox>
    )
  }

  if (!socio.activo) {
    return (
      <InfoBox tone="error" label="Acceso denegado">
        {socio.nombreCompleto} está dado de baja, por lo que no puede ingresar al gimnasio.
      </InfoBox>
    )
  }

  if (!membresia) {
    return (
      <InfoBox tone="warning" label="Acceso denegado">
        {socio.nombreCompleto} no tiene una membresía vigente. Debe adquirir o renovar un plan.
      </InfoBox>
    )
  }

  return (
    <InfoBox tone="success" label="Puede ingresar">
      <span className="font-semibold">{socio.nombreCompleto}</span> · Plan {membresia.planNombre} hasta el {formatDate(membresia.fechaFin)}.
    </InfoBox>
  )
}

export default DniPreview
