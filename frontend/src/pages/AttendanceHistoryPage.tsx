import { useMemo, useState } from 'react'
import { History, PencilLine, AlertTriangle } from 'lucide-react'
import { Button, Card, DataTable } from '@/components/ui'
import type { Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import type { AttendanceRecord } from '@/api/attendance.api'
import { formatDateHe, formatDurationHe, wallClockTime } from '@/lib/datetime'
import { useAttendanceHistory } from '@/features/attendance/useAttendanceHistory'
import { AttendanceStatusBadge } from '@/features/attendance/AttendanceStatusBadge'
import { RequestCorrectionModal } from '@/features/corrections/RequestCorrectionModal'
import { ResolvePendingModal } from '@/features/attendance/ResolvePendingModal'

function BreakCell({ record }: { record: AttendanceRecord }) {
  if (record.breakMinutes === 0) {
    return <span style={{ color: 'var(--text-secondary)' }}>—</span>
  }
  return <span>{formatDurationHe(record.breakMinutes)}</span>
}

export function AttendanceHistoryPage() {
  const { records, loading, error, refresh } = useAttendanceHistory()
  const [correctionTarget, setCorrectionTarget] = useState<AttendanceRecord | null>(null)
  const [resolveTarget, setResolveTarget] = useState<AttendanceRecord | null>(null)

  const columns = useMemo<Column<AttendanceRecord>[]>(
    () => [
      {
        key: 'date',
        header: 'תאריך',
        render: (r) => formatDateHe(r.workDate),
        width: '160px',
      },
      {
        key: 'clockIn',
        header: 'כניסה',
        align: 'center',
        width: '90px',
        render: (r) => <span className="ltr">{wallClockTime(r.clockInTime)}</span>,
      },
      {
        key: 'clockOut',
        header: 'יציאה',
        align: 'center',
        width: '90px',
        render: (r) =>
          r.clockOutTime ? (
            <span className="ltr">{wallClockTime(r.clockOutTime)}</span>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>—</span>
          ),
      },
      {
        key: 'worked',
        header: 'שעות עבודה',
        align: 'center',
        width: '110px',
        render: (r) => formatDurationHe(r.workedMinutes),
      },
      {
        key: 'breaks',
        header: 'הפסקות',
        align: 'center',
        width: '110px',
        render: (r) => <BreakCell record={r} />,
      },
      {
        key: 'status',
        header: 'סטטוס',
        align: 'center',
        width: '140px',
        render: (r) => <AttendanceStatusBadge status={r.status} />,
      },
      {
        key: 'actions',
        header: '',
        align: 'end',
        render: (r) =>
          r.status === 'PendingReview' ? (
            <Button
              variant="primary"
              size="sm"
              leadingIcon={<AlertTriangle size={15} aria-hidden="true" />}
              onClick={() => setResolveTarget(r)}
            >
              השלמת משמרת
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<PencilLine size={15} aria-hidden="true" />}
              onClick={() => setCorrectionTarget(r)}
            >
              בקשת תיקון
            </Button>
          ),
      },
    ],
    [],
  )

  return (
    <>
      <PageHeader title="היסטוריית נוכחות" subtitle="כל המשמרות שלי, מהחדשה לישנה" />

      <Card>
        <DataTable
          columns={columns}
          rows={records}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={refresh}
          emptyIcon={<History size={40} aria-hidden="true" />}
          emptyTitle="עדיין אין משמרות"
          emptyDescription="ברגע שתתחילו לדווח נוכחות, המשמרות יופיעו כאן."
        />
      </Card>

      <RequestCorrectionModal
        open={correctionTarget !== null}
        record={correctionTarget}
        onClose={() => setCorrectionTarget(null)}
      />

      <ResolvePendingModal
        open={resolveTarget !== null}
        record={resolveTarget}
        onClose={() => setResolveTarget(null)}
        onResolved={refresh}
      />
    </>
  )
}
