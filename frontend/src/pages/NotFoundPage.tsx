import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useAuth } from '@/auth/useAuth'
import { paths } from '@/routes/paths'

/** 404 — route not found. */
export function NotFoundPage() {
  const { isAuthenticated } = useAuth()
  const home = isAuthenticated ? paths.myDay : paths.login

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
      <EmptyState
        icon={<Compass size={48} aria-hidden="true" />}
        title="העמוד לא נמצא"
        description="הקישור שאליו הגעתם אינו קיים או הוסר."
        action={
          <Link to={home}>
            <Button variant="secondary">חזרה</Button>
          </Link>
        }
      />
    </div>
  )
}
