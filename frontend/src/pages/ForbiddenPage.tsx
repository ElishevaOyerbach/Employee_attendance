import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui'
import { EmptyState } from '@/components/feedback/EmptyState'
import { paths } from '@/routes/paths'

/** 403 — authenticated but lacking permission for the requested route. */
export function ForbiddenPage() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <EmptyState
        icon={<ShieldAlert size={48} aria-hidden="true" />}
        title="אין הרשאה"
        description="אין לך הרשאה לצפות בעמוד זה. אם לדעתך מדובר בטעות, פנו למנהל המערכת."
        action={
          <Link to={paths.myDay}>
            <Button variant="secondary">חזרה לעמוד הבית</Button>
          </Link>
        }
      />
    </div>
  )
}
