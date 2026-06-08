import { Badge } from '@/components/ui'
import type { BadgeTone } from '@/components/ui'

const meta: Record<string, { label: string; tone: BadgeTone }> = {
  Active: { label: 'פעילה', tone: 'info' },
  Completed: { label: 'הושלמה', tone: 'success' },
  PendingReview: { label: 'ממתינה לבדיקה', tone: 'warning' },
}

/** Status pill for an attendance record (shift). */
export function AttendanceStatusBadge({ status }: { status: string }) {
  const m = meta[status] ?? { label: status, tone: 'neutral' as BadgeTone }
  return <Badge tone={m.tone}>{m.label}</Badge>
}
