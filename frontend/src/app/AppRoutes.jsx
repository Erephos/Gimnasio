import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout.jsx'
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx'
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

function HomeRedirect() {
  const { user, isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? homePathFor(user.rol) : '/login'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
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

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}

export default AppRoutes
