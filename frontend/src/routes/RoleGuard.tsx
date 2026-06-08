import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from '@/auth/types'
import { useAuth } from '@/auth/useAuth'
import { paths } from './paths'

interface RoleGuardProps {
  /** Roles permitted to view the nested routes. */
  allow: Role[]
}

/**
 * Restricts nested routes to specific roles. Assumes it is rendered *inside*
 * <ProtectedRoute>, so the user is already authenticated here — a role miss
 * means "logged in but not allowed" → 403 (not a redirect to login).
 */
export function RoleGuard({ allow }: RoleGuardProps) {
  const { user } = useAuth()

  if (!user || !allow.includes(user.role)) {
    return <Navigate to={paths.forbidden} replace />
  }

  return <Outlet />
}
