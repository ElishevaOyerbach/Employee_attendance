import { useMemo, useState } from 'react'
import { Users, UserPlus, BarChart3, UserX } from 'lucide-react'
import { Badge, Button, Card, DataTable } from '@/components/ui'
import type { Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import type { UserSummary } from '@/api/users.api'
import { useTeamUsers } from '@/features/users/useTeamUsers'
import { CreateEmployeeModal } from '@/features/users/CreateEmployeeModal'
import { MonthlyReportDrawer } from '@/features/reports/MonthlyReportDrawer'
import { formatDateHe } from '@/lib/datetime'

type Filter = 'all' | 'active' | 'inactive'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'active', label: 'פעילים' },
  { value: 'inactive', label: 'מושבתים' },
  { value: 'all', label: 'הכל' },
]

export function TeamDashboardPage() {
  const { users, loading, error, refresh, deactivate } = useTeamUsers()
  const [filter, setFilter] = useState<Filter>('active')
  const [createOpen, setCreateOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<UserSummary | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState<UserSummary | null>(null)

  const filtered = useMemo(() => {
    if (filter === 'active') return users.filter((u) => u.isActive)
    if (filter === 'inactive') return users.filter((u) => !u.isActive)
    return users
  }, [users, filter])

  const activeCount = users.filter((u) => u.isActive).length
  const managerCount = users.filter((u) => u.role === 'Manager' && u.isActive).length

  const columns = useMemo<Column<UserSummary>[]>(
    () => [
      {
        key: 'name',
        header: 'שם',
        render: (u) => (
          <div>
            <div style={{ fontWeight: 'var(--fw-semibold)' }}>{u.fullName}</div>
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
              {u.email}
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'תפקיד',
        align: 'center',
        render: (u) => (
          <Badge tone={u.role === 'Manager' ? 'accent' : 'neutral'}>
            {u.role === 'Manager' ? 'מנהל/ת' : 'עובד/ת'}
          </Badge>
        ),
      },
      {
        key: 'hours',
        header: 'שעות יומיות',
        align: 'center',
        render: (u) => (
          <span className="ltr">{u.expectedDailyHours} שע׳</span>
        ),
      },
      {
        key: 'status',
        header: 'סטטוס',
        align: 'center',
        render: (u) => (
          <Badge tone={u.isActive ? 'success' : 'neutral'} dot>
            {u.isActive ? 'פעיל/ה' : 'מושבת/ת'}
          </Badge>
        ),
      },
      {
        key: 'createdAt',
        header: 'נוצר/ה',
        align: 'center',
        render: (u) => formatDateHe(u.createdAt),
      },
      {
        key: 'actions',
        header: '',
        align: 'end',
        render: (u) => (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<BarChart3 size={15} aria-hidden="true" />}
              onClick={() => setReportTarget(u)}
            >
              דוח
            </Button>
            {u.isActive && (
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<UserX size={15} aria-hidden="true" />}
                onClick={() => setConfirmDeactivate(u)}
              >
                השבתה
              </Button>
            )}
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <>
      <PageHeader
        title="לוח צוות"
        subtitle="ניהול עובדים וצפייה בדוחות"
        action={
          <Button
            leadingIcon={<UserPlus size={16} aria-hidden="true" />}
            onClick={() => setCreateOpen(true)}
          >
            הוספת עובד/ת
          </Button>
        }
      />

      {/* Summary stats */}
      {!loading && !error && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <SummaryCard
            icon={<Users size={20} aria-hidden="true" />}
            label="עובדים פעילים"
            value={activeCount}
          />
          <SummaryCard
            icon={<Users size={20} aria-hidden="true" />}
            label="מנהלים פעילים"
            value={managerCount}
          />
          <SummaryCard
            icon={<Users size={20} aria-hidden="true" />}
            label="סה״כ עובדים"
            value={users.length}
          />
        </div>
      )}

      {/* Filter tabs */}
      <div className="segmented" role="tablist" aria-label="סינון לפי סטטוס">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            className={`segmented__btn${filter === f.value ? ' segmented__btn--active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(u) => u.id}
          loading={loading}
          error={error}
          onRetry={refresh}
          emptyIcon={<Users size={40} aria-hidden="true" />}
          emptyTitle="אין עובדים להצגה"
          emptyDescription={
            filter === 'active'
              ? 'לא נמצאו עובדים פעילים. לחצו על ״הוספת עובד/ת״ כדי להתחיל.'
              : 'לא נמצאו עובדים בסטטוס שנבחר.'
          }
        />
      </Card>

      <CreateEmployeeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refresh}
      />

      <MonthlyReportDrawer
        open={reportTarget !== null}
        userId={reportTarget?.id}
        employeeName={reportTarget?.fullName}
        onClose={() => setReportTarget(null)}
      />

      {/* Deactivate confirmation modal */}
      {confirmDeactivate && (
        <DeactivateConfirm
          user={confirmDeactivate}
          onConfirm={async () => {
            await deactivate(confirmDeactivate.id, confirmDeactivate.fullName)
            setConfirmDeactivate(null)
          }}
          onCancel={() => setConfirmDeactivate(null)}
        />
      )}
    </>
  )
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-50)',
          color: 'var(--accent-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 'var(--fs-h1)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
          {label}
        </div>
      </div>
    </div>
  )
}

function DeactivateConfirm({
  user,
  onConfirm,
  onCancel,
}: {
  user: UserSummary
  onConfirm: () => void
  onCancel: () => void
}) {
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    setBusy(true)
    await onConfirm()
    setBusy(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)' as unknown as number,
        background: 'rgba(15,23,42,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-5)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          maxWidth: 400,
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-2)' }}>
            השבתת {user.fullName}
          </h3>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>
            לאחר ההשבתה {user.fullName} לא יוכל/תוכל להתחבר למערכת. הפעולה הפיכה על ידי יצירת
            משתמש חדש.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            ביטול
          </Button>
          <Button variant="danger" loading={busy} disabled={busy} onClick={handleConfirm}>
            השבתה
          </Button>
        </div>
      </div>
    </div>
  )
}
