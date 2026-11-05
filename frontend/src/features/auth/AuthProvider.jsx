import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { login as loginRequest } from '../../services/auth.js'
import { clearSession, getSession, setSession, subscribeSession } from '../../services/session.js'
import { AuthContext } from './auth-context.js'

<<<<<<< HEAD
export default function AuthProvider({ children }) {
  // getSession ahora cachea la referencia → no hay bucle de re-renders
  const session = useSyncExternalStore(subscribeSession, getSession, getSession)

  const login = useCallback(async (credentials) => {
    const data = await loginRequest(credentials)
    setSession(data)
    return data
  }, [])

  const logout = useCallback(() => {
    clearSession()
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [session, login, logout],
=======
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
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
<<<<<<< HEAD
=======

export default AuthProvider
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
