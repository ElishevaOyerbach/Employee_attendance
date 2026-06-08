import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Input, Modal, Textarea } from '@/components/ui'
import type { ApiError } from '@/api/client'
import type { AttendanceRecord } from '@/api/attendance.api'
import { resolvePendingReview } from '@/api/attendance.api'
import { useToast } from '@/components/feedback/useToast'
import { formatDateHe, fromDateTimeLocal, toDateTimeLocal, wallClockTime } from '@/lib/datetime'

interface ResolvePendingModalProps {
  open: boolean
  record: AttendanceRecord | null
  onClose: () => void
  onResolved: () => void
}

const FORM_ID = 'resolve-pending-form'

export function ResolvePendingModal({
  open,
  record,
  onClose,
  onResolved,
}: ResolvePendingModalProps) {
  return (
    <Modal open={open && !!record} onClose={onClose} title="השלמת משמרת שלא נסגרה">
      {record && (
        <ResolveForm
          key={record.id}
          record={record}
          onClose={onClose}
          onResolved={onResolved}
        />
      )}
    </Modal>
  )
}

function ResolveForm({
  record,
  onClose,
  onResolved,
}: {
  record: AttendanceRecord
  onClose: () => void
  onResolved: () => void
}) {
  const toast = useToast()

  const pendingBreak = record.breaks.find((b) => b.status === 'PendingReview')

  const defaultClockOut = `${record.workDate}T17:00`
  const [clockOutTime, setClockOutTime] = useState(defaultClockOut)
  const [breakEndTime, setBreakEndTime] = useState(() =>
    pendingBreak ? toDateTimeLocal(pendingBreak.breakStartTime) : '',
  )
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!clockOutTime) {
      setError('יש לבחור שעת יציאה משוערת.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await resolvePendingReview(record.id, {
        estimatedClockOutTime: fromDateTimeLocal(clockOutTime),
        estimatedBreakEndTime: pendingBreak && breakEndTime ? fromDateTimeLocal(breakEndTime) : null,
        note: note.trim() ? note.trim() : null,
      })
      toast.success('המשמרת עודכנה ונשלחה לאישור המנהל.')
      onResolved()
      onClose()
    } catch (err) {
      setError((err as ApiError).message ?? 'הפעולה נכשלה. נסו שוב.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-body)', margin: 0 }}>
          המשמרת מתאריך <strong>{formatDateHe(record.workDate)}</strong> לא נסגרה אוטומטית.
          אנא הזינו את שעת היציאה המשוערת.
        </p>

        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--surface-muted)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--fs-body)',
            color: 'var(--text-secondary)',
          }}
        >
          שעת כניסה: <span className="ltr">{wallClockTime(record.clockInTime)}</span>
        </div>

        <Input
          type="datetime-local"
          label="שעת יציאה משוערת"
          value={clockOutTime}
          onChange={(e) => setClockOutTime(e.target.value)}
          required
        />

        {pendingBreak && (
          <Input
            type="datetime-local"
            label="שעת סיום הפסקה משוערת"
            hint={`ההפסקה התחילה בשעה ${wallClockTime(pendingBreak.breakStartTime)}`}
            value={breakEndTime}
            onChange={(e) => setBreakEndTime(e.target.value)}
          />
        )}

        <Textarea
          label="הערה (לא חובה)"
          placeholder="לדוגמה: שכחתי לדווח יציאה לפני שיצאתי"
          value={note}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && (
          <p style={{ color: 'var(--danger-600)', fontSize: 'var(--fs-caption)' }}>{error}</p>
        )}
      </form>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--space-2)',
          marginTop: 'var(--space-5)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
          ביטול
        </Button>
        <Button type="submit" form={FORM_ID} loading={submitting} disabled={submitting}>
          שליחה לאישור
        </Button>
      </div>
    </>
  )
}
