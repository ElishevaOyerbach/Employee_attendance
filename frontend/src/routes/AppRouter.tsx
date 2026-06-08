import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/layout/AppShell'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleGuard } from './RoleGuard'
import { paths } from './paths'

import { LoginPage } from '@/pages/LoginPage'
import { MyDayPage } from '@/pages/MyDayPage'
import { AttendanceHistoryPage } from '@/pages/AttendanceHistoryPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { TeamDashboardPage } from '@/pages/TeamDashboardPage'
import { PendingReviewsPage } from '@/pages/PendingReviewsPage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path={paths.login} element={<LoginPage />} />

      {/* Authenticated area — wrapped in the app shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Employee (and Manager) */}
          <Route path={paths.myDay} element={<MyDayPage />} />
          <Route path={paths.attendance} element={<AttendanceHistoryPage />} />
          <Route path={paths.reports} element={<ReportsPage />} />

          {/* Manager-only */}
          <Route element={<RoleGuard allow={['Manager']} />}>
            <Route path={paths.team} element={<TeamDashboardPage />} />
            <Route path={paths.reviews} element={<PendingReviewsPage />} />
          </Route>

          <Route path={paths.forbidden} element={<ForbiddenPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
