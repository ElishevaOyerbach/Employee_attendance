import { useMemo, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { Button, Card, DataTable } from '@/components/ui'
import type { Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import type { CorrectionRecord, CorrectionStatus } from '@/api/corrections.api'
import { formatDateHe } from '@/lib/datetime'
import { usePendingCorrections } from '@/features/corrections/usePendingCorrections'
import { summarizeChange, requestTypeLabel } from '@/features/corrections/corrections'
import { CorrectionStatusBadge } from '@/features/corrections/CorrectionStatusBadge'
import { ApprovalDrawer } from '@/features/corrections/ApprovalDrawer'

type Filter = CorrectionStatus | 'All'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'Pending', label: 'ממתינות' },
  { value: 'Approved', label: 'אושרו' },
  { value: 'Rejected', label: 'נדחו' },
  { value: 'All', label: 'הכל' },
]

export function PendingReviewsPage() {
  const [filter, setFilter] = useState<Filter>('Pending')
  const status = filter === 'All' ? undefined : filter
  const { items, usersById, loading, error, refresh } = usePendingCorrections(status)
  const [selected, setSelected] = useState<CorrectionRecord | null>(null)

  const nameFor = (id: number) => usersById[id] ?? `משתמש #${id}`

  const columns = useMemo<Column<CorrectionRecord>[]>(
    () => [
      {
        key: 'employee',
        header: 'עובד/ת',
        render: (c) => <strong>{usersById[c.requestedByUserId] ?? `משתמש #${c.requestedByUserId}`}</strong>,
      },
      {
        key: 'shift',
        header: 'משמרת',
        render: (c) => formatDateHe(c.requestedTime),
      },
      {
        key: 'change',
        header: 'השינוי המבוקש',
        render: (c) => summarizeChange(c),
      },
      {
        key: 'type',
        header: 'סוג',
        render: (c) => requestTypeLabel[c.requestType],
        align: 'center',
      },
      {
        key: 'created',
        header: 'נשלחה',
        render: (c) => formatDateHe(c.createdAt),
        align: 'center',
      },
      {
        key: 'status',
        header: 'סטטוס',
        render: (c) => <CorrectionStatusBadge status={c.status} />,
        align: 'center',
      },
      {
        key: 'actions',
        header: '',
        align: 'end',
        render: (c) => (
          <Button
            variant={c.status === 'Pending' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelected(c)}
          >
            {c.status === 'Pending' ? 'סקירה' : 'צפייה'}
          </Button>
        ),
      },
    ],
    // nameFor depends on usersById; recompute when the map changes.
    [usersById],
  )

  const pendingCount = filter === 'Pending' ? items.length : undefined

  return (
    <>
      <PageHeader
        title="משמרות לאישור"
        subtitle={
          pendingCount !== undefined && !loading
            ? `${pendingCount} בקשות ממתינות לאישורך`
            : 'בקשות תיקון נוכחות מהצוות'
        }
      />

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
          rows={items}
          rowKey={(c) => c.id}
          loading={loading}
          error={error}
          onRetry={refresh}
          emptyIcon={<ClipboardCheck size={40} aria-hidden="true" />}
          emptyTitle={filter === 'Pending' ? 'אין בקשות ממתינות' : 'אין בקשות להצגה'}
          emptyDescription={
            filter === 'Pending'
              ? 'כל הבקשות טופלו. עבודה יפה! 🎉'
              : 'לא נמצאו בקשות תיקון בסטטוס שנבחר.'
          }
        />
      </Card>

      <ApprovalDrawer
        open={selected !== null}
        correction={selected}
        employeeName={selected ? nameFor(selected.requestedByUserId) : ''}
        onClose={() => setSelected(null)}
        onReviewed={refresh}
      />
    </>
  )
}
