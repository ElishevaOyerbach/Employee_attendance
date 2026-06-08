import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Input, Modal, Select, Textarea } from '@/components/ui'
import type { SelectOption } from '@/components/ui'
import type { ApiError } from '@/api/client'
import type { AttendanceRecord } from '@/api/attendance.api'
import {
  createCorrection,
  type CorrectionTargetField,
} from '@/api/corrections.api'
import { useToast } from '@/components/feedback/useToast'
import { fromDateTimeLocal, toDateTimeLocal, wallClockTime, formatDateHe } from '@/lib/datetime'
import { targetFieldLabel } from './corrections'
import './corrections.css'

interface RequestCorrectionModalProps {
  open: boolean
  /** The shift the correction is about. Null while closed. */
  record: AttendanceRecord | null
  onClose: () => void
  /** Called after a request is created successfully (e.g. to refresh a list). */
  onSuccess?: () => void
}

/** One selectable timestamp on the shift. */
interface TargetOption {
  key: string
  targetField: CorrectionTargetField
  breakId: number | null
  label: string
  originalTime: string | null
}

function buildOptions(record: AttendanceRecord): TargetOption[] {
  const options: TargetOption[] = [
    {
      key: 'ClockIn',
      targetField: 'ClockIn',
      breakId: null,
      label: targetFieldLabel.ClockIn,
      originalTime: record.clockInTime,
    },
    {
      key: 'ClockOut',
      targetField: 'ClockOut',
      breakId: null,
      label: targetFieldLabel.ClockOut,
      originalTime: record.clockOutTime,
    },
  ]

  record.breaks.forEach((b, i) => {
    const suffix = record.breaks.length > 1 ? ` ${i + 1}` : ''
    options.push({
      key: `BreakStart:${b.id}`,
      targetField: 'BreakStart',
      breakId: b.id,
      label: `${targetFieldLabel.BreakStart}${suffix}`,
      originalTime: b.breakStartTime,
    })
    options.push({
      key: `BreakEnd:${b.id}`,
      targetField: 'BreakEnd',
      breakId: b.id,
      label: `${targetFieldLabel.BreakEnd}${suffix}`,
      originalTime: b.breakEndTime,
    })
  })

  return options
}

/** Initial datetime-local value for an option: its current value, or a sensible default. */
function initialTime(option: TargetOption, record: AttendanceRecord): string {
  if (option.originalTime) return toDateTimeLocal(option.originalTime)
  const date = record.workDate.split('T')[0]
  return `${date}T17:00`
}

const FORM_ID = 'request-correction-form'

export function RequestCorrectionModal({
  open,
  record,
  onClose,
  onSuccess,
}: RequestCorrectionModalProps) {
  return (
    <Modal open={open && !!record} onClose={onClose} title="בקשת תיקון נוכחות">
      {record && (
        <CorrectionForm
          key={record.id}
          record={record}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  )
}

function CorrectionForm({
  record,
  onClose,
  onSuccess,
}: {
  record: AttendanceRecord
  onClose: () => void
  onSuccess?: () => void
}) {
  const toast = useToast()
  const options = useMemo(() => buildOptions(record), [record])

  const [selectedKey, setSelectedKey] = useState(options[0].key)
  const [requestedTime, setRequestedTime] = useState(() => initialTime(options[0], record))
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = options.find((o) => o.key === selectedKey) ?? options[0]

  const selectOptions: SelectOption[] = options.map((o) => ({
    value: o.key,
    label: o.originalTime ? `${o.label} · ${wallClockTime(o.originalTime)}` : `${o.label} · חסר`,
  }))

  const handleSelect = (key: string) => {
    const option = options.find((o) => o.key === key) ?? options[0]
    setSelectedKey(key)
    setRequestedTime(initialTime(option, record))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!requestedTime) {
      setError('יש לבחור תאריך ושעה.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await createCorrection({
        attendanceRecordId: record.id,
        breakId: selected.breakId,
        // No current value -> a missing action; otherwise a time adjustment.
        requestType: selected.originalTime ? 'TimeAdjustment' : 'MissingAction',
        targetField: selected.targetField,
        requestedTime: fromDateTimeLocal(requestedTime),
        note: note.trim() ? note.trim() : null,
      })
      toast.success('בקשת התיקון נשלחה לאישור המנהל.')
      onSuccess?.()
      onClose()
    } catch (err) {
      setError((err as ApiError).message ?? 'שליחת הבקשה נכשלה. נסו שוב.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form id={FORM_ID} onSubmit={handleSubmit} className="correction-form">
        <p className="correction-form__context">
          משמרת מתאריך <strong>{formatDateHe(record.workDate)}</strong>
        </p>

        <Select
          label="מה לתקן?"
          options={selectOptions}
          value={selectedKey}
          onChange={(e) => handleSelect(e.target.value)}
        />

        <div className="correction-form__current">
          ערך נוכחי:{' '}
          {selected.originalTime ? (
            <span className="ltr">{wallClockTime(selected.originalTime)}</span>
          ) : (
            <span className="correction-form__missing">לא דווח</span>
          )}
        </div>

        <Input
          type="datetime-local"
          label="השעה הנכונה"
          value={requestedTime}
          onChange={(e) => setRequestedTime(e.target.value)}
          required
        />

        <Textarea
          label="סיבת הבקשה (לא חובה)"
          placeholder="לדוגמה: שכחתי להחתים יציאה בסיום המשמרת"
          value={note}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && <p className="correction-form__error">{error}</p>}
      </form>

      <div className="correction-form__actions">
        <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
          ביטול
        </Button>
        <Button type="submit" form={FORM_ID} loading={submitting} disabled={submitting}>
          שליחת בקשה
        </Button>
      </div>
    </>
  )
}
