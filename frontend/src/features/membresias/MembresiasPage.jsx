import PageHeader from '../../components/ui/PageHeader.jsx'
import AlertasVencimiento from './AlertasVencimiento.jsx'
import PlanesPanel from './PlanesPanel.jsx'

function MembresiasPage() {
  return (
    <>
      <PageHeader
        title="Planes y membresías"
        description="Consulta los planes del gimnasio y revisa qué membresías están vencidas o por vencer. Las membresías se asignan desde la ficha de cada socio."
      />
      <PlanesPanel />
      <AlertasVencimiento />
    </>
  )
}

export default MembresiasPage
