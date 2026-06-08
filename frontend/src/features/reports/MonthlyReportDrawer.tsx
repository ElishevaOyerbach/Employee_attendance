import { ChevronRight, ChevronLeft, BarChart3 } from 'lucide-react'
import { Button, Drawer, Spinner } from '@/components/ui'
import { formatDateHe, formatDurationHe } from '@/lib/datetime'
import { useMonthlyReport } from './useMonthlyReport'

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

interface MonthlyReportDrawerProps {
  open: boolean
  /** When provided: shows report for that employee (manager view). Omit for own report. */
  userId?: number
  employeeName?: string
  onClose: () => void
}

export function MonthlyReportDrawer({
  open,
  userId,
  employeeName,
  onClose,
}: MonthlyReportDrawerProps) {
  const { report, year, month, prevMonth, nextMonth, loading, error } =
    useMonthlyReport(open ? userId : undefined)

  const title = employeeName ? `דוח חודשי — ${employeeName}` : 'הדוח החודשי שלי'

  return (
    <Drawer open={open} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Month navigator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronRight size={18} aria-hidden="true" />
          </Button>
          <span style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-h3)' }}>
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronLeft size={18} aria-hidden="true" />
          </Button>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-7)' }}>
            <Spinner />
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--danger-600)', fontSize: 'var(--fs-body)', textAlign: 'center' }}>
            {error}
          </p>
        )}

        {!loading && !error && report && (
          <>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <StatCard label="ימים שעבד/ה" value={String(report.daysWorked)} />
              <StatCard label="סה״כ שעות" value={formatDurationHe(report.totalWorkedMinutes)} />
              <StatCard label="שעות נדרשות" value={formatDurationHe(report.totalExpectedMinutes)} />
              <StatCard
                label={report.netDifferenceMinutes >= 0 ? 'עודף שעות' : 'חסר שעות'}
                value={formatDurationHe(Math.abs(report.netDifferenceMinutes))}
                tone={report.netDifferenceMinutes >= 0 ? 'success' : 'danger'}
              />
            </div>

            {/* Daily breakdown */}
            {report.days.length > 0 ? (
              <div>
                <div
                  style={{
                    fontSize: 'var(--fs-caption)',
                    fontWeight: 'var(--fw-semibold)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  פירוט יומי
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {report.days.map((day) => (
                    <div
                      key={day.date}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'var(--surface-muted)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--fs-body)',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {formatDateHe(day.date)}
                      </span>
                      <span style={{ fontWeight: 'var(--fw-medium)', direction: 'ltr' }}>
                        {formatDurationHe(day.workedMinutes)}
                        {day.overtimeMinutes > 0 && (
                          <span style={{ color: 'var(--success-700)', marginRight: 'var(--space-2)', fontSize: 'var(--fs-caption)' }}>
                            +{formatDurationHe(day.overtimeMinutes)}
                          </span>
                        )}
                        {day.missingMinutes > 0 && (
                          <span style={{ color: 'var(--danger-600)', marginRight: 'var(--space-2)', fontSize: 'var(--fs-caption)' }}>
                            -{formatDurationHe(day.missingMinutes)}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  padding: 'var(--space-7) 0',
                }}
              >
                <BarChart3 size={40} aria-hidden="true" style={{ marginBottom: 'var(--space-3)', opacity: 0.4 }} />
                <p>אין נתוני נוכחות לחודש זה.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Drawer>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'success' | 'danger'
}) {
  const color =
    tone === 'success'
      ? 'var(--success-700)'
      : tone === 'danger'
        ? 'var(--danger-600)'
        : 'var(--text-primary)'
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        background: 'var(--surface-muted)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
      }}
    >
      <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)', color }}>{value}</div>
    </div>
  )
}
