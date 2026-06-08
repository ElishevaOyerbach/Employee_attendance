import { Badge } from '@/components/ui'
import type { CorrectionStatus } from '@/api/corrections.api'
import { statusMeta } from './corrections'

/** Status pill for a correction request (Pending / Approved / Rejected). */
export function CorrectionStatusBadge({ status }: { status: CorrectionStatus }) {
  const meta = statusMeta[status]
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  )
}
