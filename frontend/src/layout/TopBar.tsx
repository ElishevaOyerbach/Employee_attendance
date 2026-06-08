import { Bell } from 'lucide-react'
import { ServerClock } from './ServerClock'
import { UserMenu } from './UserMenu'

export function TopBar() {
  return (
    <header className="topbar">
      <ServerClock />
      <div className="topbar__spacer" />
      <div className="topbar__actions">
        <button
          className="btn btn--ghost btn--sm"
          aria-label="התראות"
          title="התראות"
          style={{ padding: 'var(--space-2)' }}
        >
          <Bell size={18} aria-hidden="true" />
        </button>
        <UserMenu />
      </div>
    </header>
  )
}
