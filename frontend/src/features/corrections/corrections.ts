import type { BadgeTone } from '@/components/ui'
import type {
  CorrectionRecord,
  CorrectionRequestType,
  CorrectionStatus,
  CorrectionTargetField,
} from '@/api/corrections.api'
import { wallClockTime } from '@/lib/datetime'

/** Hebrew label for the timestamp a correction targets. */
export const targetFieldLabel: Record<CorrectionTargetField, string> = {
  ClockIn: 'שעת כניסה',
  ClockOut: 'שעת יציאה',
  BreakStart: 'תחילת הפסקה',
  BreakEnd: 'סיום הפסקה',
}

/** Hebrew label for the kind of correction. */
export const requestTypeLabel: Record<CorrectionRequestType, string> = {
  MissingAction: 'דיווח חסר',
  TimeAdjustment: 'תיקון שעה',
}

/** Badge tone + label for each correction status. */
export const statusMeta: Record<CorrectionStatus, { label: string; tone: BadgeTone }> = {
  Pending: { label: 'ממתין לאישור', tone: 'warning' },
  Approved: { label: 'אושר', tone: 'success' },
  Rejected: { label: 'נדחה', tone: 'danger' },
}

/**
 * One-line summary of the requested change, e.g.
 * "שעת יציאה: 17:30 (במקום 17:05)".
 */
export function summarizeChange(c: CorrectionRecord): string {
  const field = targetFieldLabel[c.targetField]
  const requested = wallClockTime(c.requestedTime)
  if (c.originalTime) {
    return `${field}: ${requested} (במקום ${wallClockTime(c.originalTime)})`
  }
  return `${field}: ${requested}`
}
