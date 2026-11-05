<<<<<<< HEAD
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth.js'

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />
  return <Outlet />
}
=======
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
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
