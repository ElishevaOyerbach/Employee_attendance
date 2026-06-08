import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart2, Download, Search } from 'lucide-react'
import { Badge, Button, Card, DataTable, Input, Select } from '@/components/ui'
import type { Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/auth/useAuth'
import { getUsers } from '@/api/users.api'
import type { UserSummary } from '@/api/users.api'
import { getMyRangeReport, getTeamRangeReport } from '@/api/reports.api'
import type { AttendanceReportRow, RangeReportResponse } from '@/api/reports.api'
import { formatDateHe, formatDurationHe, wallClockTime } from '@/lib/datetime'
import { AttendanceStatusBadge } from '@/features/attendance/AttendanceStatusBadge'

// ─── helpers ────────────────────────────────────────────────────────────────

function currentMonthRange(): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const lastDay = new Date(y, m, 0).getDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(lastDay)}` }
}

function exportCsv(rows: AttendanceReportRow[], isManager: boolean, from: string, to: string) {
  const statusLabel: Record<string, string> = {
    Active: 'פעילה',
    Completed: 'הושלמה',
    PendingReview: 'ממתינה לבדיקה',
  }

  const headers = [
    ...(isManager ? ['שם עובד'] : []),
    'תאריך',
    'כניסה',
    'יציאה',
    'שעות עבודה',
    'הפסקות',
    'סטטוס',
  ]

  const body = rows.map((r) => [
    ...(isManager ? [r.fullName] : []),
    r.workDate,
    wallClockTime(r.clockInTime),
    r.clockOutTime ? wallClockTime(r.clockOutTime) : '',
    formatDurationHe(r.workedMinutes),
    r.breakMinutes > 0 ? formatDurationHe(r.breakMinutes) : '',
    statusLabel[r.status] ?? r.status,
  ])

  const csv = [headers, ...body]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\r\n')

  // BOM so Excel opens Hebrew correctly
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `attendance-report-${from}-${to}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── summary card ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'warning' | 'danger'
}) {
  const color =
    tone === 'danger'
      ? 'var(--danger-600)'
      : tone === 'warning'
        ? 'var(--warning-700, #92400e)'
        : 'var(--text-primary)'
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-5)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--fs-h1)', fontWeight: 'var(--fw-bold)', color, lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { user } = useAuth()
  const isManager = user?.role === 'Manager'

  const defaults = currentMonthRange()
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [users, setUsers] = useState<UserSummary[]>([])
  const [report, setReport] = useState<RangeReportResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load employee list for manager filter
  useEffect(() => {
    if (!isManager) return
    getUsers()
      .then(setUsers)
      .catch(() => {/* non-critical */})
  }, [isManager])

  const fetchReport = useCallback(async () => {
    if (!from || !to || to < from) return
    setLoading(true)
    setError(null)
    try {
      const data = isManager
        ? await getTeamRangeReport(from, to, selectedUserId ? Number(selectedUserId) : undefined)
        : await getMyRangeReport(from, to)
      setReport(data)
    } catch {
      setError('טעינת הדוח נכשלה. נסו שוב.')
    } finally {
      setLoading(false)
    }
  }, [from, to, selectedUserId, isManager])

  // Auto-fetch on mount and when filters change
  useEffect(() => { fetchReport() }, [fetchReport])

  const employeeOptions = useMemo(() => [
    { value: '', label: 'כל העובדים' },
    ...users.map((u) => ({ value: String(u.id), label: u.fullName })),
  ], [users])

  const columns = useMemo<Column<AttendanceReportRow>[]>(() => [
    ...(isManager ? [{
      key: 'name' as const,
      header: 'עובד',
      render: (r: AttendanceReportRow) => (
        <span style={{ fontWeight: 'var(--fw-medium)' }}>{r.fullName}</span>
      ),
    }] : []),
    {
      key: 'date',
      header: 'תאריך',
      render: (r) => formatDateHe(r.workDate),
    },
    {
      key: 'clockIn',
      header: 'כניסה',
      align: 'center' as const,
      render: (r) => <span className="ltr">{wallClockTime(r.clockInTime)}</span>,
    },
    {
      key: 'clockOut',
      header: 'יציאה',
      align: 'center' as const,
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
      align: 'center' as const,
      render: (r) => formatDurationHe(r.workedMinutes),
    },
    {
      key: 'breaks',
      header: 'הפסקות',
      align: 'center' as const,
      render: (r) => (r.breakMinutes > 0 ? formatDurationHe(r.breakMinutes) : '—'),
    },
    {
      key: 'status',
      header: 'סטטוס',
      align: 'center' as const,
      render: (r) => <AttendanceStatusBadge status={r.status} />,
    },
  ], [isManager])

  const canExport = !loading && !!report && report.rows.length > 0

  return (
    <>
      <PageHeader
        title="דוחות נוכחות"
        subtitle={isManager ? 'דוח נוכחות לפי תאריכים לכל הצוות' : 'דוח נוכחות אישי לפי תאריכים'}
        action={
          <Button
            variant="secondary"
            leadingIcon={<Download size={16} aria-hidden="true" />}
            disabled={!canExport}
            onClick={() => report && exportCsv(report.rows, isManager, from, to)}
          >
            ייצוא CSV
          </Button>
        }
      />

      {/* Filters */}
      <Card style={{ marginBottom: 'var(--space-5)' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: '1 1 160px', minWidth: 140 }}>
            <Input
              type="date"
              label="מתאריך"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 160px', minWidth: 140 }}>
            <Input
              type="date"
              label="עד תאריך"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          {isManager && (
            <div style={{ flex: '1 1 200px', minWidth: 160 }}>
              <Select
                label="עובד"
                value={selectedUserId}
                options={employeeOptions}
                onChange={(e) => setSelectedUserId(e.target.value)}
              />
            </div>
          )}
          <Button
            leadingIcon={<Search size={16} aria-hidden="true" />}
            loading={loading}
            onClick={fetchReport}
          >
            הצגת דוח
          </Button>
        </div>
      </Card>

      {/* Summary cards */}
      {report && !loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <SummaryCard
            label="סה״כ שעות עבודה"
            value={formatDurationHe(report.totalWorkedMinutes)}
            sub={`${report.daysWorked} ימי עבודה`}
          />
          <SummaryCard
            label="סה״כ הפסקות"
            value={formatDurationHe(report.totalBreakMinutes)}
          />
          <SummaryCard
            label="ימי עבודה"
            value={String(report.daysWorked)}
          />
          <SummaryCard
            label="משמרות פתוחות"
            value={String(report.openShiftsCount)}
            tone={report.openShiftsCount > 0 ? 'warning' : undefined}
          />
        </div>
      )}

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          rows={report?.rows ?? []}
          rowKey={(r) => `${r.userId}-${r.workDate}-${r.clockInTime}`}
          loading={loading}
          error={error}
          onRetry={fetchReport}
          emptyIcon={<BarChart2 size={40} aria-hidden="true" />}
          emptyTitle="אין נתונים לתצוגה"
          emptyDescription="שנו את טווח התאריכים או הפילטרים ולחצו על ״הצגת דוח״."
        />
      </Card>
    </>
  )
}
