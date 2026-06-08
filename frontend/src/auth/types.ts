// Mirrors the backend UserRole enum (.ToString() -> "Employee" | "Manager").
export type Role = 'Employee' | 'Manager'

/** Raw payload returned by POST /api/auth/login (see LoginResponse.cs). */
export interface LoginResponse {
  token: string
  expiresAt: string // ISO datetime
  userId: number
  fullName: string
  role: Role
}

/** The authenticated user as held in app state. */
export interface AuthUser {
  userId: number
  fullName: string
  role: Role
}

/** Persisted auth session (token + user + expiry). */
export interface AuthSession {
  token: string
  expiresAt: string
  user: AuthUser
}
