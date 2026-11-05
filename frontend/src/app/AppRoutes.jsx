import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout.jsx'
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx'
<<<<<<< HEAD
import { ROLES, STAFF, homePathFor } from '../config/roles.js'
import { useAuth } from '../features/auth/useAuth.js'
import LoginPage from '../features/auth/LoginPage.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import SociosPage from '../features/socios/SociosPage.jsx'
import PlanesPage from '../features/planes/PlanesPage.jsx'
import CajaPage from '../features/caja/CajaPage.jsx'
import AsistenciaPage from '../features/asistencia/AsistenciaPage.jsx'
import ClasesPage from '../features/clases/ClasesPage.jsx'
import AlertasPage from '../features/alertas/AlertasPage.jsx'
import ReportesPage from '../features/reportes/ReportesPage.jsx'
import AdminPage from '../features/admin/AdminPage.jsx'
import MiCuentaPage from '../features/mi-cuenta/MiCuentaPage.jsx'
=======
import { ROLES, STAFF_ROLES, homePathFor } from '../config/roles.js'
import AdministracionPage from '../features/administracion/AdministracionPage.jsx'
import { useAuth } from '../features/auth/useAuth.js'
import LoginPage from '../features/auth/LoginPage.jsx'
import ResetPasswordPage from '../features/auth/ResetPasswordPage.jsx'
import ClasesPage from '../features/clases/ClasesPage.jsx'
import IngresosPage from '../features/ingresos/IngresosPage.jsx'
import MembresiasPage from '../features/membresias/MembresiasPage.jsx'
import MiCuentaPage from '../features/mi-cuenta/MiCuentaPage.jsx'
import PagosPage from '../features/pagos/PagosPage.jsx'
import ReportesPage from '../features/reportes/ReportesPage.jsx'
import SociosPage from '../features/socios/SociosPage.jsx'
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85

function HomeRedirect() {
  const { user, isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? homePathFor(user.rol) : '/login'} replace />
}

<<<<<<< HEAD
function RoleGate({ roles, children }) {
  const { user } = useAuth()
  if (roles && !roles.includes(user.rol)) return <Navigate to={homePathFor(user.rol)} replace />
  return children
}

export default function AppRoutes() {
=======
function AppRoutes() {
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
<<<<<<< HEAD
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<RoleGate roles={STAFF}><DashboardPage /></RoleGate>} />
          <Route path="/socios" element={<RoleGate roles={STAFF}><SociosPage /></RoleGate>} />
          <Route path="/planes" element={<RoleGate roles={STAFF}><PlanesPage /></RoleGate>} />
          <Route path="/caja" element={<RoleGate roles={STAFF}><CajaPage /></RoleGate>} />
          <Route path="/asistencia" element={<RoleGate roles={STAFF}><AsistenciaPage /></RoleGate>} />
          <Route path="/clases" element={<RoleGate roles={[...STAFF, ROLES.ENTRENADOR]}><ClasesPage /></RoleGate>} />
          <Route path="/alertas" element={<RoleGate roles={STAFF}><AlertasPage /></RoleGate>} />
          <Route path="/reportes" element={<RoleGate roles={STAFF}><ReportesPage /></RoleGate>} />
          <Route path="/admin" element={<RoleGate roles={[ROLES.ADMIN]}><AdminPage /></RoleGate>} />
          <Route path="/mi-cuenta" element={<MiCuentaPage />} />
        </Route>
      </Route>
=======
      <Route path="/restablecer" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<ProtectedRoute roles={STAFF_ROLES} />}>
            <Route path="/socios" element={<SociosPage />} />
            <Route path="/membresias" element={<MembresiasPage />} />
            <Route path="/pagos" element={<PagosPage />} />
            <Route path="/ingresos" element={<IngresosPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={[...STAFF_ROLES, ROLES.ENTRENADOR]} />}>
            <Route path="/horarios" element={<ClasesPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
            <Route path="/administracion" element={<AdministracionPage />} />
          </Route>

          <Route path="/mi-cuenta" element={<MiCuentaPage />} />
        </Route>
      </Route>

>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
<<<<<<< HEAD
=======

export default AppRoutes
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
