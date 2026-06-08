import { useState } from 'react'
import { ArrowLeft, Check, X } from 'lucide-react'
import { Button, Drawer, Input, Textarea } from '@/components/ui'
import type { ApiError } from '@/api/client'
import {
  reviewCorrection,
  type CorrectionRecord,
} from '@/api/corrections.api'
import { useToast } from '@/components/feedback/useToast'
import {
  formatDateHe,
  fromDateTimeLocal,
  toDateTimeLocal,
  wallClockTime,
} from '@/lib/datetime'
import { requestTypeLabel, targetFieldLabel } from './corrections'
import { CorrectionStatusBadge } from './CorrectionStatusBadge'
import './corrections.css'

interface ApprovalDrawerProps {
  open: boolean
  correction: CorrectionRecord | null
  employeeName: string
  onClose: () => void
  /** Called after a successful review so the queue can refresh. */
  onReviewed: () => void
}

/**
 * Manager decision panel for a single correction request: shows the requested
 * change in context and lets the manager approve (optionally overriding the
 * time) or reject, with a note.
 */
export function ApprovalDrawer({
  open,
  correction,
  employeeName,
  onClose,
  onReviewed,
}: ApprovalDrawerProps) {
  return (
    <Drawer open={open && !!correction} onClose={onClose} title="סקירת בקשת תיקון">
      {correction && (
        <ApprovalContent
          key={correction.id}
          correction={correction}
          employeeName={employeeName}
          onClose={onClose}
          onReviewed={onReviewed}
        />
      )}
    </Drawer>
  )
}

function ApprovalContent({
  correction,
  employeeName,
  onClose,
  onReviewed,
}: {
  correction: CorrectionRecord
  employeeName: string
  onClose: () => void
  onReviewed: () => void
}) {
  const toast = useToast()
  const isPending = correction.status === 'Pending'

  const [approvedTime, setApprovedTime] = useState(() =>
    toDateTimeLocal(correction.requestedTime),
  )
  const [managerNote, setManagerNote] = useState('')
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const review = async (approve: boolean) => {
    if (approve && !approvedTime) {
      setError('יש לבחור את השעה לאישור.')
      return
    }
    setSubmitting(approve ? 'approve' : 'reject')
    setError(null)
    try {
      await reviewCorrection(correction.id, {
        approve,
        approvedTime: approve ? fromDateTimeLocal(approvedTime) : null,
        managerNote: managerNote.trim() ? managerNote.trim() : null,
      })
      toast.success(approve ? 'הבקשה אושרה והשעה עודכנה.' : 'הבקשה נדחתה.')
      onReviewed()
      onClose()
    } catch (err) {
      setError((err as ApiError).message ?? 'הפעולה נכשלה. נסו שוב.')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="approval">
      <div className="approval__row">
        <span className="approval__label">עובד/ת</span>
        <span className="approval__value">{employeeName}</span>
      </div>

      <div className="approval__row">
        <span className="approval__label">משמרת</span>
        <span className="approval__value">{formatDateHe(correction.requestedTime)}</span>
      </div>

      <div className="approval__row">
        <span className="approval__label">
          {targetFieldLabel[correction.targetField]} · {requestTypeLabel[correction.requestType]}
        </span>
        <div className="approval__change">
          <del className="ltr">
            {correction.originalTime ? wallClockTime(correction.originalTime) : 'לא דווח'}
          </del>
          <ArrowLeft size={18} aria-hidden="true" />
          <ins className="ltr">{wallClockTime(correction.requestedTime)}</ins>
        </div>
      </div>

      {correction.employeeNote && (
        <div className="approval__row">
          <span className="approval__label">הערת העובד/ת</span>
          <div className="correction-item__note">{correction.employeeNote}</div>
        </div>
      )}

      <div className="approval__row">
        <span className="approval__label">נשלחה</span>
        <span className="approval__value">{formatDateHe(correction.createdAt)}</span>
      </div>

      {isPending ? (
        <>
          <div className="approval__divider" />

          <Input
            type="datetime-local"
            label="שעה לאישור (אפשר לכוונן)"
            value={approvedTime}
            onChange={(e) => setApprovedTime(e.target.value)}
          />

          <Textarea
            label="הערת מנהל (לא חובה)"
            placeholder="הערה שתוצג לעובד/ת"
            value={managerNote}
            maxLength={1000}
            onChange={(e) => setManagerNote(e.target.value)}
          />

          {error && <p className="approval__error">{error}</p>}

          <div className="correction-form__actions">
            <Button
              variant="danger"
              leadingIcon={<X size={16} aria-hidden="true" />}
              loading={submitting === 'reject'}
              disabled={submitting !== null}
              onClick={() => review(false)}
            >
              דחייה
            </Button>
            <Button
              leadingIcon={<Check size={16} aria-hidden="true" />}
              loading={submitting === 'approve'}
              disabled={submitting !== null}
              onClick={() => review(true)}
            >
              אישור
            </Button>
          </div>
        </>
      ) : (
        <div className="approval__row">
          <span className="approval__label">סטטוס</span>
          <div>
            <CorrectionStatusBadge status={correction.status} />
          </div>
          {correction.managerNote && (
            <div className="correction-item__note" style={{ marginTop: 'var(--space-2)' }}>
              <strong>הערת המנהל:</strong> {correction.managerNote}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
