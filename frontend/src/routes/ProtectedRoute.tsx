import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { paths } from './paths'
import { FullScreenLoader } from '@/components/feedback/FullScreenLoader'

/**
 * Gate for authenticated areas. While the session is rehydrating we show a
 * loader (avoids a flash of the login screen on refresh); once resolved we
 * either render the nested routes or bounce to login, preserving the target
 * so we can return there after a successful login.
 */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <FullScreenLoader />
  }

  if (status === 'unauthenticated') {
    return <Navigate to={paths.login} replace state={{ from: location }} />
  }

  return <Outlet />
}
