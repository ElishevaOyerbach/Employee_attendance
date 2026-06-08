import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { login as loginRequest } from '@/api/auth.api'
import { AUTH_LOGOUT_EVENT } from '@/api/client'
import { AuthContext } from './auth-context'
import type { AuthContextValue, AuthStatus } from './auth-context'
import { clearSession, loadSession, saveSession } from './token'
import type { AuthUser, Role } from './types'

export function AuthProvider({ children }: { children: ReactNode }) {
  // Rehydrate synchronously from storage via lazy initializers — localStorage
  // is synchronous, so there is no async loading phase and no flash of login.
  const [user, setUser] = useState<AuthUser | null>(
    () => loadSession()?.user ?? null,
  )
  const [status, setStatus] = useState<AuthStatus>(() =>
    loadSession() ? 'authenticated' : 'unauthenticated',
  )

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  // The API client fires this event on any 401 — force a logout app-wide.
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener(AUTH_LOGOUT_EVENT, handler)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginRequest({ email, password })
    const authUser: AuthUser = {
      userId: res.userId,
      fullName: res.fullName,
      role: res.role,
    }
    saveSession({
      token: res.token,
      expiresAt: res.expiresAt,
      user: authUser,
    })
    setUser(authUser)
    setStatus('authenticated')
    return authUser
  }, [])

  const hasRole = useCallback(
    (role: Role) => user?.role === role,
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated' && user !== null,
      hasRole,
      login,
      logout,
    }),
    [status, user, hasRole, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
