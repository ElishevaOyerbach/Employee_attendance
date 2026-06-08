import type { AuthSession } from './types'

// localStorage key for the persisted session. Bump the suffix to invalidate
// older shapes if the session schema ever changes.
const STORAGE_KEY = 'attendance.auth.v1'

/** Read the persisted session, or null if absent/corrupt/expired. */
export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const session = JSON.parse(raw) as AuthSession
    if (!session?.token || !session.expiresAt) return null

    // Discard expired sessions up front so guards don't trust stale tokens.
    if (isExpired(session.expiresAt)) {
      clearSession()
      return null
    }
    return session
  } catch {
    clearSession()
    return null
  }
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/** The bare token, for the request interceptor. */
export function getToken(): string | null {
  return loadSession()?.token ?? null
}

export function isExpired(expiresAt: string): boolean {
  const ts = Date.parse(expiresAt)
  if (Number.isNaN(ts)) return true
  return ts <= Date.now()
}
