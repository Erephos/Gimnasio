import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { homePathFor } from '../../config/roles.js'
import { useAuth } from '../../features/auth/useAuth.js'

// Exige sesión iniciada y, opcionalmente, uno de los roles indicados.
function ProtectedRoute({ roles }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.rol)) {
    return <Navigate to={homePathFor(user.rol)} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
