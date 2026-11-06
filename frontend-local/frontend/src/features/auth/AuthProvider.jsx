import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { login as loginRequest } from '../../services/auth.js'
import { clearSession, getSession, setSession, subscribeSession } from '../../services/session.js'
import { AuthContext } from './auth-context.js'

function AuthProvider({ children }) {
  const session = useSyncExternalStore(subscribeSession, getSession)

  const login = useCallback(async (credentials) => {
    const data = await loginRequest(credentials)
    const next = {
      token: data.token,
      usuarioId: data.usuarioId,
      nombre: data.nombre,
      rol: data.rol,
    }
    setSession(next)
    return next
  }, [])

  const value = useMemo(
    () => ({ session, user: session, isAuthenticated: Boolean(session?.token), login, logout: clearSession }),
    [session, login],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
