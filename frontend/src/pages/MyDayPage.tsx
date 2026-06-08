import { useState } from 'react'
import { FileClock } from 'lucide-react'
import { Button } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/auth/useAuth'
import { useActiveShift } from '@/features/attendance/useActiveShift'
import { StatusHero } from '@/features/attendance/StatusHero'
import { MyRequestsDrawer } from '@/features/attendance/MyRequestsDrawer'

const todayLabel = new Date().toLocaleDateString('he-IL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function MyDayPage() {
  const { user } = useAuth()
  const shift = useActiveShift()
  const [requestsOpen, setRequestsOpen] = useState(false)

  const firstName = user?.fullName?.split(/\s+/)[0] ?? ''

  return (
    <>
      <PageHeader
        title={`שלום, ${firstName} 👋`}
        subtitle={todayLabel}
        action={
          <Button
            variant="secondary"
            leadingIcon={<FileClock size={16} aria-hidden="true" />}
            onClick={() => setRequestsOpen(true)}
          >
            הבקשות שלי
          </Button>
        }
      />

      <div style={{ maxWidth: 520, marginInline: 'auto' }}>
        <StatusHero
          state={shift.state}
          shift={shift.shift}
          loading={shift.loading}
          error={shift.error}
          pendingAction={shift.pendingAction}
          isActing={shift.isActing}
          act={shift.act}
          refresh={shift.refresh}
        />
      </div>

      <MyRequestsDrawer open={requestsOpen} onClose={() => setRequestsOpen(false)} />
    </>
  )
}
