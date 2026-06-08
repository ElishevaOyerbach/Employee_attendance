import { AlertCircle, FileClock } from 'lucide-react'
import { Button, Drawer, Spinner } from '@/components/ui'
import { EmptyState } from '@/components/feedback/EmptyState'
import { formatDateHe } from '@/lib/datetime'
import { useMyCorrections } from '@/features/corrections/useMyCorrections'
import { summarizeChange } from '@/features/corrections/corrections'
import { CorrectionStatusBadge } from '@/features/corrections/CorrectionStatusBadge'
import '@/features/corrections/corrections.css'

interface MyRequestsDrawerProps {
  open: boolean
  onClose: () => void
}

/**
 * Compact panel listing the employee's recent correction requests: the
 * requested change, status, manager note (if any), and creation date. Fetches
 * fresh each time it opens (mounts only while open).
 */
export function MyRequestsDrawer({ open, onClose }: MyRequestsDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title="הבקשות שלי">
      <MyRequestsContent />
    </Drawer>
  )
}

function MyRequestsContent() {
  const { items, loading, error, refresh } = useMyCorrections()

  if (loading) {
    return (
      <div style={{ display: 'grid', justifyItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-7) 0' }}>
        <Spinner />
        <p style={{ color: 'var(--text-secondary)' }}>טוען בקשות…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'grid', justifyItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-6) 0', color: 'var(--danger-600)', textAlign: 'center' }}>
        <AlertCircle size={28} aria-hidden="true" />
        <p>{error}</p>
        <Button variant="secondary" onClick={refresh}>
          נסו שוב
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<FileClock size={40} aria-hidden="true" />}
        title="אין עדיין בקשות"
        description="אפשר ליצור בקשת תיקון מתוך עמוד היסטוריית הנוכחות, בלחיצה על ״בקשת תיקון״ ליד המשמרת."
      />
    )
  }

  return (
    <div className="correction-list">
      {items.map((item) => (
        <article key={item.id} className="correction-item">
          <div className="correction-item__top">
            <span className="correction-item__change">{summarizeChange(item)}</span>
            <CorrectionStatusBadge status={item.status} />
          </div>
          <div className="correction-item__meta">נשלחה ב־{formatDateHe(item.createdAt)}</div>
          {item.employeeNote && (
            <div className="correction-item__note">{item.employeeNote}</div>
          )}
          {item.managerNote && (
            <div className="correction-item__note">
              <strong>הערת המנהל:</strong> {item.managerNote}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
