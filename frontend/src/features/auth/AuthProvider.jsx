import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { login as loginRequest } from '../../services/auth.js'
import { clearSession, getSession, setSession, subscribeSession } from '../../services/session.js'
import { AuthContext } from './auth-context.js'

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
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
