import { useContext } from 'react'
import { AuthContext } from './auth-context.js'

export function useAuth() {
<<<<<<< HEAD
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
=======
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
}
