import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth.js'

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />
  return <Outlet />
}
